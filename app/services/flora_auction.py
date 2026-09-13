"""FLORA auction — any flower, any form, quantity 1…∞, ACP escrow smart contracts."""
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

from app.db.models import FloraAuctionBid, FloraAuctionLot
from app.schemas.flora_auction import (
    FloraAuctionBidPublic,
    FloraAuctionCatalogPublic,
    FloraAuctionListCreate,
    FloraAuctionLotPublic,
    FlowerForm,
)
from app.services.auction_deal_seal import seal_auction_deal
from app.services.auction_escrow import anchor_bid, anchor_create_lot
from app.services.auction_lock import lock_auction_lot, normalize_lot_id

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("5")
_INCREMENT_BPS = Decimal("100")  # 1%
_HERO = "/flora/black-beauty.jpg"
_ALLOWED_IMAGE_PREFIX = "/flora/"

ALLOWED_FORMS: tuple[FlowerForm, ...] = (
    "cut",
    "bouquet",
    "potted",
    "seed",
    "bulb",
    "dried",
    "arrangement",
    "hybrid_literacy",
    "other",
)

_COMPLIANCE = (
    "FLORA lots sell flowers in any form (cut, bouquet, potted, seed, bulb, dried, arrangement, "
    "or hybrid-architecture literacy) with quantity from 1 to unlimited (∞), settled in ACP via "
    "AuctionEscrow. Featured Black Beauty art is product literacy about CRISPR-themed hybrid "
    "design — not a CE/FDA plant variety, not a guarantee of melanin petals, and not a live "
    "GMO release sold by ANCAP. Physical plants, seeds, and cuttings remain with licensed "
    "growers / florists under phytosanitary and local trade law. Deals seal under X-Wing PQC envelopes."
)

_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": "flower-black-beauty",
        "form": "hybrid_literacy",
        "name": "Black Beauty",
        "variety": "Rose × Daisy hybrid (CRISPR literacy)",
        "quantity": None,
        "blurb": (
            "Featured ad lot: roses + daisies = Black Beauty. Anthocyanin / melanin petal literacy "
            "(DFR) + daisy floral-meristem themes — partner brief, qty ∞. Nature + science."
        ),
        "starting_acp": "12000",
        "image_href": _HERO,
        "featured": True,
    },
    {
        "id": "flower-black-beauty-stems",
        "form": "cut",
        "name": "Black Beauty stems",
        "variety": "Designer cut stems",
        "quantity": 100,
        "blurb": "Cut-stem pack inspired by the Black Beauty hybrid look. Licensed florist handoff.",
        "starting_acp": "1800",
        "image_href": _HERO,
        "featured": True,
    },
    {
        "id": "flower-rose-red-dozen",
        "form": "bouquet",
        "name": "Classic red rose dozen",
        "variety": "Rosa hybrid tea",
        "quantity": 12,
        "blurb": "Twelve long-stem red roses as a bouquet lot. ACP escrow against florist receipt.",
        "starting_acp": "420",
        "image_href": None,
        "featured": False,
    },
    {
        "id": "flower-orchid-potted",
        "form": "potted",
        "name": "Phalaenopsis orchid",
        "variety": "White moth orchid",
        "quantity": 1,
        "blurb": "Single potted orchid. Qty starts at 1 — list more for continuum supply.",
        "starting_acp": "280",
        "image_href": None,
        "featured": False,
    },
    {
        "id": "flower-tulip-bulbs",
        "form": "bulb",
        "name": "Spring tulip bulbs",
        "variety": "Darwin hybrid mix",
        "quantity": None,
        "blurb": "Bulb lots with unlimited restock flag (∞). Seasonal grower partner rail.",
        "starting_acp": "150",
        "image_href": None,
        "featured": False,
    },
    {
        "id": "flower-lavender-dried",
        "form": "dried",
        "name": "Dried lavender bundles",
        "variety": "Lavandula angustifolia",
        "quantity": 500,
        "blurb": "Dried bundles for décor / scent. Finite warehouse qty on this lot.",
        "starting_acp": "90",
        "image_href": None,
        "featured": False,
    },
    {
        "id": "flower-wildflower-seed",
        "form": "seed",
        "name": "Meadow wildflower seed mix",
        "variety": "Native blend (regional)",
        "quantity": None,
        "blurb": "Seed mix literacy lot — ∞ supply flag. Phytosanitary rules stay with the seller.",
        "starting_acp": "60",
        "image_href": None,
        "featured": False,
    },
    {
        "id": "flower-wedding-arrangement",
        "form": "arrangement",
        "name": "Wedding cascade arrangement",
        "variety": "Custom white / blush",
        "quantity": 1,
        "blurb": "One-off ceremony arrangement. Bid covers design brief + florist escrow.",
        "starting_acp": "2400",
        "image_href": None,
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
        "vertical": "flora",
        "lot_id": lot["id"],
        "form": lot["form"],
        "name": lot["name"],
        "variety": lot["variety"],
        "quantity": lot.get("quantity"),
        "starting_acp": str(lot["starting_acp"]),
    }
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def kinds() -> tuple[FlowerForm, ...]:
    return ALLOWED_FORMS


def _safe_image_href(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    raw = str(value).strip()
    if not raw.startswith(_ALLOWED_IMAGE_PREFIX):
        return None
    if "://" in raw or ".." in raw:
        return None
    return raw[:160]


def _row_to_dict(row: FloraAuctionLot) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "form": row.form,
        "name": row.name,
        "variety": row.variety,
        "quantity": row.quantity,
        "blurb": row.blurb,
        "starting_acp": str(row.starting_acp),
        "image_href": row.image_href,
        "featured": bool(row.featured),
        "status": row.status,
        "seller_user_id": str(row.seller_user_id) if row.seller_user_id else None,
        "contract_hash": row.contract_hash,
        "listed_by_user": True,
    }


async def _user_lots(session: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(FloraAuctionLot)
            .where(FloraAuctionLot.status == "live")
            .order_by(FloraAuctionLot.created_at.desc())
        )
    ).scalars().all()
    return [_row_to_dict(r) for r in rows]


async def _all_lot_defs(session: AsyncSession) -> list[dict[str, Any]]:
    user_lots = await _user_lots(session)
    seen = {lot["id"] for lot in user_lots}
    seeds = [dict(lot) for lot in _SEED if lot["id"] not in seen]
    return [*seeds, *user_lots]


async def _find_lot_def(session: AsyncSession, lot_id: str) -> dict[str, Any]:
    lot_id = normalize_lot_id(lot_id, unknown="Unknown flora auction lot")
    seed = _SEED_BY_ID.get(lot_id)
    if seed:
        return dict(seed)
    row = await session.get(FloraAuctionLot, lot_id)
    if row is None or row.status != "live":
        raise HTTPException(status_code=404, detail="Unknown flora auction lot")
    return _row_to_dict(row)


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, int]]:
    rows = (
        await session.execute(
            select(
                FloraAuctionBid.lot_id,
                FloraAuctionBid.amount_acp,
                FloraAuctionBid.status,
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


def _lot_public(lot: dict[str, Any], high: dict[str, tuple[Decimal, int]]) -> FloraAuctionLotPublic:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    count = 0
    if info:
        current = max(starting, info[0])
        count = info[1]
    return FloraAuctionLotPublic(
        id=str(lot["id"]),
        form=lot["form"],  # type: ignore[arg-type]
        name=str(lot["name"]),
        variety=str(lot["variety"]),
        quantity=lot.get("quantity"),
        blurb=str(lot["blurb"]),
        starting_acp=_api_str(starting),
        current_acp=_api_str(current),
        min_next_acp=_api_str(_min_next(current)),
        bid_count=count,
        image_href=_safe_image_href(lot.get("image_href")),
        featured=bool(lot.get("featured")),
        status=str(lot.get("status") or "live"),  # type: ignore[arg-type]
        contract_hash=contract_hash_for(lot),
        listed_by_user=bool(lot.get("listed_by_user")),
    )


async def catalog(session: AsyncSession) -> FloraAuctionCatalogPublic:
    high = await _high_bids(session)
    lots = [_lot_public(lot, high) for lot in await _all_lot_defs(session)]
    featured = [lot for lot in lots if lot.featured]
    return FloraAuctionCatalogPublic(
        title="ANCAP FLORA Auction",
        tagline="Sell any flower in any form — from 1 stem to ∞ — on ACP escrow smart contracts.",
        compliance_note=_COMPLIANCE,
        hero_image_href=_HERO,
        lots=lots,
        featured=featured,
    )


async def get_lot(session: AsyncSession, lot_id: str) -> FloraAuctionLotPublic:
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


async def list_flora(
    session: AsyncSession, *, user_id: str, body: FloraAuctionListCreate
) -> FloraAuctionLotPublic:
    if not body.license_acknowledged:
        raise HTTPException(status_code=400, detail="license_acknowledged required")
    if body.form not in ALLOWED_FORMS:
        raise HTTPException(status_code=400, detail="Invalid flower form")
    name = _clean_text(body.name, "name", min_len=1, max_len=120)
    variety = _clean_text(body.variety, "variety", min_len=1, max_len=120)
    blurb = _clean_text(body.blurb, "blurb", min_len=8, max_len=480)
    starting = _dec(body.starting_acp, "starting_acp")
    qty = body.quantity
    image_href = _safe_image_href(body.image_href)
    lot_id = str(uuid.uuid4())
    payload = {
        "id": lot_id,
        "form": body.form,
        "name": name,
        "variety": variety,
        "quantity": qty,
        "starting_acp": _api_str(starting),
    }
    digest = contract_hash_for(payload)
    tx_hash, contract_address = anchor_create_lot(
        lot_id=lot_id,
        seller_address="0x0000000000000000000000000000000000000001",
        reserve_acp=starting,
        claim_hash=digest,
        vertical="flora",
    )
    row = FloraAuctionLot(
        id=lot_id,
        seller_user_id=user_id,
        form=body.form,
        name=name,
        variety=variety,
        quantity=qty,
        blurb=blurb,
        starting_acp=starting,
        status="live",
        contract_hash=digest,
        tx_hash=tx_hash,
        contract_address=contract_address,
        image_href=image_href,
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
) -> FloraAuctionBidPublic:
    lot = await _find_lot_def(session, lot_id)
    seller = lot.get("seller_user_id")
    if seller and str(seller) == str(user_id):
        raise HTTPException(status_code=400, detail="Seller cannot bid on their own flora lot")
    amount = _dec(amount_acp, "amount_acp")
    await lock_auction_lot(session, "flora", str(lot["id"]))
    public = await get_lot(session, str(lot["id"]))
    floor = Decimal(public.starting_acp)
    minimum = floor if public.bid_count == 0 else Decimal(public.min_next_acp)
    if amount < minimum:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {_api_str(minimum)} ACP",
        )

    await session.execute(
        update(FloraAuctionBid)
        .where(
            FloraAuctionBid.lot_id == str(lot["id"]),
            FloraAuctionBid.status.in_(("placed", "winning")),
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
    note_clean = _clean_text(note, "note", min_len=1, max_len=240) if (note or "").strip() else None
    env_b64, chash, cipher_id = seal_auction_deal(
        vertical="flora",
        bid_id=str(bid_id),
        lot_id=str(lot["id"]),
        bidder_user_id=str(user_id),
        amount_acp=_api_str(amount),
        note=note_clean,
        contract_hash=public.contract_hash,
        tx_hash=tx_hash,
    )
    row = FloraAuctionBid(
        id=str(bid_id),
        lot_id=str(lot["id"]),
        bidder_user_id=user_id,
        amount_acp=amount,
        status="winning",
        note=None,
        contract_hash=public.contract_hash,
        tx_hash=tx_hash,
        deal_cipher_id=cipher_id,
        deal_envelope_b64=env_b64,
        deal_content_hash=chash,
        created_at=_utcnow(),
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    updated = await get_lot(session, str(lot["id"]))
    return FloraAuctionBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=str(lot["id"]),
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        contract_hash=str(row.contract_hash),
        tx_hash=row.tx_hash,
        deal_cipher_id=row.deal_cipher_id,
        deal_content_hash=row.deal_content_hash,
        lot=updated,
    )
