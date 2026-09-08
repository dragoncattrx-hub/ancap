"""Milky Way / Solar System title auction: stars, planets, satellites."""
from __future__ import annotations

import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import SpaceAuctionBid
from app.schemas.space_auction import (
    SpaceAuctionBidPublic,
    SpaceAuctionCatalogPublic,
    SpaceAuctionLotPublic,
    SpaceLotKind,
)

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("100")
_INCREMENT_BPS = Decimal("100")  # 1%

_COMPLIANCE = (
    "ANCAP space lots are symbolic ACP title claims and desk RFQs. "
    "They do not confer sovereignty under the Outer Space Treaty. "
    "Settlement still requires compliance review and a hashed title pack."
)

_LOTS: tuple[dict[str, Any], ...] = (
    {
        "id": "star-sol",
        "kind": "star",
        "name": "Sol",
        "designation": "G2V / the Sun",
        "parent": None,
        "blurb": "Host star of the Solar System. Title lot for the local gravity well.",
        "starting_acp": "50000000",
        "featured": True,
    },
    {
        "id": "star-proxima",
        "kind": "star",
        "name": "Proxima Centauri",
        "designation": "M5.5V · α Cen C",
        "parent": None,
        "blurb": "Nearest other star — red-dwarf lot on the galactic auction floor.",
        "starting_acp": "12000000",
        "featured": False,
    },
    {
        "id": "star-sirius",
        "kind": "star",
        "name": "Sirius A",
        "designation": "A1V · α CMa",
        "parent": None,
        "blurb": "Brightest star in the night sky. High-visibility title lot.",
        "starting_acp": "8500000",
        "featured": False,
    },
    {
        "id": "star-vega",
        "kind": "star",
        "name": "Vega",
        "designation": "A0V · α Lyr",
        "parent": None,
        "blurb": "Lyra's beacon — historic pole star and photometric standard.",
        "starting_acp": "4200000",
        "featured": False,
    },
    {
        "id": "star-betelgeuse",
        "kind": "star",
        "name": "Betelgeuse",
        "designation": "M1–2 Ia · α Ori",
        "parent": None,
        "blurb": "Red supergiant lot. Volatility priced in — it will not last forever.",
        "starting_acp": "6800000",
        "featured": False,
    },
    {
        "id": "star-polaris",
        "kind": "star",
        "name": "Polaris",
        "designation": "F7Ib · α UMi",
        "parent": None,
        "blurb": "Current north star. Navigation premium on the title.",
        "starting_acp": "3500000",
        "featured": True,
    },
    {
        "id": "planet-mercury",
        "kind": "planet",
        "name": "Mercury",
        "designation": "I · innermost planet",
        "parent": "Sol",
        "blurb": "Closest world to Sol. Compact lot, extreme thermal cycle.",
        "starting_acp": "420000",
        "featured": False,
    },
    {
        "id": "planet-venus",
        "kind": "planet",
        "name": "Venus",
        "designation": "II",
        "parent": "Sol",
        "blurb": "Twin-mass world with a greenhouse premium.",
        "starting_acp": "890000",
        "featured": False,
    },
    {
        "id": "planet-earth",
        "kind": "planet",
        "name": "Earth",
        "designation": "III · homeworld",
        "parent": "Sol",
        "blurb": "Only confirmed biosphere in the catalog. Reserve is not a joke.",
        "starting_acp": "25000000",
        "featured": True,
    },
    {
        "id": "planet-mars",
        "kind": "planet",
        "name": "Mars",
        "designation": "IV",
        "parent": "Sol",
        "blurb": "The settlement narrative planet. High bid interest expected.",
        "starting_acp": "1800000",
        "featured": True,
    },
    {
        "id": "planet-jupiter",
        "kind": "planet",
        "name": "Jupiter",
        "designation": "V",
        "parent": "Sol",
        "blurb": "Gas giant + system of moons. Gravity-assist infrastructure lot.",
        "starting_acp": "9500000",
        "featured": False,
    },
    {
        "id": "planet-saturn",
        "kind": "planet",
        "name": "Saturn",
        "designation": "VI",
        "parent": "Sol",
        "blurb": "Ringed giant. Visual premium on the title certificate.",
        "starting_acp": "7200000",
        "featured": False,
    },
    {
        "id": "planet-uranus",
        "kind": "planet",
        "name": "Uranus",
        "designation": "VII",
        "parent": "Sol",
        "blurb": "Ice giant on a tipped axis. Quieter desk, still a named world.",
        "starting_acp": "3100000",
        "featured": False,
    },
    {
        "id": "planet-neptune",
        "kind": "planet",
        "name": "Neptune",
        "designation": "VIII",
        "parent": "Sol",
        "blurb": "Outer ice giant. Deep-blue lot at the edge of the classic eight.",
        "starting_acp": "3400000",
        "featured": False,
    },
    {
        "id": "sat-luna",
        "kind": "satellite",
        "name": "Luna",
        "designation": "Earth I · the Moon",
        "parent": "Earth",
        "blurb": "Natural satellite of Earth. Nearest major body after LEO.",
        "starting_acp": "4500000",
        "featured": True,
    },
    {
        "id": "sat-phobos",
        "kind": "satellite",
        "name": "Phobos",
        "designation": "Mars I",
        "parent": "Mars",
        "blurb": "Inner Martian moon — irregular, close-in, high relative motion.",
        "starting_acp": "180000",
        "featured": False,
    },
    {
        "id": "sat-deimos",
        "kind": "satellite",
        "name": "Deimos",
        "designation": "Mars II",
        "parent": "Mars",
        "blurb": "Outer Martian moon. Small-lot satellite auction.",
        "starting_acp": "95000",
        "featured": False,
    },
    {
        "id": "sat-io",
        "kind": "satellite",
        "name": "Io",
        "designation": "Jupiter I",
        "parent": "Jupiter",
        "blurb": "Volcanic Galilean moon. Energy-rich title, hostile surface.",
        "starting_acp": "620000",
        "featured": False,
    },
    {
        "id": "sat-europa",
        "kind": "satellite",
        "name": "Europa",
        "designation": "Jupiter II",
        "parent": "Jupiter",
        "blurb": "Icy shell over a suspected ocean. High scientific premium.",
        "starting_acp": "1200000",
        "featured": True,
    },
    {
        "id": "sat-ganymede",
        "kind": "satellite",
        "name": "Ganymede",
        "designation": "Jupiter III",
        "parent": "Jupiter",
        "blurb": "Largest moon in the Solar System. Own magnetic field.",
        "starting_acp": "980000",
        "featured": False,
    },
    {
        "id": "sat-titan",
        "kind": "satellite",
        "name": "Titan",
        "designation": "Saturn VI",
        "parent": "Saturn",
        "blurb": "Thick atmosphere, hydrocarbon lakes. Flagship icy-moon lot.",
        "starting_acp": "1450000",
        "featured": False,
    },
    {
        "id": "sat-enceladus",
        "kind": "satellite",
        "name": "Enceladus",
        "designation": "Saturn II",
        "parent": "Saturn",
        "blurb": "South-pole plumes. Compact satellite with biosignature interest.",
        "starting_acp": "540000",
        "featured": False,
    },
    {
        "id": "sat-iss",
        "kind": "satellite",
        "name": "ISS",
        "designation": "NORAD 25544",
        "parent": "Earth",
        "blurb": "Artificial satellite / station title RFQ. Desk + jurisdiction heavy.",
        "starting_acp": "2800000",
        "featured": False,
    },
    {
        "id": "sat-hubble",
        "kind": "satellite",
        "name": "Hubble Space Telescope",
        "designation": "NORAD 20580",
        "parent": "Earth",
        "blurb": "Science-platform spacecraft lot. Heritage optical payload.",
        "starting_acp": "750000",
        "featured": False,
    },
    {
        "id": "sat-starlink-slot",
        "kind": "satellite",
        "name": "Starlink-class slot",
        "designation": "LEO constellation slot",
        "parent": "Earth",
        "blurb": "Indicative LEO spacecraft / frequency-adjacent satellite lot.",
        "starting_acp": "85000",
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
    return value


def _min_next(current: Decimal) -> Decimal:
    step = (current * _INCREMENT_BPS / Decimal("10000")).quantize(_Q, rounding=ROUND_HALF_UP)
    if step < _MIN_INCREMENT:
        step = _MIN_INCREMENT
    return (current + step).quantize(_Q, rounding=ROUND_HALF_UP)


def get_lot_def(lot_id: str) -> dict[str, Any]:
    lot = _LOTS_BY_ID.get(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Unknown space auction lot")
    return lot


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, uuid.UUID, int]]:
    rows = (
        await session.execute(
            select(
                SpaceAuctionBid.lot_id,
                SpaceAuctionBid.amount_acp,
                SpaceAuctionBid.bidder_user_id,
                SpaceAuctionBid.status,
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


def _lot_public(lot: dict[str, Any], high: dict[str, tuple[Decimal, uuid.UUID, int]]) -> SpaceAuctionLotPublic:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    bidder = None
    count = 0
    if info:
        current = max(starting, info[0])
        bidder = info[1] if info[0] >= starting else None
        count = info[2]
    return SpaceAuctionLotPublic(
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
        high_bidder_user_id=bidder,
        featured=bool(lot.get("featured")),
    )


async def catalog(session: AsyncSession) -> SpaceAuctionCatalogPublic:
    high = await _high_bids(session)
    lots = [_lot_public(lot, high) for lot in _LOTS]
    featured = [lot for lot in lots if lot.featured]
    return SpaceAuctionCatalogPublic(
        title="ANCAP Galaxy Auction",
        tagline="Bid ACP for stars, planets, and satellites — from the Milky Way down to Sol.",
        compliance_note=_COMPLIANCE,
        lots=lots,
        featured=featured,
    )


async def get_lot(session: AsyncSession, lot_id: str) -> SpaceAuctionLotPublic:
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
) -> SpaceAuctionBidPublic:
    get_lot_def(lot_id)
    amount = _dec(amount_acp, "amount_acp")
    public = await get_lot(session, lot_id)
    floor = Decimal(public.starting_acp)
    minimum = floor if public.bid_count == 0 else Decimal(public.min_next_acp)
    if amount < minimum:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {_api_str(minimum)} ACP",
        )

    await session.execute(
        update(SpaceAuctionBid)
        .where(
            SpaceAuctionBid.lot_id == lot_id,
            SpaceAuctionBid.status.in_(("placed", "winning")),
        )
        .values(status="outbid")
    )
    row = SpaceAuctionBid(
        id=str(uuid.uuid4()),
        lot_id=lot_id,
        bidder_user_id=user_id,
        amount_acp=amount,
        status="winning",
        note=(note or "").strip()[:240] or None,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    updated = await get_lot(session, lot_id)
    return SpaceAuctionBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=lot_id,
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        lot=updated,
    )


def kinds() -> tuple[SpaceLotKind, ...]:
    return ("star", "planet", "satellite")
