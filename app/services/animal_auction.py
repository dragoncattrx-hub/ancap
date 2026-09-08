"""FAUNA companion-animal auction: dogs, cats, and other licensed pets via ACP escrow contracts."""
from __future__ import annotations

import hashlib
import json
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AnimalAuctionBid, AnimalAuctionLot
from app.schemas.animal_auction import (
    AnimalAuctionBidPublic,
    AnimalAuctionCatalogPublic,
    AnimalAuctionListCreate,
    AnimalAuctionLotPublic,
    AnimalSpecies,
)

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("10")
_INCREMENT_BPS = Decimal("100")  # 1%

ALLOWED_SPECIES: tuple[AnimalSpecies, ...] = (
    "dog",
    "cat",
    "horse",
    "bird",
    "rabbit",
    "fish",
    "other_companion",
)

_COMPLIANCE = (
    "FAUNA lots are licensed companion-animal transfers settled in ACP through hashed escrow smart contracts. "
    "Wildlife, wild-caught CITES specimens, and unlicensed breeding are not listed. "
    "Captive-bred companions with papers may be listed. "
    "Physical handover follows local veterinary and ownership law — ANCAP is the capital and contract rail."
)

_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": "dog-german-shepherd",
        "species": "dog",
        "name": "Kaiser",
        "breed": "German Shepherd",
        "age_months": 18,
        "blurb": "Working-line shepherd. Title transfers on an ACP escrow contract after veterinary pack.",
        "starting_acp": "8500",
        "featured": True,
    },
    {
        "id": "dog-labrador",
        "species": "dog",
        "name": "Maple",
        "breed": "Labrador Retriever",
        "age_months": 10,
        "blurb": "Family companion. Smart-contract sale with hashed pedigree + microchip receipt.",
        "starting_acp": "6200",
        "featured": False,
    },
    {
        "id": "dog-siberian-husky",
        "species": "dog",
        "name": "Nimbus",
        "breed": "Siberian Husky",
        "age_months": 24,
        "blurb": "Northern sled line. Bid in ACP; escrow releases when both parties sign the contract hash.",
        "starting_acp": "7400",
        "featured": False,
    },
    {
        "id": "dog-corgi",
        "species": "dog",
        "name": "Pip",
        "breed": "Pembroke Welsh Corgi",
        "age_months": 8,
        "blurb": "Compact herding companion. Opening lot for a licensed kennel transfer.",
        "starting_acp": "5800",
        "featured": False,
    },
    {
        "id": "cat-maine-coon",
        "species": "cat",
        "name": "Astra",
        "breed": "Maine Coon",
        "age_months": 14,
        "blurb": "Large-frame Maine Coon. Ownership contract hashed on ACP, not a wildlife listing.",
        "starting_acp": "4800",
        "featured": True,
    },
    {
        "id": "cat-british-shorthair",
        "species": "cat",
        "name": "Coal",
        "breed": "British Shorthair",
        "age_months": 20,
        "blurb": "Indoor companion. Smart-contract bid; seller keeps custody until escrow clears.",
        "starting_acp": "3900",
        "featured": False,
    },
    {
        "id": "cat-siamese",
        "species": "cat",
        "name": "Lumen",
        "breed": "Siamese",
        "age_months": 11,
        "blurb": "Vocal pointed cat. Licensed cattery transfer via ACP escrow.",
        "starting_acp": "3600",
        "featured": False,
    },
    {
        "id": "horse-arabian",
        "species": "horse",
        "name": "Sahara",
        "breed": "Arabian",
        "age_months": 60,
        "blurb": "Endurance Arabian. High-value lot; contract includes passport and vet exam hash.",
        "starting_acp": "45000",
        "featured": True,
    },
    {
        "id": "bird-african-grey",
        "species": "bird",
        "name": "Cipher",
        "breed": "African Grey (captive-bred)",
        "age_months": 36,
        "blurb": "Captive-bred companion parrot with papers. Wild-caught birds are not listed.",
        "starting_acp": "12000",
        "featured": False,
    },
    {
        "id": "rabbit-holland-lop",
        "species": "rabbit",
        "name": "Button",
        "breed": "Holland Lop",
        "age_months": 7,
        "blurb": "House rabbit. Small-lot smart-contract sale for a licensed keeper.",
        "starting_acp": "900",
        "featured": False,
    },
    {
        "id": "fish-koi",
        "species": "fish",
        "name": "Kohaku pair",
        "breed": "Koi (Nishikigoi)",
        "age_months": 30,
        "blurb": "Ornamental pond pair. ACP escrow against a hashed husbandry pack.",
        "starting_acp": "2200",
        "featured": False,
    },
)

_SEED_BY_ID: dict[str, dict[str, Any]] = {str(lot["id"]): lot for lot in _SEED}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


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


def _min_next(current: Decimal) -> Decimal:
    step = (current * _INCREMENT_BPS / Decimal("10000")).quantize(_Q, rounding=ROUND_HALF_UP)
    if step < _MIN_INCREMENT:
        step = _MIN_INCREMENT
    return (current + step).quantize(_Q, rounding=ROUND_HALF_UP)


def contract_hash_for(lot: dict[str, Any]) -> str:
    existing = lot.get("contract_hash")
    if existing:
        return str(existing)
    payload = {
        "settlement": "acp_escrow_smart_contract",
        "lot_id": lot["id"],
        "species": lot["species"],
        "name": lot["name"],
        "breed": lot["breed"],
        "starting_acp": str(lot["starting_acp"]),
    }
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def kinds() -> tuple[AnimalSpecies, ...]:
    return ALLOWED_SPECIES


def _row_to_dict(row: AnimalAuctionLot) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "species": row.species,
        "name": row.name,
        "breed": row.breed,
        "age_months": row.age_months,
        "blurb": row.blurb,
        "starting_acp": str(row.starting_acp),
        "featured": bool(row.featured),
        "status": row.status,
        "seller_user_id": str(row.seller_user_id) if row.seller_user_id else None,
        "contract_hash": row.contract_hash,
        "listed_by_user": True,
    }


async def _user_lots(session: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(AnimalAuctionLot)
            .where(AnimalAuctionLot.status == "live")
            .order_by(AnimalAuctionLot.created_at.desc())
        )
    ).scalars().all()
    return [_row_to_dict(r) for r in rows]


async def _all_lot_defs(session: AsyncSession) -> list[dict[str, Any]]:
    user_lots = await _user_lots(session)
    seen = {lot["id"] for lot in user_lots}
    seeds = [dict(lot) for lot in _SEED if lot["id"] not in seen]
    return [*seeds, *user_lots]


async def _find_lot_def(session: AsyncSession, lot_id: str) -> dict[str, Any]:
    seed = _SEED_BY_ID.get(lot_id)
    if seed:
        return dict(seed)
    row = await session.get(AnimalAuctionLot, lot_id)
    if row is None or row.status != "live":
        raise HTTPException(status_code=404, detail="Unknown animal auction lot")
    return _row_to_dict(row)


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, uuid.UUID, int]]:
    rows = (
        await session.execute(
            select(
                AnimalAuctionBid.lot_id,
                AnimalAuctionBid.amount_acp,
                AnimalAuctionBid.bidder_user_id,
                AnimalAuctionBid.status,
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


def _lot_public(lot: dict[str, Any], high: dict[str, tuple[Decimal, uuid.UUID, int]]) -> AnimalAuctionLotPublic:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    bidder = None
    count = 0
    if info:
        current = max(starting, info[0])
        bidder = info[1] if info[0] >= starting else None
        count = info[2]
    seller = lot.get("seller_user_id")
    seller_uuid = uuid.UUID(str(seller)) if seller else None
    return AnimalAuctionLotPublic(
        id=str(lot["id"]),
        species=lot["species"],  # type: ignore[arg-type]
        name=str(lot["name"]),
        breed=str(lot["breed"]),
        age_months=lot.get("age_months"),
        blurb=str(lot["blurb"]),
        starting_acp=_api_str(starting),
        current_acp=_api_str(current),
        min_next_acp=_api_str(_min_next(current)),
        bid_count=count,
        high_bidder_user_id=bidder,
        seller_user_id=seller_uuid,
        featured=bool(lot.get("featured")),
        status=str(lot.get("status") or "live"),  # type: ignore[arg-type]
        contract_hash=contract_hash_for(lot),
        listed_by_user=bool(lot.get("listed_by_user")),
    )


async def catalog(session: AsyncSession) -> AnimalAuctionCatalogPublic:
    high = await _high_bids(session)
    lots = [_lot_public(lot, high) for lot in await _all_lot_defs(session)]
    featured = [lot for lot in lots if lot.featured]
    return AnimalAuctionCatalogPublic(
        title="ANCAP FAUNA Auction",
        tagline="Buy and sell dogs, cats, and other companion animals on ACP smart-contract escrow.",
        compliance_note=_COMPLIANCE,
        lots=lots,
        featured=featured,
    )


async def get_lot(session: AsyncSession, lot_id: str) -> AnimalAuctionLotPublic:
    lot = await _find_lot_def(session, lot_id)
    high = await _high_bids(session)
    return _lot_public(lot, high)


def _clean_text(value: str, field: str, *, min_len: int, max_len: int) -> str:
    text = "".join(ch for ch in str(value) if ch.isprintable())
    text = " ".join(text.split()).strip()
    if any(ch in text for ch in "<>"):
        raise HTTPException(status_code=400, detail=f"{field} cannot contain markup")
    if len(text) < min_len:
        raise HTTPException(status_code=400, detail=f"{field} is too short")
    if len(text) > max_len:
        raise HTTPException(status_code=400, detail=f"{field} is too long")
    return text


async def list_animal(
    session: AsyncSession, *, user_id: str, body: AnimalAuctionListCreate
) -> AnimalAuctionLotPublic:
    if not body.license_acknowledged:
        raise HTTPException(status_code=400, detail="license_acknowledged required")
    if body.species not in ALLOWED_SPECIES:
        raise HTTPException(status_code=400, detail="Species not allowed — companion animals only")
    name = _clean_text(body.name, "name", min_len=1, max_len=80)
    breed = _clean_text(body.breed, "breed", min_len=1, max_len=80)
    blurb = _clean_text(body.blurb, "blurb", min_len=8, max_len=480)
    starting = _dec(body.starting_acp, "starting_acp")
    lot_id = str(uuid.uuid4())
    payload = {
        "id": lot_id,
        "species": body.species,
        "name": name,
        "breed": breed,
        "starting_acp": _api_str(starting),
    }
    digest = contract_hash_for(payload)
    row = AnimalAuctionLot(
        id=lot_id,
        seller_user_id=user_id,
        species=body.species,
        name=name,
        breed=breed,
        age_months=body.age_months,
        blurb=blurb,
        starting_acp=starting,
        status="live",
        contract_hash=digest,
        featured=False,
        created_at=_utcnow(),
    )
    session.add(row)
    await session.flush()
    return await get_lot(session, lot_id)


async def place_bid(
    session: AsyncSession,
    *,
    user_id: str,
    lot_id: str,
    amount_acp: str,
    note: str | None = None,
) -> AnimalAuctionBidPublic:
    lot = await _find_lot_def(session, lot_id)
    seller = lot.get("seller_user_id")
    if seller and str(seller) == str(user_id):
        raise HTTPException(status_code=400, detail="Seller cannot bid on their own animal")
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
        update(AnimalAuctionBid)
        .where(
            AnimalAuctionBid.lot_id == lot_id,
            AnimalAuctionBid.status.in_(("placed", "winning")),
        )
        .values(status="outbid")
    )
    row = AnimalAuctionBid(
        id=str(uuid.uuid4()),
        lot_id=lot_id,
        bidder_user_id=user_id,
        amount_acp=amount,
        status="winning",
        note=_clean_text(note, "note", min_len=1, max_len=240) if (note or "").strip() else None,
        contract_hash=public.contract_hash,
        created_at=_utcnow(),
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    updated = await get_lot(session, lot_id)
    return AnimalAuctionBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=lot_id,
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        contract_hash=str(row.contract_hash),
        lot=updated,
    )
