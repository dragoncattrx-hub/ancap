"""Orbital sealed-edge control plane (R11)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import OrbitalAttestation, OrbitalEdgeNode, OrgRoleEnum
from app.schemas.orbital_edge import (
    OrbitalAttestationCreate,
    OrbitalAttestationPublic,
    OrbitalEdgeStatusPublic,
    OrbitalNodeCreate,
    OrbitalNodePublic,
    OrbitalNodeStatus,
    OrbitalNodeUpdate,
)
from app.services.org_access import require_org_role


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _feature_enabled() -> bool:
    return bool(getattr(get_settings(), "ff_orbital_edge", False))


def _node_public(row: OrbitalEdgeNode) -> OrbitalNodePublic:
    return OrbitalNodePublic(
        id=uuid.UUID(str(row.id)),
        codename=row.codename,
        norad_id=row.norad_id,
        launch_provider=row.launch_provider,
        rideshare_slot=row.rideshare_slot,
        mass_kg=float(row.mass_kg) if row.mass_kg is not None else None,
        status=row.status,
        feature_enabled=_feature_enabled(),
        metadata_json=row.metadata_json or {},
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _attestation_public(row: OrbitalAttestation) -> OrbitalAttestationPublic:
    return OrbitalAttestationPublic(
        id=uuid.UUID(str(row.id)),
        node_id=uuid.UUID(str(row.node_id)),
        kind=row.kind,
        digest_sha256=row.digest_sha256,
        payload_uri=row.payload_uri,
        verified=bool(row.verified),
        created_at=row.created_at,
        metadata_json=row.metadata_json or {},
    )


async def edge_status(session: AsyncSession) -> OrbitalEdgeStatusPublic:
    enabled = _feature_enabled()
    total = (await session.execute(select(func.count()).select_from(OrbitalEdgeNode))).scalar_one()
    nominal = (
        await session.execute(
            select(func.count())
            .select_from(OrbitalEdgeNode)
            .where(OrbitalEdgeNode.status == OrbitalNodeStatus.nominal.value)
        )
    ).scalar_one()
    verified = (
        await session.execute(
            select(func.count()).select_from(OrbitalAttestation).where(OrbitalAttestation.verified.is_(True))
        )
    ).scalar_one()
    return OrbitalEdgeStatusPublic(
        feature_enabled=enabled,
        nodes_total=int(total or 0),
        nodes_nominal=int(nominal or 0),
        attestations_verified=int(verified or 0),
        next_gate="X0 feasibility memo" if enabled else "Enable FF_ORBITAL_EDGE",
        notes=(
            "Control-plane registry only: no live spacecraft command uplink in this phase."
            if enabled
            else "Feature flagged off. Registry endpoints remain readable for planning."
        ),
    )


async def create_node(
    session: AsyncSession, *, org_id: str, user_id: str, body: OrbitalNodeCreate
) -> OrbitalNodePublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="Orbital edge feature flag disabled")
    row = OrbitalEdgeNode(
        org_id=org_id,
        codename=body.codename.strip(),
        norad_id=body.norad_id,
        launch_provider=body.launch_provider.strip().lower(),
        rideshare_slot=body.rideshare_slot,
        mass_kg=body.mass_kg,
        status=body.status.value,
        metadata_json=body.metadata_json or {},
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return _node_public(row)


async def list_nodes(session: AsyncSession, *, org_id: str, user_id: str) -> list[OrbitalNodePublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(OrbitalEdgeNode)
        .where(OrbitalEdgeNode.org_id == org_id)
        .order_by(OrbitalEdgeNode.created_at.desc())
    )
    return [_node_public(r) for r in q.scalars().all()]


async def update_node(
    session: AsyncSession,
    *,
    org_id: str,
    user_id: str,
    node_id: str,
    body: OrbitalNodeUpdate,
) -> OrbitalNodePublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="Orbital edge feature flag disabled")
    q = await session.execute(
        select(OrbitalEdgeNode).where(OrbitalEdgeNode.id == node_id, OrbitalEdgeNode.org_id == org_id)
    )
    row = q.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Orbital node not found")
    if body.status is not None:
        row.status = body.status.value
    if body.norad_id is not None:
        row.norad_id = body.norad_id
    if body.rideshare_slot is not None:
        row.rideshare_slot = body.rideshare_slot
    if body.metadata_json is not None:
        row.metadata_json = body.metadata_json
    row.updated_at = _utcnow()
    await session.flush()
    await session.refresh(row)
    return _node_public(row)


async def add_attestation(
    session: AsyncSession,
    *,
    org_id: str,
    user_id: str,
    node_id: str,
    body: OrbitalAttestationCreate,
) -> OrbitalAttestationPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="Orbital edge feature flag disabled")
    q = await session.execute(
        select(OrbitalEdgeNode).where(OrbitalEdgeNode.id == node_id, OrbitalEdgeNode.org_id == org_id)
    )
    node = q.scalar_one_or_none()
    if not node:
        raise HTTPException(status_code=404, detail="Orbital node not found")
    row = OrbitalAttestation(
        node_id=str(node.id),
        kind=body.kind.value,
        digest_sha256=body.digest_sha256.lower(),
        payload_uri=body.payload_uri,
        verified=body.verified,
        metadata_json=body.metadata_json or {},
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return _attestation_public(row)


async def list_attestations(
    session: AsyncSession, *, org_id: str, user_id: str, node_id: str
) -> list[OrbitalAttestationPublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(OrbitalEdgeNode).where(OrbitalEdgeNode.id == node_id, OrbitalEdgeNode.org_id == org_id)
    )
    if q.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Orbital node not found")
    aq = await session.execute(
        select(OrbitalAttestation)
        .where(OrbitalAttestation.node_id == node_id)
        .order_by(OrbitalAttestation.created_at.desc())
    )
    return [_attestation_public(r) for r in aq.scalars().all()]
