"""Securities intake service (R9)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    OrgRoleEnum,
    SecurityCustodyPosition,
    SecurityInstrument,
    SecurityIntakeRequest,
)
from app.schemas.securities import (
    SecurityCustodyPositionPublic,
    SecurityDeskSummary,
    SecurityInstrumentPublic,
    SecurityIntakeCreate,
    SecurityIntakePublic,
    SecurityIntakeReview,
    SecurityIntakeStatus,
)
from app.services.org_access import require_org_role


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _credit(face: Decimal, haircut_bps: int) -> Decimal:
    return (face * Decimal(10000 - haircut_bps) / Decimal(10000)).quantize(Decimal("0.00000001"))


def _instrument_public(row: SecurityInstrument) -> SecurityInstrumentPublic:
    return SecurityInstrumentPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        instrument_type=row.instrument_type,
        issuer_name=row.issuer_name,
        jurisdiction=row.jurisdiction,
        face_amount=Decimal(str(row.face_amount)),
        currency=row.currency,
        isin=row.isin,
        maturity_at=row.maturity_at,
        share_count=Decimal(str(row.share_count)) if row.share_count is not None else None,
        document_hash=row.document_hash,
        document_uri=row.document_uri,
        metadata_json=row.metadata_json or {},
        created_at=row.created_at,
    )


def _intake_public(row: SecurityIntakeRequest) -> SecurityIntakePublic:
    return SecurityIntakePublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        instrument_id=uuid.UUID(str(row.instrument_id)),
        status=row.status,
        submitted_by=uuid.UUID(str(row.submitted_by)),
        reviewer_id=uuid.UUID(str(row.reviewer_id)) if row.reviewer_id else None,
        rejection_reason=row.rejection_reason,
        notes=row.notes,
        created_at=row.created_at,
        updated_at=row.updated_at,
        submitted_at=row.submitted_at,
        reviewed_at=row.reviewed_at,
        instrument=_instrument_public(row.instrument) if getattr(row, "instrument", None) else None,
    )


def _position_public(row: SecurityCustodyPosition) -> SecurityCustodyPositionPublic:
    return SecurityCustodyPositionPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        instrument_id=uuid.UUID(str(row.instrument_id)),
        intake_id=uuid.UUID(str(row.intake_id)),
        location=row.location,
        custodian_ref=row.custodian_ref,
        haircut_bps=int(row.haircut_bps),
        collateral_credit_acp=Decimal(str(row.collateral_credit_acp)),
        status=row.status,
        created_at=row.created_at,
    )


async def create_intake(
    session: AsyncSession, *, org_id: str, user_id: str, body: SecurityIntakeCreate
) -> SecurityIntakePublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    instrument = SecurityInstrument(
        org_id=org_id,
        instrument_type=body.instrument_type.value,
        issuer_name=body.issuer_name.strip(),
        jurisdiction=body.jurisdiction.strip(),
        face_amount=body.face_amount,
        currency=body.currency.upper(),
        isin=body.isin,
        maturity_at=body.maturity_at,
        share_count=body.share_count,
        document_hash=body.document_hash,
        document_uri=body.document_uri,
        metadata_json=body.metadata_json or {},
    )
    session.add(instrument)
    await session.flush()
    intake = SecurityIntakeRequest(
        org_id=org_id,
        instrument_id=str(instrument.id),
        status=SecurityIntakeStatus.draft.value,
        submitted_by=user_id,
        notes=body.notes,
    )
    session.add(intake)
    await session.flush()
    return await get_intake(session, org_id=org_id, user_id=user_id, intake_id=str(intake.id))


async def list_intakes(session: AsyncSession, *, org_id: str, user_id: str) -> list[SecurityIntakePublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(SecurityIntakeRequest)
        .where(SecurityIntakeRequest.org_id == org_id)
        .options(selectinload(SecurityIntakeRequest.instrument))
        .order_by(SecurityIntakeRequest.created_at.desc())
    )
    return [_intake_public(r) for r in q.scalars().all()]


async def get_intake(
    session: AsyncSession, *, org_id: str, user_id: str, intake_id: str
) -> SecurityIntakePublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(SecurityIntakeRequest)
        .where(SecurityIntakeRequest.id == intake_id, SecurityIntakeRequest.org_id == org_id)
        .options(selectinload(SecurityIntakeRequest.instrument))
    )
    row = q.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Intake not found")
    return _intake_public(row)


async def submit_intake(
    session: AsyncSession, *, org_id: str, user_id: str, intake_id: str
) -> SecurityIntakePublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    q = await session.execute(
        select(SecurityIntakeRequest)
        .where(SecurityIntakeRequest.id == intake_id, SecurityIntakeRequest.org_id == org_id)
        .options(selectinload(SecurityIntakeRequest.instrument))
    )
    row = q.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Intake not found")
    if row.status not in {SecurityIntakeStatus.draft.value, SecurityIntakeStatus.returned.value}:
        raise HTTPException(status_code=409, detail="Intake cannot be submitted from current status")
    row.status = SecurityIntakeStatus.submitted.value
    row.submitted_at = _utcnow()
    row.updated_at = _utcnow()
    await session.flush()
    return await get_intake(session, org_id=org_id, user_id=user_id, intake_id=intake_id)


async def review_intake(
    session: AsyncSession,
    *,
    org_id: str,
    user_id: str,
    intake_id: str,
    body: SecurityIntakeReview,
) -> SecurityIntakePublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    allowed = {
        SecurityIntakeStatus.accepted,
        SecurityIntakeStatus.rejected,
        SecurityIntakeStatus.under_review,
        SecurityIntakeStatus.returned,
    }
    if body.decision not in allowed:
        raise HTTPException(status_code=400, detail="Invalid review decision")
    q = await session.execute(
        select(SecurityIntakeRequest)
        .where(SecurityIntakeRequest.id == intake_id, SecurityIntakeRequest.org_id == org_id)
        .options(selectinload(SecurityIntakeRequest.instrument))
    )
    row = q.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Intake not found")
    if row.status not in {SecurityIntakeStatus.submitted.value, SecurityIntakeStatus.under_review.value}:
        raise HTTPException(status_code=409, detail="Intake is not awaiting review")
    row.status = body.decision.value
    row.reviewer_id = user_id
    row.reviewed_at = _utcnow()
    row.updated_at = _utcnow()
    row.rejection_reason = (
        body.rejection_reason if body.decision == SecurityIntakeStatus.rejected else None
    )
    if body.decision == SecurityIntakeStatus.accepted:
        session.add(
            SecurityCustodyPosition(
                org_id=org_id,
                instrument_id=str(row.instrument_id),
                intake_id=str(row.id),
                location=body.custody_location.value,
                custodian_ref=body.custodian_ref,
                haircut_bps=body.haircut_bps,
                collateral_credit_acp=_credit(Decimal(str(row.instrument.face_amount)), body.haircut_bps),
                status="active",
            )
        )
    await session.flush()
    return await get_intake(session, org_id=org_id, user_id=user_id, intake_id=intake_id)


async def list_positions(
    session: AsyncSession, *, org_id: str, user_id: str
) -> list[SecurityCustodyPositionPublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(SecurityCustodyPosition)
        .where(SecurityCustodyPosition.org_id == org_id)
        .order_by(SecurityCustodyPosition.created_at.desc())
    )
    return [_position_public(r) for r in q.scalars().all()]


async def desk_summary(session: AsyncSession, *, org_id: str, user_id: str) -> SecurityDeskSummary:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    total = (
        await session.execute(
            select(func.count())
            .select_from(SecurityIntakeRequest)
            .where(SecurityIntakeRequest.org_id == org_id)
        )
    ).scalar_one()
    open_count = (
        await session.execute(
            select(func.count())
            .select_from(SecurityIntakeRequest)
            .where(
                SecurityIntakeRequest.org_id == org_id,
                SecurityIntakeRequest.status.in_(
                    [
                        SecurityIntakeStatus.draft.value,
                        SecurityIntakeStatus.submitted.value,
                        SecurityIntakeStatus.under_review.value,
                        SecurityIntakeStatus.returned.value,
                    ]
                ),
            )
        )
    ).scalar_one()
    positions = (
        await session.execute(
            select(func.count())
            .select_from(SecurityCustodyPosition)
            .where(
                SecurityCustodyPosition.org_id == org_id,
                SecurityCustodyPosition.status == "active",
            )
        )
    ).scalar_one()
    credit = (
        await session.execute(
            select(func.coalesce(func.sum(SecurityCustodyPosition.collateral_credit_acp), 0)).where(
                SecurityCustodyPosition.org_id == org_id,
                SecurityCustodyPosition.status == "active",
            )
        )
    ).scalar_one()
    return SecurityDeskSummary(
        org_id=uuid.UUID(str(org_id)),
        intakes_total=int(total or 0),
        intakes_open=int(open_count or 0),
        positions_active=int(positions or 0),
        collateral_credit_acp_total=Decimal(str(credit or 0)),
    )
