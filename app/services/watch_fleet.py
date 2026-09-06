"""Apple Watch HR fleet — inventory, rotation, HR ingest (R10 / W1)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Organization,
    OrgRoleEnum,
    WatchAsset,
    WatchHeartRateSample,
    WatchRotationPolicy,
)
from app.schemas.watch_fleet import (
    HeartRateIngestRequest,
    HeartRateSamplePublic,
    WatchAssetCreate,
    WatchAssetPublic,
    WatchAssetStatus,
    WatchFleetSummary,
    WatchRotateRequest,
    WatchRotationPolicyPublic,
    WatchRotationPolicyUpsert,
    WatchSlot,
)
from app.services.org_access import require_org_role


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _asset_public(row: WatchAsset) -> WatchAssetPublic:
    return WatchAssetPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        employee_user_id=uuid.UUID(str(row.employee_user_id)),
        slot=WatchSlot(row.slot),
        band_color=row.band_color,
        serial_number=row.serial_number,
        status=WatchAssetStatus(row.status),
        battery_percent=row.battery_percent,
        last_rotated_at=row.last_rotated_at,
        created_at=row.created_at,
    )


def _policy_public(row: WatchRotationPolicy) -> WatchRotationPolicyPublic:
    return WatchRotationPolicyPublic(
        org_id=uuid.UUID(str(row.org_id)),
        enabled=bool(row.enabled),
        rotation_interval_minutes=int(row.rotation_interval_minutes),
        min_soc_percent=int(row.min_soc_percent),
        grace_minutes=int(row.grace_minutes),
        viewer_roles=list(row.viewer_roles or []),
        updated_at=row.updated_at,
    )


def _hr_public(row: WatchHeartRateSample) -> HeartRateSamplePublic:
    return HeartRateSamplePublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        employee_user_id=uuid.UUID(str(row.employee_user_id)),
        watch_asset_id=uuid.UUID(str(row.watch_asset_id)) if row.watch_asset_id else None,
        bpm=int(row.bpm),
        on_shift=bool(row.on_shift),
        source=row.source,
        recorded_at=row.recorded_at,
    )


async def _org_or_404(session: AsyncSession, org_id: str) -> Organization:
    org = await session.get(Organization, org_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


async def create_watch_asset(
    session: AsyncSession, *, org_id: str, user_id: str, body: WatchAssetCreate
) -> WatchAssetPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    await _org_or_404(session, org_id)

    dup = (
        await session.execute(
            select(WatchAsset).where(
                WatchAsset.org_id == org_id,
                WatchAsset.serial_number == body.serial_number.strip(),
            )
        )
    ).scalar_one_or_none()
    if dup is not None:
        raise HTTPException(status_code=409, detail="Serial number already registered in this org")

    emp = str(body.employee_user_id)
    slot_taken = (
        await session.execute(
            select(WatchAsset).where(
                WatchAsset.org_id == org_id,
                WatchAsset.employee_user_id == emp,
                WatchAsset.slot == body.slot.value,
            )
        )
    ).scalar_one_or_none()
    if slot_taken is not None:
        raise HTTPException(status_code=409, detail=f"Slot {body.slot.value} already assigned")

    if body.status == WatchAssetStatus.active:
        other = (
            await session.execute(
                select(WatchAsset).where(
                    WatchAsset.org_id == org_id,
                    WatchAsset.employee_user_id == emp,
                    WatchAsset.status == WatchAssetStatus.active.value,
                )
            )
        ).scalar_one_or_none()
        if other is not None:
            raise HTTPException(status_code=409, detail="Employee already has an active watch")

    now = _utcnow()
    row = WatchAsset(
        org_id=org_id,
        employee_user_id=emp,
        slot=body.slot.value,
        band_color=body.band_color.strip(),
        serial_number=body.serial_number.strip(),
        status=body.status.value,
        battery_percent=None,
        last_rotated_at=now if body.status == WatchAssetStatus.active else None,
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _asset_public(row)


async def list_watch_assets(
    session: AsyncSession,
    *,
    org_id: str,
    user_id: str,
    employee_user_id: str | None = None,
) -> list[WatchAssetPublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    await _org_or_404(session, org_id)
    stmt = select(WatchAsset).where(WatchAsset.org_id == org_id)
    if employee_user_id:
        stmt = stmt.where(WatchAsset.employee_user_id == employee_user_id)
    stmt = stmt.order_by(WatchAsset.employee_user_id.asc(), WatchAsset.slot.asc())
    return [_asset_public(r) for r in (await session.execute(stmt)).scalars().all()]


async def rotate_watches(
    session: AsyncSession, *, org_id: str, user_id: str, body: WatchRotateRequest
) -> list[WatchAssetPublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    await _org_or_404(session, org_id)

    emp = str(body.employee_user_id)
    watches = (
        await session.execute(
            select(WatchAsset).where(WatchAsset.org_id == org_id, WatchAsset.employee_user_id == emp)
        )
    ).scalars().all()
    if not watches:
        raise HTTPException(status_code=404, detail="No watches registered for employee")

    target = next((w for w in watches if w.slot == body.to_slot.value), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"No watch in slot {body.to_slot.value}")

    policy = (
        await session.execute(select(WatchRotationPolicy).where(WatchRotationPolicy.org_id == org_id))
    ).scalar_one_or_none()
    if (
        policy is not None
        and body.battery_percent is not None
        and int(body.battery_percent) < int(policy.min_soc_percent)
        and target.status == WatchAssetStatus.charging.value
    ):
        raise HTTPException(
            status_code=409,
            detail=f"Battery below min_soc_percent={policy.min_soc_percent}",
        )

    now = _utcnow()
    for w in watches:
        if w.id == target.id:
            w.status = WatchAssetStatus.active.value
            w.last_rotated_at = now
            if body.battery_percent is not None:
                w.battery_percent = int(body.battery_percent)
        elif w.status == WatchAssetStatus.active.value:
            w.status = WatchAssetStatus.charging.value
            w.last_rotated_at = now
        w.updated_at = now
        if body.note:
            meta = dict(w.metadata_json or {})
            meta["last_rotate_note"] = body.note[:400]
            w.metadata_json = meta

    await session.flush()
    return [_asset_public(w) for w in sorted(watches, key=lambda r: r.slot)]


async def upsert_rotation_policy(
    session: AsyncSession, *, org_id: str, user_id: str, body: WatchRotationPolicyUpsert
) -> WatchRotationPolicyPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    await _org_or_404(session, org_id)
    now = _utcnow()
    row = (
        await session.execute(select(WatchRotationPolicy).where(WatchRotationPolicy.org_id == org_id))
    ).scalar_one_or_none()
    if row is None:
        row = WatchRotationPolicy(org_id=org_id, created_at=now, updated_at=now)
        session.add(row)
    row.enabled = bool(body.enabled)
    row.rotation_interval_minutes = int(body.rotation_interval_minutes)
    row.min_soc_percent = int(body.min_soc_percent)
    row.grace_minutes = int(body.grace_minutes)
    row.viewer_roles = list(body.viewer_roles)
    row.updated_at = now
    await session.flush()
    return _policy_public(row)


async def get_rotation_policy(
    session: AsyncSession, *, org_id: str, user_id: str
) -> WatchRotationPolicyPublic | None:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    row = (
        await session.execute(select(WatchRotationPolicy).where(WatchRotationPolicy.org_id == org_id))
    ).scalar_one_or_none()
    return _policy_public(row) if row else None


async def ingest_heart_rate(
    session: AsyncSession, *, org_id: str, user_id: str, body: HeartRateIngestRequest
) -> list[HeartRateSamplePublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    await _org_or_404(session, org_id)

    emp = str(body.employee_user_id)
    out: list[HeartRateSamplePublic] = []
    now = _utcnow()
    for sample in body.samples:
        watch_id = str(sample.watch_asset_id) if sample.watch_asset_id else None
        if watch_id:
            watch = await session.get(WatchAsset, watch_id)
            if watch is None or watch.org_id != org_id:
                raise HTTPException(status_code=404, detail=f"Watch asset not found: {watch_id}")
            if watch.employee_user_id != emp:
                raise HTTPException(status_code=400, detail="Watch does not belong to employee")
            watch.updated_at = now
        row = WatchHeartRateSample(
            org_id=org_id,
            employee_user_id=emp,
            watch_asset_id=watch_id,
            bpm=int(sample.bpm),
            on_shift=bool(body.on_shift),
            source=(sample.source or "healthkit").strip() or "healthkit",
            recorded_at=sample.recorded_at,
            ingested_at=now,
        )
        session.add(row)
        out.append(_hr_public(row))
    await session.flush()
    return out


async def list_heart_rate(
    session: AsyncSession,
    *,
    org_id: str,
    user_id: str,
    employee_user_id: str | None = None,
    limit: int = 100,
) -> list[HeartRateSamplePublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    await _org_or_404(session, org_id)
    lim = max(1, min(int(limit), 500))
    stmt = select(WatchHeartRateSample).where(WatchHeartRateSample.org_id == org_id)
    if employee_user_id:
        stmt = stmt.where(WatchHeartRateSample.employee_user_id == employee_user_id)
    stmt = stmt.order_by(WatchHeartRateSample.recorded_at.desc()).limit(lim)
    return [_hr_public(r) for r in (await session.execute(stmt)).scalars().all()]


async def fleet_summary(
    session: AsyncSession, *, org_id: str, user_id: str
) -> WatchFleetSummary:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    await _org_or_404(session, org_id)

    total = (
        await session.execute(select(func.count()).select_from(WatchAsset).where(WatchAsset.org_id == org_id))
    ).scalar_one()
    active = (
        await session.execute(
            select(func.count())
            .select_from(WatchAsset)
            .where(WatchAsset.org_id == org_id, WatchAsset.status == WatchAssetStatus.active.value)
        )
    ).scalar_one()
    employees = (
        await session.execute(
            select(func.count(func.distinct(WatchAsset.employee_user_id))).where(WatchAsset.org_id == org_id)
        )
    ).scalar_one()
    latest_hr = (
        await session.execute(
            select(func.max(WatchHeartRateSample.recorded_at)).where(WatchHeartRateSample.org_id == org_id)
        )
    ).scalar_one()
    policy = (
        await session.execute(select(WatchRotationPolicy).where(WatchRotationPolicy.org_id == org_id))
    ).scalar_one_or_none()

    return WatchFleetSummary(
        org_id=uuid.UUID(str(org_id)),
        watches_total=int(total or 0),
        watches_active=int(active or 0),
        employees_covered=int(employees or 0),
        latest_hr_at=latest_hr,
        rotation_enabled=bool(policy.enabled) if policy else False,
    )
