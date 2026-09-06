"""AETERNA longevity marketplace service (R12)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import (
    AeternaDnaVaultEntry,
    AeternaIntentOrder,
    AeternaPartner,
    OrgRoleEnum,
)
from app.schemas.aeterna import (
    AeternaDnaVaultCreate,
    AeternaDnaVaultPublic,
    AeternaIntentOrderCreate,
    AeternaIntentOrderPublic,
    AeternaOrderStatus,
    AeternaPartnerCreate,
    AeternaPartnerPublic,
    AeternaStatusPublic,
    AeternaVaultStatus,
)
from app.services.org_access import require_org_role

AETERNA_WORKFLOW_SLUGS = [
    "aeterna-dna-wellness-report",
    "aeterna-longevity-panel-brief",
    "aeterna-pigmentation-consult-brief",
    "aeterna-telomere-panel-review",
    "aeterna-disease-risk-navigator",
]

_COMPLIANCE = (
    "AETERNA sells ACP-paid analysis, consult briefs, and licensed-partner handoffs only. "
    "No DIY CRISPR/Cas9 protocols, gene synthesis, or unlicensed enhancement procedures."
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _feature_enabled() -> bool:
    return bool(getattr(get_settings(), "ff_aeterna", False))


def _vault_public(row: AeternaDnaVaultEntry) -> AeternaDnaVaultPublic:
    return AeternaDnaVaultPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)) if row.org_id else None,
        owner_user_id=uuid.UUID(str(row.owner_user_id)),
        label=row.label,
        source=row.source,
        source_uri=row.source_uri,
        content_sha256=row.content_sha256,
        format_hint=row.format_hint,
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _order_public(row: AeternaIntentOrder) -> AeternaIntentOrderPublic:
    return AeternaIntentOrderPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)) if row.org_id else None,
        owner_user_id=uuid.UUID(str(row.owner_user_id)),
        intent_kind=row.intent_kind,
        vault_id=uuid.UUID(str(row.vault_id)) if row.vault_id else None,
        workflow_slug=row.workflow_slug,
        status=row.status,
        budget_acp=row.budget_acp,
        notes=row.notes,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _partner_public(row: AeternaPartner) -> AeternaPartnerPublic:
    return AeternaPartnerPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        name=row.name,
        jurisdiction=row.jurisdiction,
        license_ref=row.license_ref,
        website=row.website,
        supported_intents=list(row.supported_intents or []),
        verified=bool(row.verified),
        created_at=row.created_at,
    )


async def division_status(session: AsyncSession) -> AeternaStatusPublic:
    enabled = _feature_enabled()
    vaults = (await session.execute(select(func.count()).select_from(AeternaDnaVaultEntry))).scalar_one()
    orders = (await session.execute(select(func.count()).select_from(AeternaIntentOrder))).scalar_one()
    partners = (
        await session.execute(
            select(func.count()).select_from(AeternaPartner).where(AeternaPartner.verified.is_(True))
        )
    ).scalar_one()
    return AeternaStatusPublic(
        feature_enabled=enabled,
        tagline="Eternal life rails: DNA vault, ACP workflows, licensed longevity partners.",
        vault_entries=int(vaults or 0),
        intent_orders=int(orders or 0),
        partners_verified=int(partners or 0),
        workflow_slugs=list(AETERNA_WORKFLOW_SLUGS),
        sequencing_import_hint="Export from https://sequencing.com/ then register SHA-256 + optional source_uri.",
        compliance_note=_COMPLIANCE,
        next_gate="Enable FF_AETERNA" if not enabled else "A2 checkout UX + partner verification queue",
    )


async def create_vault_entry(
    session: AsyncSession, *, user_id: str, body: AeternaDnaVaultCreate, org_id: str | None = None
) -> AeternaDnaVaultPublic:
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="AETERNA feature flag disabled")
    if not body.consent_acknowledged:
        raise HTTPException(status_code=400, detail="consent_acknowledged required")
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    now = _utcnow()
    row = AeternaDnaVaultEntry(
        org_id=org_id,
        owner_user_id=user_id,
        label=body.label.strip(),
        source=body.source.value,
        source_uri=body.source_uri,
        content_sha256=body.content_sha256.lower(),
        format_hint=body.format_hint.strip().lower() or "vcf",
        status=AeternaVaultStatus.indexed.value,
        metadata_json=body.metadata_json or {},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _vault_public(row)


async def list_vault_entries(
    session: AsyncSession, *, user_id: str, org_id: str | None = None
) -> list[AeternaDnaVaultPublic]:
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
        stmt = select(AeternaDnaVaultEntry).where(AeternaDnaVaultEntry.org_id == org_id)
    else:
        stmt = select(AeternaDnaVaultEntry).where(AeternaDnaVaultEntry.owner_user_id == user_id)
    stmt = stmt.order_by(AeternaDnaVaultEntry.created_at.desc())
    return [_vault_public(r) for r in (await session.execute(stmt)).scalars().all()]


async def create_intent_order(
    session: AsyncSession, *, user_id: str, body: AeternaIntentOrderCreate, org_id: str | None = None
) -> AeternaIntentOrderPublic:
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="AETERNA feature flag disabled")
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    if body.vault_id:
        vault = await session.get(AeternaDnaVaultEntry, str(body.vault_id))
        if vault is None:
            raise HTTPException(status_code=404, detail="DNA vault entry not found")
        if vault.owner_user_id != user_id and (not org_id or vault.org_id != org_id):
            raise HTTPException(status_code=403, detail="Vault entry not accessible")
    slug = body.workflow_slug
    if slug and slug not in AETERNA_WORKFLOW_SLUGS:
        raise HTTPException(status_code=400, detail="Unknown AETERNA workflow_slug")
    now = _utcnow()
    row = AeternaIntentOrder(
        org_id=org_id,
        owner_user_id=user_id,
        intent_kind=body.intent_kind.value,
        vault_id=str(body.vault_id) if body.vault_id else None,
        workflow_slug=slug,
        status=AeternaOrderStatus.draft.value,
        budget_acp=body.budget_acp,
        notes=body.notes,
        metadata_json=body.metadata_json or {},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _order_public(row)


async def list_intent_orders(
    session: AsyncSession, *, user_id: str, org_id: str | None = None
) -> list[AeternaIntentOrderPublic]:
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
        stmt = select(AeternaIntentOrder).where(AeternaIntentOrder.org_id == org_id)
    else:
        stmt = select(AeternaIntentOrder).where(AeternaIntentOrder.owner_user_id == user_id)
    stmt = stmt.order_by(AeternaIntentOrder.created_at.desc())
    return [_order_public(r) for r in (await session.execute(stmt)).scalars().all()]


async def create_partner(
    session: AsyncSession, *, org_id: str, user_id: str, body: AeternaPartnerCreate
) -> AeternaPartnerPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="AETERNA feature flag disabled")
    now = _utcnow()
    row = AeternaPartner(
        org_id=org_id,
        name=body.name.strip(),
        jurisdiction=body.jurisdiction.strip(),
        license_ref=body.license_ref,
        website=body.website,
        supported_intents=[i.value for i in body.supported_intents],
        verified=False,
        metadata_json=body.metadata_json or {},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _partner_public(row)


async def list_partners(
    session: AsyncSession, *, org_id: str, user_id: str
) -> list[AeternaPartnerPublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(AeternaPartner)
        .where(AeternaPartner.org_id == org_id)
        .order_by(AeternaPartner.created_at.desc())
    )
    return [_partner_public(r) for r in q.scalars().all()]


async def org_summary(session: AsyncSession, *, org_id: str, user_id: str) -> AeternaStatusPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    base = await division_status(session)
    vaults = (
        await session.execute(
            select(func.count()).select_from(AeternaDnaVaultEntry).where(AeternaDnaVaultEntry.org_id == org_id)
        )
    ).scalar_one()
    orders = (
        await session.execute(
            select(func.count()).select_from(AeternaIntentOrder).where(AeternaIntentOrder.org_id == org_id)
        )
    ).scalar_one()
    partners = (
        await session.execute(
            select(func.count())
            .select_from(AeternaPartner)
            .where(AeternaPartner.org_id == org_id, AeternaPartner.verified.is_(True))
        )
    ).scalar_one()
    return base.model_copy(
        update={
            "vault_entries": int(vaults or 0),
            "intent_orders": int(orders or 0),
            "partners_verified": int(partners or 0),
        }
    )
