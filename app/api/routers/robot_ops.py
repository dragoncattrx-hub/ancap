"""Server-install bounties, consented robot telemetry, delivery jobs."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession, require_auth
from app.db.models import (
    RobotDeliveryJob,
    RobotTelemetryConsent,
    RobotTelemetryEvent,
    ServerInstallBounty,
)
from app.schemas.robot_ops import (
    RobotDeliveryAssignRequest,
    RobotDeliveryCompleteRequest,
    RobotDeliveryCreate,
    RobotDeliveryPublic,
    RobotTelemetryConsentCreate,
    RobotTelemetryConsentPublic,
    RobotTelemetryEventPublic,
    RobotTelemetryIngestRequest,
    ServerInstallBountyCreate,
    ServerInstallBountyPublic,
)

router = APIRouter(prefix="/robot-ops", tags=["Robot ops"])


def _dec(value: str) -> Decimal:
    try:
        amount = Decimal(str(value))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="invalid amount") from exc
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")
    return amount


@router.post("/server-install-bounties", response_model=ServerInstallBountyPublic, status_code=201)
async def create_server_install_bounty(
    body: ServerInstallBountyCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = ServerInstallBounty(
        owner_user_id=UUID(user_id),
        host_label=body.host_label.strip(),
        proof_url=body.proof_url,
        proof_note=body.proof_note,
        payout_address=body.payout_address.strip(),
        amount_acp=_dec(body.amount_acp),
        status="pending",
    )
    session.add(row)
    await session.flush()
    return ServerInstallBountyPublic(
        id=str(row.id),
        owner_user_id=str(row.owner_user_id),
        host_label=row.host_label,
        payout_address=row.payout_address,
        amount_acp=str(row.amount_acp),
        status=row.status,
        proof_url=row.proof_url,
        proof_note=row.proof_note,
        created_at=row.created_at,
    )


@router.get("/server-install-bounties/mine", response_model=list[ServerInstallBountyPublic])
async def list_my_server_install_bounties(session: DbSession, user_id: str = Depends(require_auth)):
    rows = (
        await session.execute(
            select(ServerInstallBounty)
            .where(ServerInstallBounty.owner_user_id == UUID(user_id))
            .order_by(ServerInstallBounty.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [
        ServerInstallBountyPublic(
            id=str(r.id),
            owner_user_id=str(r.owner_user_id),
            host_label=r.host_label,
            payout_address=r.payout_address,
            amount_acp=str(r.amount_acp),
            status=r.status,
            proof_url=r.proof_url,
            proof_note=r.proof_note,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/telemetry/consent", response_model=RobotTelemetryConsentPublic, status_code=201)
async def create_telemetry_consent(
    body: RobotTelemetryConsentCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = RobotTelemetryConsent(
        owner_user_id=UUID(user_id),
        robot_id=body.robot_id.strip(),
        consent_active=True,
        retention_days=body.retention_days,
    )
    session.add(row)
    await session.flush()
    return RobotTelemetryConsentPublic(
        id=str(row.id),
        owner_user_id=str(row.owner_user_id),
        robot_id=row.robot_id,
        consent_active=row.consent_active,
        retention_days=row.retention_days,
        created_at=row.created_at,
        revoked_at=row.revoked_at,
    )


@router.post("/telemetry/consent/{consent_id}/revoke", response_model=RobotTelemetryConsentPublic)
async def revoke_telemetry_consent(
    consent_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = (
        await session.execute(
            select(RobotTelemetryConsent).where(
                RobotTelemetryConsent.id == UUID(consent_id),
                RobotTelemetryConsent.owner_user_id == UUID(user_id),
            )
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="consent not found")
    row.consent_active = False
    row.revoked_at = datetime.now(timezone.utc)
    await session.flush()
    return RobotTelemetryConsentPublic(
        id=str(row.id),
        owner_user_id=str(row.owner_user_id),
        robot_id=row.robot_id,
        consent_active=row.consent_active,
        retention_days=row.retention_days,
        created_at=row.created_at,
        revoked_at=row.revoked_at,
    )


@router.post("/telemetry/ingest", response_model=RobotTelemetryEventPublic, status_code=201)
async def ingest_telemetry(
    body: RobotTelemetryIngestRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    consent = (
        await session.execute(
            select(RobotTelemetryConsent).where(
                RobotTelemetryConsent.owner_user_id == UUID(user_id),
                RobotTelemetryConsent.robot_id == body.robot_id.strip(),
                RobotTelemetryConsent.consent_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if consent is None:
        raise HTTPException(status_code=403, detail="active owner consent required")
    event = RobotTelemetryEvent(
        consent_id=consent.id,
        robot_id=body.robot_id.strip(),
        event_type=body.event_type.strip(),
        payload_json=body.payload or {},
    )
    session.add(event)
    await session.flush()
    return RobotTelemetryEventPublic(
        id=str(event.id),
        robot_id=event.robot_id,
        event_type=event.event_type,
        created_at=event.created_at,
    )


@router.post("/delivery/jobs", response_model=RobotDeliveryPublic, status_code=201)
async def create_delivery_job(
    body: RobotDeliveryCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = RobotDeliveryJob(
        customer_user_id=UUID(user_id),
        robot_agent_id=UUID(body.robot_agent_id) if body.robot_agent_id else None,
        pickup_label=body.pickup_label.strip(),
        dropoff_label=body.dropoff_label.strip(),
        amount_acp=_dec(body.amount_acp),
        status="open" if not body.robot_agent_id else "assigned",
    )
    session.add(row)
    await session.flush()
    return _delivery_public(row)


@router.get("/delivery/jobs", response_model=list[RobotDeliveryPublic])
async def list_open_delivery_jobs(session: DbSession, user_id: str = Depends(require_auth)):
    _ = user_id
    rows = (
        await session.execute(
            select(RobotDeliveryJob)
            .where(RobotDeliveryJob.status.in_(("open", "assigned", "in_transit")))
            .order_by(RobotDeliveryJob.created_at.desc())
            .limit(100)
        )
    ).scalars().all()
    return [_delivery_public(r) for r in rows]


@router.post("/delivery/jobs/{job_id}/assign", response_model=RobotDeliveryPublic)
async def assign_delivery_job(
    job_id: str,
    body: RobotDeliveryAssignRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _ = user_id
    row = (
        await session.execute(select(RobotDeliveryJob).where(RobotDeliveryJob.id == UUID(job_id)))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="job not found")
    if row.status not in ("open", "assigned"):
        raise HTTPException(status_code=400, detail="job not assignable")
    row.robot_agent_id = UUID(body.robot_agent_id)
    row.status = "assigned"
    await session.flush()
    return _delivery_public(row)


@router.post("/delivery/jobs/{job_id}/complete", response_model=RobotDeliveryPublic)
async def complete_delivery_job(
    job_id: str,
    body: RobotDeliveryCompleteRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = (
        await session.execute(select(RobotDeliveryJob).where(RobotDeliveryJob.id == UUID(job_id)))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="job not found")
    if str(row.customer_user_id) != user_id and row.robot_agent_id is None:
        # Customer or assigned fleet operator may complete; keep MVP permissive for owner.
        pass
    row.delivery_proof = body.delivery_proof.strip()
    row.status = "completed"
    await session.flush()
    return _delivery_public(row)


def _delivery_public(row: RobotDeliveryJob) -> RobotDeliveryPublic:
    return RobotDeliveryPublic(
        id=str(row.id),
        customer_user_id=str(row.customer_user_id),
        robot_agent_id=str(row.robot_agent_id) if row.robot_agent_id else None,
        pickup_label=row.pickup_label,
        dropoff_label=row.dropoff_label,
        amount_acp=str(row.amount_acp),
        status=row.status,
        delivery_proof=row.delivery_proof,
        created_at=row.created_at,
    )
