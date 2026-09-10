"""Lunar land trading service (R13)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import LunarInterestOrder, LunarParcel
from app.schemas.lunar_land import (
    LunarInterestCreate,
    LunarInterestKind,
    LunarInterestPublic,
    LunarInterestStatus,
    LunarLandStatusPublic,
    LunarParcelPublic,
    LunarParcelStatus,
)

_LFM_REF = "https://lnkd.in/p/e-SbXYMZ"

_SEED_PARCELS: list[dict] = [
    {
        "parcel_code": "LUN-SHA-001",
        "name": "Shackleton Rim Shelf",
        "region": "South polar",
        "lat_deg": -89.9,
        "lon_deg": 0.0,
        "area_km2": 12.5,
        "list_price_acp": Decimal("125000"),
        "lfm_themes": ["ice_deposit", "crater"],
        "summary": "Permanently shadowed shelf near Shackleton — catalog ice-interest tag from polar remote sensing themes.",
    },
    {
        "parcel_code": "LUN-PEA-002",
        "name": "Peary North Shelf",
        "region": "North polar",
        "lat_deg": 88.6,
        "lon_deg": 33.0,
        "area_km2": 9.0,
        "list_price_acp": Decimal("98000"),
        "lfm_themes": ["ice_deposit"],
        "summary": "North-polar highland shelf tagged for volatile-retention science interest.",
    },
    {
        "parcel_code": "LUN-IMB-003",
        "name": "Imbrium Basalt Strip",
        "region": "Mare Imbrium",
        "lat_deg": 32.8,
        "lon_deg": -15.6,
        "area_km2": 40.0,
        "list_price_acp": Decimal("64000"),
        "lfm_themes": ["volcanic_history"],
        "summary": "Mare basalt corridor for volcanic-history enrichment themes.",
    },
    {
        "parcel_code": "LUN-TYC-004",
        "name": "Tycho Ejecta Fan",
        "region": "Southern highlands",
        "lat_deg": -43.3,
        "lon_deg": -11.2,
        "area_km2": 18.0,
        "list_price_acp": Decimal("72000"),
        "lfm_themes": ["crater"],
        "summary": "Young crater ejecta fan — morphology / crater-detection theme.",
    },
    {
        "parcel_code": "LUN-ARI-005",
        "name": "Aristarchus Plateau Edge",
        "region": "Oceanus Procellarum",
        "lat_deg": 23.7,
        "lon_deg": -47.4,
        "area_km2": 22.0,
        "list_price_acp": Decimal("88000"),
        "lfm_themes": ["volcanic_history", "crater"],
        "summary": "Plateau edge with pyroclastic and crater-rim science tags.",
    },
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _feature_enabled() -> bool:
    return bool(getattr(get_settings(), "ff_lunar_land", True))


def _require_feature() -> None:
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="Lunar land feature flag disabled")


def _parcel_public(row: LunarParcel) -> LunarParcelPublic:
    meta = dict(row.metadata_json or {})
    themes = meta.get("lfm_themes") or []
    if not isinstance(themes, list):
        themes = []
    return LunarParcelPublic(
        id=uuid.UUID(str(row.id)),
        parcel_code=row.parcel_code,
        name=row.name,
        region=row.region,
        lat_deg=float(row.lat_deg),
        lon_deg=float(row.lon_deg),
        area_km2=float(row.area_km2),
        list_price_acp=Decimal(str(row.list_price_acp)),
        status=str(row.status),
        source=str(row.source),
        lfm_themes=[str(x) for x in themes],
        summary=str(meta.get("summary") or ""),
        metadata_json=meta,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _interest_public(row: LunarInterestOrder, parcel_code: str | None = None) -> LunarInterestPublic:
    return LunarInterestPublic(
        id=uuid.UUID(str(row.id)),
        parcel_id=uuid.UUID(str(row.parcel_id)),
        parcel_code=parcel_code,
        kind=str(row.kind),
        status=str(row.status),
        budget_acp=Decimal(str(row.budget_acp)),
        notes=row.notes,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def ensure_seed_catalog(session: AsyncSession) -> int:
    existing = (await session.execute(select(func.count()).select_from(LunarParcel))).scalar_one()
    if int(existing or 0) > 0:
        return 0
    now = _utcnow()
    for item in _SEED_PARCELS:
        session.add(
            LunarParcel(
                id=str(uuid.uuid4()),
                parcel_code=item["parcel_code"],
                name=item["name"],
                region=item["region"],
                lat_deg=item["lat_deg"],
                lon_deg=item["lon_deg"],
                area_km2=item["area_km2"],
                list_price_acp=item["list_price_acp"],
                status=LunarParcelStatus.listed.value,
                source="catalog",
                metadata_json={
                    "lfm_themes": item["lfm_themes"],
                    "summary": item["summary"],
                    "lfm_reference": _LFM_REF,
                },
                created_at=now,
                updated_at=now,
            )
        )
    await session.flush()
    return len(_SEED_PARCELS)


async def division_status(session: AsyncSession) -> LunarLandStatusPublic:
    await ensure_seed_catalog(session)
    enabled = _feature_enabled()
    listed = (
        await session.execute(
            select(func.count())
            .select_from(LunarParcel)
            .where(LunarParcel.status == LunarParcelStatus.listed.value)
        )
    ).scalar_one()
    open_interests = (
        await session.execute(
            select(func.count())
            .select_from(LunarInterestOrder)
            .where(LunarInterestOrder.status == LunarInterestStatus.open.value)
        )
    ).scalar_one()
    return LunarLandStatusPublic(
        feature_enabled=enabled,
        division="LUNAR_LAND",
        tagline="ACP lunar parcel desk — science-tagged registry claims, not sovereign deeds.",
        parcels_listed=int(listed or 0),
        interests_open=int(open_interests or 0),
        science_note=(
            "Parcel tags follow open lunar science themes popularized by the NASA–IBM Lunar "
            "Foundation Model (ice, volcanism, crater morphology). Enrichment adapter is planned; "
            "weights are not hosted on ANCAP."
        ),
        compliance_note=(
            "Outer Space Treaty: celestial bodies are not subject to national appropriation. "
            "ANCAP sells speculative registry interests and ACP settlement rails only."
        ),
        lfm_reference=_LFM_REF,
        next_gate="Enable FF_LUNAR_LAND" if not enabled else "ACP escrow hold + ownership-proof handoff (L2)",
    )


async def list_parcels(session: AsyncSession) -> list[LunarParcelPublic]:
    await ensure_seed_catalog(session)
    rows = (
        await session.execute(
            select(LunarParcel)
            .where(LunarParcel.status != LunarParcelStatus.cancelled.value)
            .order_by(LunarParcel.list_price_acp.desc(), LunarParcel.parcel_code.asc())
        )
    ).scalars().all()
    return [_parcel_public(r) for r in rows]


async def get_parcel(session: AsyncSession, parcel_id: str) -> LunarParcelPublic:
    await ensure_seed_catalog(session)
    row = await session.get(LunarParcel, parcel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return _parcel_public(row)


async def create_interest(
    session: AsyncSession,
    *,
    user_id: str,
    body: LunarInterestCreate,
) -> LunarInterestPublic:
    _require_feature()
    if not body.consent_acknowledged:
        raise HTTPException(status_code=400, detail="consent_acknowledged required")
    await ensure_seed_catalog(session)
    parcel = await session.get(LunarParcel, str(body.parcel_id))
    if parcel is None:
        raise HTTPException(status_code=404, detail="Parcel not found")
    if parcel.status not in {LunarParcelStatus.listed.value, LunarParcelStatus.reserved.value}:
        raise HTTPException(status_code=409, detail="Parcel is not open for interest")
    if body.kind == LunarInterestKind.reserve and parcel.status == LunarParcelStatus.listed.value:
        parcel.status = LunarParcelStatus.reserved.value
        parcel.updated_at = _utcnow()
    now = _utcnow()
    row = LunarInterestOrder(
        id=str(uuid.uuid4()),
        owner_user_id=user_id,
        parcel_id=str(parcel.id),
        kind=body.kind.value,
        status=LunarInterestStatus.open.value,
        budget_acp=body.budget_acp,
        notes=body.notes,
        metadata_json={"consent_acknowledged": True, "lfm_reference": _LFM_REF},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _interest_public(row, parcel_code=parcel.parcel_code)


async def list_interests(session: AsyncSession, *, user_id: str) -> list[LunarInterestPublic]:
    _require_feature()
    rows = (
        await session.execute(
            select(LunarInterestOrder, LunarParcel.parcel_code)
            .join(LunarParcel, LunarParcel.id == LunarInterestOrder.parcel_id)
            .where(LunarInterestOrder.owner_user_id == user_id)
            .order_by(LunarInterestOrder.created_at.desc())
        )
    ).all()
    return [_interest_public(r, parcel_code=code) for r, code in rows]
