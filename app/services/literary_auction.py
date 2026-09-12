"""Literary works auction — manuscripts / licenses via ACP escrow anchors."""
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

from app.db.models import LiteraryAuctionBid, LiteraryAuctionLot
from app.schemas.literary_auction import (
    LiteraryAuctionBidPublic,
    LiteraryAuctionCatalogPublic,
    LiteraryAuctionListCreate,
    LiteraryAuctionLotPublic,
    LiteraryPriceIntegrityPublic,
    LitGenre,
)
from app.services.auction_escrow import anchor_bid, anchor_create_lot
from app.services.auction_lock import lock_auction_lot, normalize_lot_id

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("10")
_INCREMENT_BPS = Decimal("200")  # 2%
_MIN_STARTING = Decimal("50")
_MAX_STARTING = Decimal("1000000")
_MAX_START_MULTIPLE = Decimal("12")
_MAX_COMP_MULTIPLE = Decimal("4")
_ELEVATED_START_MULTIPLE = Decimal("3")
_ELEVATED_COMP_MULTIPLE = Decimal("2")
_FAIR_BAND_LOW = Decimal("0.5")
_FAIR_BAND_HIGH = Decimal("1.5")

_COMPLIANCE = (
    "Literary lots license original works / publication rights settled in ACP through AuctionEscrow "
    "anchors. Not a securities offering and not a NAV. Sellers must hold rights they claim. "
    "Nascent-market sentiment can swing perceived value; the desk publishes a genre comparable "
    "median, flags elevated premiums, and fail-closes bids above 12× start or 4× that median. "
    "ANCAP does not host full manuscripts by default — listing blurbs only unless a separate vault "
    "agreement applies."
)

_GENRES: tuple[dict[str, str], ...] = (
    {"id": "poetry", "label": "Poetry"},
    {"id": "novel", "label": "Novel"},
    {"id": "short_story", "label": "Short story"},
    {"id": "essay", "label": "Essay"},
    {"id": "drama", "label": "Drama"},
    {"id": "screenplay", "label": "Screenplay"},
    {"id": "translation", "label": "Translation"},
)

# Stable UUIDs for service reviews on seed lots
_REVIEW_IDS = {
    "lit-ancap-genesis": "d4000004-0000-4000-8000-000000000001",
    "lit-tardigrade-ode": "d4000004-0000-4000-8000-000000000002",
    "lit-bridge-fable": "d4000004-0000-4000-8000-000000000003",
    "lit-lunar-sonnet": "d4000004-0000-4000-8000-000000000004",
}

_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": "lit-ancap-genesis",
        "genre": "essay",
        "title": "ACP Genesis Notes",
        "author": "ANCAP Desk",
        "blurb": "Short essay on ACP-first settlement culture — first-publication license auction.",
        "starting_acp": "2500",
        "featured": True,
        "review_target_id": _REVIEW_IDS["lit-ancap-genesis"],
    },
    {
        "id": "lit-tardigrade-ode",
        "genre": "poetry",
        "title": "Ode to Cryptobiosis",
        "author": "Research Commons",
        "blurb": "Poem inspired by tardigrade cryptobiosis — educational fair-use framing; not medical text.",
        "starting_acp": "800",
        "featured": True,
        "review_target_id": _REVIEW_IDS["lit-tardigrade-ode"],
    },
    {
        "id": "lit-bridge-fable",
        "genre": "short_story",
        "title": "The Wrapped Ledger",
        "author": "Bridge Rail Fiction",
        "blurb": "A short story about wrapping value across a chain bridge — exclusive digital edition rights.",
        "starting_acp": "1500",
        "featured": False,
        "review_target_id": _REVIEW_IDS["lit-bridge-fable"],
    },
    {
        "id": "lit-lunar-sonnet",
        "genre": "poetry",
        "title": "Fourteen Lines Above the Mare",
        "author": "Lunar Desk",
        "blurb": "Sonnet cycle seed lot tied to lunar parcel lore — print + digital license.",
        "starting_acp": "1200",
        "featured": False,
        "review_target_id": _REVIEW_IDS["lit-lunar-sonnet"],
    },
)

_SEED_BY_ID = {item["id"]: item for item in _SEED}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _dec(raw: str, field: str) -> Decimal:
    try:
        value = Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc
    if value <= 0:
        raise HTTPException(status_code=400, detail=f"{field} must be positive")
    return value.quantize(_Q, rounding=ROUND_HALF_UP)


def _api_str(value: Decimal) -> str:
    return format(value.quantize(_Q, rounding=ROUND_HALF_UP), "f")


def _min_next(current: Decimal) -> Decimal:
    step = max(_MIN_INCREMENT, (current * _INCREMENT_BPS / Decimal(10000)).quantize(_Q, rounding=ROUND_HALF_UP))
    return (current + step).quantize(_Q, rounding=ROUND_HALF_UP)


def _median(values: list[Decimal]) -> Decimal | None:
    if not values:
        return None
    ordered = sorted(values)
    n = len(ordered)
    if n % 2 == 1:
        return ordered[n // 2]
    return ((ordered[n // 2 - 1] + ordered[n // 2]) / Decimal(2)).quantize(_Q, rounding=ROUND_HALF_UP)


def _current_for(lot: dict[str, Any], high: dict[str, tuple[Decimal, int]]) -> tuple[Decimal, Decimal, int]:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    count = 0
    if info:
        current = max(starting, info[0])
        count = info[1]
    return starting, current, count


def _genre_medians(lots: list[dict[str, Any]], high: dict[str, tuple[Decimal, int]]) -> dict[str, Decimal]:
    buckets: dict[str, list[Decimal]] = {}
    for lot in lots:
        _starting, current, _count = _current_for(lot, high)
        buckets.setdefault(str(lot["genre"]), []).append(current)
    out: dict[str, Decimal] = {}
    for genre, values in buckets.items():
        median = _median(values)
        if median is not None:
            out[genre] = median
    return out


def _speculation_flag(current: Decimal, starting: Decimal, median: Decimal | None) -> str:
    if starting > 0 and current > starting * _MAX_START_MULTIPLE:
        return "blocked"
    if median is not None and current > median * _MAX_COMP_MULTIPLE:
        return "blocked"
    if starting > 0 and current > starting * _ELEVATED_START_MULTIPLE:
        return "elevated"
    if median is not None and current > median * _ELEVATED_COMP_MULTIPLE:
        return "elevated"
    return "none"


def contract_hash_for(lot: dict[str, Any]) -> str:
    payload = {
        "settlement": "acp_escrow_smart_contract",
        "vertical": "literary",
        "lot_id": lot["id"],
        "genre": lot["genre"],
        "title": lot["title"],
        "author": lot["author"],
        "starting_acp": str(lot["starting_acp"]),
    }
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


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


def _row_to_dict(row: LiteraryAuctionLot) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "genre": row.genre,
        "title": row.title,
        "author": row.author,
        "blurb": row.blurb,
        "starting_acp": str(row.starting_acp),
        "featured": bool(row.featured),
        "status": row.status,
        "seller_user_id": str(row.seller_user_id) if row.seller_user_id else None,
        "contract_hash": row.contract_hash,
        "tx_hash": row.tx_hash,
        "contract_address": row.contract_address,
        "review_target_id": row.review_target_id,
        "listed_by_user": True,
    }


async def _user_lots(session: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(LiteraryAuctionLot)
            .where(LiteraryAuctionLot.status == "live")
            .order_by(LiteraryAuctionLot.created_at.desc())
        )
    ).scalars().all()
    return [_row_to_dict(r) for r in rows]


async def _all_lot_defs(session: AsyncSession) -> list[dict[str, Any]]:
    user_lots = await _user_lots(session)
    seen = {lot["id"] for lot in user_lots}
    seeds = [dict(lot) for lot in _SEED if lot["id"] not in seen]
    return [*seeds, *user_lots]


async def _find_lot_def(session: AsyncSession, lot_id: str) -> dict[str, Any]:
    lot_id = normalize_lot_id(lot_id, unknown="Unknown literary auction lot")
    seed = _SEED_BY_ID.get(lot_id)
    if seed:
        return dict(seed)
    row = await session.get(LiteraryAuctionLot, lot_id)
    if row is None or row.status != "live":
        raise HTTPException(status_code=404, detail="Unknown literary auction lot")
    return _row_to_dict(row)


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, int]]:
    rows = (
        await session.execute(
            select(
                LiteraryAuctionBid.lot_id,
                LiteraryAuctionBid.amount_acp,
                LiteraryAuctionBid.status,
            )
        )
    ).all()
    best: dict[str, Decimal] = {}
    counts: dict[str, int] = {}
    for lot_id, amount, status in rows:
        counts[lot_id] = counts.get(lot_id, 0) + 1
        if status not in ("placed", "winning"):
            continue
        amt = Decimal(str(amount))
        prev = best.get(lot_id)
        if prev is None or amt > prev:
            best[lot_id] = amt
    out: dict[str, tuple[Decimal, int]] = {}
    for lot_id, count in counts.items():
        out[lot_id] = (best.get(lot_id, Decimal("0")), count)
    return out


def _lot_public(
    lot: dict[str, Any],
    high: dict[str, tuple[Decimal, int]],
    medians: dict[str, Decimal] | None = None,
) -> LiteraryAuctionLotPublic:
    starting, current, count = _current_for(lot, high)
    median = (medians or {}).get(str(lot["genre"]))
    premium_bps = 0
    if starting > 0:
        premium_bps = int(((current / starting) - Decimal(1)) * Decimal(10000))
    fair_low = None
    fair_high = None
    if median is not None:
        fair_low = (median * _FAIR_BAND_LOW).quantize(_Q, rounding=ROUND_HALF_UP)
        fair_high = (median * _FAIR_BAND_HIGH).quantize(_Q, rounding=ROUND_HALF_UP)
    review_id = lot.get("review_target_id") or None
    return LiteraryAuctionLotPublic(
        id=str(lot["id"]),
        genre=lot["genre"],  # type: ignore[arg-type]
        title=str(lot["title"]),
        author=str(lot["author"]),
        blurb=str(lot.get("blurb") or ""),
        starting_acp=_api_str(starting),
        current_acp=_api_str(current),
        min_next_acp=_api_str(_min_next(current)),
        bid_count=count,
        featured=bool(lot.get("featured")),
        status=str(lot.get("status") or "live"),  # type: ignore[arg-type]
        contract_hash=str(lot.get("contract_hash") or contract_hash_for(lot)),
        tx_hash=lot.get("tx_hash"),
        contract_address=lot.get("contract_address"),
        review_target_id=str(review_id) if review_id else None,
        listed_by_user=bool(lot.get("listed_by_user")),
        genre_median_acp=_api_str(median) if median is not None else None,
        fair_band_low_acp=_api_str(fair_low) if fair_low is not None else None,
        fair_band_high_acp=_api_str(fair_high) if fair_high is not None else None,
        premium_vs_start_bps=max(0, premium_bps),
        speculation_flag=_speculation_flag(current, starting, median),  # type: ignore[arg-type]
    )


async def catalog(session: AsyncSession) -> LiteraryAuctionCatalogPublic:
    high = await _high_bids(session)
    defs = await _all_lot_defs(session)
    medians = _genre_medians(defs, high)
    lots = [_lot_public(lot, high, medians) for lot in defs]
    featured = [lot for lot in lots if lot.featured]
    return LiteraryAuctionCatalogPublic(
        title="Literary Auction",
        tagline="Auction original literary works and publication licenses — settled in ACP.",
        compliance_note=_COMPLIANCE,
        lots=lots,
        featured=featured,
        genres=list(_GENRES),
        price_integrity=LiteraryPriceIntegrityPublic(),
    )


async def get_lot(session: AsyncSession, lot_id: str) -> LiteraryAuctionLotPublic:
    lot = await _find_lot_def(session, lot_id)
    high = await _high_bids(session)
    medians = _genre_medians(await _all_lot_defs(session), high)
    return _lot_public(lot, high, medians)


async def list_work(
    session: AsyncSession, *, user_id: str, body: LiteraryAuctionListCreate
) -> LiteraryAuctionLotPublic:
    if not body.rights_acknowledged:
        raise HTTPException(status_code=400, detail="rights_acknowledged required")
    allowed: tuple[LitGenre, ...] = (
        "poetry",
        "novel",
        "short_story",
        "essay",
        "drama",
        "screenplay",
        "translation",
        "other",
    )
    if body.genre not in allowed:
        raise HTTPException(status_code=400, detail="Invalid genre")
    title = _clean_text(body.title, "title", min_len=3, max_len=160)
    author = _clean_text(body.author, "author", min_len=2, max_len=120)
    blurb = _clean_text(body.blurb, "blurb", min_len=8, max_len=800)
    starting = _dec(body.starting_acp, "starting_acp")
    if starting < _MIN_STARTING or starting > _MAX_STARTING:
        raise HTTPException(
            status_code=400,
            detail=f"starting_acp must be between {_api_str(_MIN_STARTING)} and {_api_str(_MAX_STARTING)} ACP",
        )
    lot_id = str(uuid.uuid4())
    review_target_id = str(uuid.uuid4())
    payload = {
        "id": lot_id,
        "genre": body.genre,
        "title": title,
        "author": author,
        "starting_acp": _api_str(starting),
    }
    digest = contract_hash_for(payload)
    tx_hash, contract_address = anchor_create_lot(
        lot_id=lot_id,
        seller_address="0x0000000000000000000000000000000000000001",
        reserve_acp=starting,
        claim_hash=digest,
        vertical="literary",
    )
    row = LiteraryAuctionLot(
        id=lot_id,
        seller_user_id=user_id,
        genre=body.genre,
        title=title,
        author=author,
        blurb=blurb,
        starting_acp=starting,
        status="live",
        contract_hash=digest,
        tx_hash=tx_hash,
        contract_address=contract_address,
        featured=False,
        review_target_id=review_target_id,
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
) -> LiteraryAuctionBidPublic:
    lot = await _find_lot_def(session, lot_id)
    seller = lot.get("seller_user_id")
    if seller and str(seller) == str(user_id):
        raise HTTPException(status_code=400, detail="Seller cannot bid on their own literary lot")
    amount = _dec(amount_acp, "amount_acp")
    await lock_auction_lot(session, "literary", str(lot["id"]))
    public = await get_lot(session, str(lot["id"]))
    floor = Decimal(public.starting_acp)
    minimum = floor if public.bid_count == 0 else Decimal(public.min_next_acp)
    if amount < minimum:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {_api_str(minimum)} ACP",
        )
    start_cap = (floor * _MAX_START_MULTIPLE).quantize(_Q, rounding=ROUND_HALF_UP)
    if amount > start_cap:
        raise HTTPException(
            status_code=400,
            detail=f"Bid exceeds {_MAX_START_MULTIPLE}× starting-price anti-pump cap ({_api_str(start_cap)} ACP)",
        )
    if public.genre_median_acp:
        median = Decimal(public.genre_median_acp)
        comp_cap = (median * _MAX_COMP_MULTIPLE).quantize(_Q, rounding=ROUND_HALF_UP)
        if amount > comp_cap:
            raise HTTPException(
                status_code=400,
                detail=f"Bid exceeds {_MAX_COMP_MULTIPLE}× genre comparable median ({_api_str(comp_cap)} ACP)",
            )

    await session.execute(
        update(LiteraryAuctionBid)
        .where(
            LiteraryAuctionBid.lot_id == str(lot["id"]),
            LiteraryAuctionBid.status.in_(("placed", "winning")),
        )
        .values(status="outbid")
    )
    bid_id = uuid.uuid4()
    bid_hash = hashlib.sha256(f"{bid_id}:{user_id}:{amount}".encode()).hexdigest()
    tx_hash, _ = anchor_bid(
        lot_id=str(lot["id"]),
        bidder_address="0x0000000000000000000000000000000000000002",
        amount_acp=amount,
        bid_hash=bid_hash,
    )
    row = LiteraryAuctionBid(
        id=str(bid_id),
        lot_id=str(lot["id"]),
        bidder_user_id=user_id,
        amount_acp=amount,
        status="winning",
        note=_clean_text(note, "note", min_len=1, max_len=240) if (note or "").strip() else None,
        contract_hash=public.contract_hash,
        tx_hash=tx_hash,
        created_at=_utcnow(),
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    updated = await get_lot(session, str(lot["id"]))
    return LiteraryAuctionBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=str(lot["id"]),
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        contract_hash=str(row.contract_hash),
        tx_hash=row.tx_hash,
        lot=updated,
    )
