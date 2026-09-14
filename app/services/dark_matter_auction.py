"""Dark matter title auction: halo / filament / cosmology literacy lots."""
from __future__ import annotations

import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DarkMatterAuctionBid
from app.schemas.dark_matter_auction import (
    DarkMatterBidPublic,
    DarkMatterCatalogPublic,
    DarkMatterLotKind,
    DarkMatterLotPublic,
)
from app.services.auction_lock import lock_auction_lot, normalize_lot_id

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("100")
_INCREMENT_BPS = Decimal("100")  # 1%

_COMPLIANCE = (
    "ANCAP dark-matter lots are symbolic ACP title claims and cosmology literacy RFQs. "
    "They do not convey ownership of physical dark matter, do not grant sovereignty, "
    "and are not scientific detection certificates. See /legal/dark-matter."
)

_LOTS: tuple[dict[str, Any], ...] = (
    {
        "id": "dm-milky-way-halo",
        "kind": "halo",
        "name": "Milky Way dark-matter halo",
        "designation": "ΛCDM halo · local group",
        "parent": "Milky Way",
        "blurb": "Featured title for the inferred dark-matter halo enveloping the Milky Way.",
        "starting_acp": "22000000",
        "featured": True,
    },
    {
        "id": "dm-andromeda-halo",
        "kind": "halo",
        "name": "Andromeda dark-matter halo",
        "designation": "M31 halo",
        "parent": "Andromeda",
        "blurb": "Sister-galaxy halo lot — Local Group collision narrative priced in.",
        "starting_acp": "8900000",
        "featured": True,
    },
    {
        "id": "dm-local-group-bridge",
        "kind": "filament",
        "name": "Local Group filament bridge",
        "designation": "MW–M31 dark bridge",
        "parent": "Local Group",
        "blurb": "Filamentary dark-matter bridge inferred between the Milky Way and Andromeda.",
        "starting_acp": "4200000",
        "featured": False,
    },
    {
        "id": "dm-cosmic-web-node",
        "kind": "filament",
        "name": "Cosmic-web node",
        "designation": "Large-scale structure node",
        "parent": None,
        "blurb": "Indicative dark-matter node where filaments meet — cosmology desk staple.",
        "starting_acp": "5600000",
        "featured": True,
    },
    {
        "id": "dm-bootes-void-rim",
        "kind": "void",
        "name": "Boötes void rim",
        "designation": "Great Void periphery",
        "parent": None,
        "blurb": "Sparse-region rim lot — underdensity narrative with high curiosity premium.",
        "starting_acp": "1800000",
        "featured": False,
    },
    {
        "id": "dm-coma-cluster",
        "kind": "cluster",
        "name": "Coma Cluster dark matter",
        "designation": "Abell 1656 mass map",
        "parent": "Coma Cluster",
        "blurb": "Classic cluster-scale dark-matter lot — Zwicky heritage literacy.",
        "starting_acp": "6800000",
        "featured": True,
    },
    {
        "id": "dm-bullet-cluster",
        "kind": "cluster",
        "name": "Bullet Cluster offset",
        "designation": "1E 0657-56 lensing offset",
        "parent": None,
        "blurb": "Collision-offset mass map — the poster child of collisionless dark matter.",
        "starting_acp": "7500000",
        "featured": True,
    },
    {
        "id": "dm-xenon-nt",
        "kind": "detector",
        "name": "XENON / dual-phase literacy",
        "designation": "Direct-detection desk brief",
        "parent": None,
        "blurb": "Partner literacy for noble-liquid direct detection — not a lab booking.",
        "starting_acp": "125000",
        "featured": False,
    },
    {
        "id": "dm-lz-literacy",
        "kind": "detector",
        "name": "LZ / LUX-ZEPLIN literacy",
        "designation": "Ton-scale xenon brief",
        "parent": None,
        "blurb": "ACP desk brief on ton-scale dual-phase detectors — licensed partner only.",
        "starting_acp": "98000",
        "featured": False,
    },
    {
        "id": "dm-wimp-cold",
        "kind": "particle",
        "name": "Cold WIMP narrative",
        "designation": "Weakly interacting massive particle",
        "parent": None,
        "blurb": "Cold dark-matter particle-candidate literacy lot — not a particle delivery.",
        "starting_acp": "320000",
        "featured": False,
    },
    {
        "id": "dm-axion",
        "kind": "particle",
        "name": "Axion / ALP narrative",
        "designation": "Axion-like particle desk",
        "parent": None,
        "blurb": "Ultralight / axion-like candidate literacy — cavity and haloscope themes.",
        "starting_acp": "280000",
        "featured": False,
    },
    {
        "id": "dm-sterile-neutrino",
        "kind": "particle",
        "name": "Sterile-neutrino narrative",
        "designation": "keV sterile ν theme",
        "parent": None,
        "blurb": "Warmish dark-matter candidate literacy for X-ray line discussions.",
        "starting_acp": "210000",
        "featured": False,
    },
    {
        "id": "dm-lcdm-parameter",
        "kind": "cosmology",
        "name": "ΛCDM Ωₘ literacy",
        "designation": "Matter density parameter desk",
        "parent": None,
        "blurb": "Cosmology-parameter literacy lot — Ωₘ / dark-sector accounting brief.",
        "starting_acp": "890000",
        "featured": False,
    },
    {
        "id": "dm-subhalo-stream",
        "kind": "halo",
        "name": "Stellar-stream subhalo",
        "designation": "Perturbed stream gap",
        "parent": "Milky Way",
        "blurb": "Subhalo-induced stream-gap literacy — dynamical evidence narrative.",
        "starting_acp": "640000",
        "featured": False,
    },
    {
        "id": "dm-lensing-map",
        "kind": "cosmology",
        "name": "Weak-lensing mass map",
        "designation": "Shear → mass reconstruction",
        "parent": None,
        "blurb": "Weak-lensing dark-matter map literacy — not a survey data license.",
        "starting_acp": "1100000",
        "featured": False,
    },
)

_LOTS_BY_ID: dict[str, dict[str, Any]] = {str(lot["id"]): lot for lot in _LOTS}


def _api_str(value: Decimal) -> str:
    quantized = value.quantize(_Q, rounding=ROUND_HALF_UP)
    text = format(quantized, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _dec(raw: str, field: str) -> Decimal:
    try:
        value = Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a decimal") from exc
    if value <= 0:
        raise HTTPException(status_code=400, detail=f"{field} must be positive")
    if value.as_tuple().exponent < -8:
        raise HTTPException(status_code=400, detail=f"{field} has too many decimal places")
    if value > Decimal("1000000000000"):
        raise HTTPException(status_code=400, detail=f"{field} exceeds the auction ceiling")
    return value


def _clean_note(value: str | None) -> str | None:
    text = "".join(ch for ch in str(value or "") if ch.isprintable())
    text = " ".join(text.split()).strip()
    if not text:
        return None
    if any(ch in text for ch in "<>"):
        raise HTTPException(status_code=400, detail="note cannot contain markup")
    return text[:240]


def _min_next(current: Decimal) -> Decimal:
    step = (current * _INCREMENT_BPS / Decimal("10000")).quantize(_Q, rounding=ROUND_HALF_UP)
    if step < _MIN_INCREMENT:
        step = _MIN_INCREMENT
    return (current + step).quantize(_Q, rounding=ROUND_HALF_UP)


def get_lot_def(lot_id: str) -> dict[str, Any]:
    lot_id = normalize_lot_id(lot_id, unknown="Unknown dark-matter auction lot")
    lot = _LOTS_BY_ID.get(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Unknown dark-matter auction lot")
    return lot


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, uuid.UUID, int]]:
    rows = (
        await session.execute(
            select(
                DarkMatterAuctionBid.lot_id,
                DarkMatterAuctionBid.amount_acp,
                DarkMatterAuctionBid.bidder_user_id,
                DarkMatterAuctionBid.status,
            )
        )
    ).all()
    best: dict[str, tuple[Decimal, uuid.UUID, int]] = {}
    counts: dict[str, int] = {}
    for lot_id, amount, bidder_id, status in rows:
        counts[lot_id] = counts.get(lot_id, 0) + 1
        if status not in ("placed", "winning"):
            continue
        amt = Decimal(str(amount))
        prev = best.get(lot_id)
        if prev is None or amt > prev[0]:
            best[lot_id] = (amt, uuid.UUID(str(bidder_id)), 0)
    for lot_id, count in counts.items():
        if lot_id in best:
            amt, bidder, _ = best[lot_id]
            best[lot_id] = (amt, bidder, count)
        else:
            best[lot_id] = (Decimal("0"), uuid.UUID(int=0), count)
    return best


def _lot_public(lot: dict[str, Any], high: dict[str, tuple[Decimal, uuid.UUID, int]]) -> DarkMatterLotPublic:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    count = 0
    if info:
        current = max(starting, info[0])
        count = info[2]
    return DarkMatterLotPublic(
        id=str(lot["id"]),
        kind=lot["kind"],  # type: ignore[arg-type]
        name=str(lot["name"]),
        designation=str(lot["designation"]),
        parent=lot.get("parent"),
        blurb=str(lot["blurb"]),
        starting_acp=_api_str(starting),
        current_acp=_api_str(current),
        min_next_acp=_api_str(_min_next(current)),
        bid_count=count,
        high_bidder_user_id=None,
        featured=bool(lot.get("featured")),
    )


async def catalog(session: AsyncSession) -> DarkMatterCatalogPublic:
    high = await _high_bids(session)
    lots = [_lot_public(lot, high) for lot in _LOTS]
    featured = [lot for lot in lots if lot.featured]
    return DarkMatterCatalogPublic(
        title="ANCAP Dark Matter Auction",
        tagline=(
            "Bid ACP for dark-matter halo, filament, cluster, detector, and cosmology literacy titles — "
            "symbolic desk RFQs, not physical dark matter."
        ),
        compliance_note=_COMPLIANCE,
        lots=lots,
        featured=featured,
    )


async def get_lot(session: AsyncSession, lot_id: str) -> DarkMatterLotPublic:
    lot = get_lot_def(lot_id)
    high = await _high_bids(session)
    return _lot_public(lot, high)


async def place_bid(
    session: AsyncSession,
    *,
    user_id: str,
    lot_id: str,
    amount_acp: str,
    note: str | None = None,
) -> DarkMatterBidPublic:
    lot = get_lot_def(lot_id)
    amount = _dec(amount_acp, "amount_acp")
    await lock_auction_lot(session, "dark_matter", str(lot["id"]))
    public = await get_lot(session, str(lot["id"]))
    floor = Decimal(public.starting_acp)
    minimum = floor if public.bid_count == 0 else Decimal(public.min_next_acp)
    if amount < minimum:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {_api_str(minimum)} ACP",
        )

    await session.execute(
        update(DarkMatterAuctionBid)
        .where(
            DarkMatterAuctionBid.lot_id == str(lot["id"]),
            DarkMatterAuctionBid.status.in_(("placed", "winning")),
        )
        .values(status="outbid")
    )
    bid_id = uuid.uuid4()
    note_clean = _clean_note(note)
    from app.services.auction_deal_seal import seal_auction_deal

    env_b64, chash, cipher_id = seal_auction_deal(
        vertical="dark_matter",
        bid_id=str(bid_id),
        lot_id=str(lot["id"]),
        bidder_user_id=str(user_id),
        amount_acp=_api_str(amount),
        note=note_clean,
    )
    row = DarkMatterAuctionBid(
        id=str(bid_id),
        lot_id=str(lot["id"]),
        bidder_user_id=user_id,
        amount_acp=amount,
        status="winning",
        note=None,
        deal_cipher_id=cipher_id,
        deal_envelope_b64=env_b64,
        deal_content_hash=chash,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    updated = await get_lot(session, str(lot["id"]))
    return DarkMatterBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=str(lot["id"]),
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        lot=updated,
    )


def kinds() -> tuple[DarkMatterLotKind, ...]:
    return ("halo", "filament", "void", "cluster", "detector", "particle", "cosmology")
