"""TECH auction — sell/license ANCAP technologies via ACP escrow smart contracts."""
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

from app.db.models import TechAuctionBid, TechAuctionLot
from app.schemas.tech_auction import (
    TechAuctionBidPublic,
    TechAuctionCatalogPublic,
    TechAuctionListCreate,
    TechAuctionLotPublic,
    TechCategory,
)
from app.services.auction_escrow import anchor_bid, anchor_create_lot
from app.services.auction_lock import lock_auction_lot, normalize_lot_id
from app.services.exponential_growth import compute_growth

_Q = Decimal("0.00000001")
_MIN_INCREMENT = Decimal("25")
_INCREMENT_BPS = Decimal("150")  # 1.5%

_COMPLIANCE = (
    "TECH lots license software / IP rails settled in ACP through AuctionEscrow smart-contract anchors. "
    "Not a securities offering. Settlement mode anchors claim hashes on-chain (mock or BSC); "
    "ACP ledger debit is separate and record-aware until ledger escrow is enabled."
)

_TECH_STACK: tuple[dict[str, Any], ...] = (
    {"id": "stack-passport", "label": "Digital Passport (soulbound)", "layer": "identity"},
    {"id": "stack-escrow", "label": "AuctionEscrow (BSC operator)", "layer": "settlement"},
    {"id": "stack-wacp", "label": "wACP BridgeGateway", "layer": "bridge"},
    {"id": "stack-nfc", "label": "Org NFC policy + MASVS wallet", "layer": "identity"},
    {"id": "stack-expo", "label": "Exponential network growth", "layer": "growth"},
    {"id": "stack-searx", "label": "SearXNG + Hypersearch agents", "layer": "search"},
    {"id": "stack-orbital", "label": "Orbital edge sealed payloads", "layer": "infra"},
    {"id": "stack-aeterna", "label": "AETERNA longevity intents", "layer": "longevity"},
    {
        "id": "stack-floquet-bosonic",
        "label": "Single-period Floquet bosonic codes (quantum lattice gates)",
        "layer": "quantum_compute",
        "cite": "PRL 10.1103/tnb8-3m8m · Chalmers / Tianjin · Nauka TV 10 Sep 2026",
    },
)

_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": "tech-llm-workflow-rail",
        "category": "ai_workflow",
        "title": "ACP-paid LLM workflow rail license",
        "stack": "FastAPI + Teneta/Claude + ledger usage events",
        "blurb": "License to run paid AI workflows with ACP metering and x402-style product caps.",
        "starting_acp": "25000",
        "featured": True,
    },
    {
        "id": "tech-passport-nfc",
        "category": "identity_nfc",
        "title": "Soulbound passport + NFC enrollment kit",
        "stack": "DigitalPassport.sol + Expo SecureVault + org NFC policy",
        "blurb": "Identity stack: mint/revoke passport, bind NFC credentials, gate paid-api spend.",
        "starting_acp": "40000",
        "featured": True,
    },
    {
        "id": "tech-auction-escrow",
        "category": "bridge_rail",
        "title": "AuctionEscrow operator module",
        "stack": "AuctionEscrow.sol + mock/bsc drivers",
        "blurb": "Anchor fauna/tech auction lots and bids on BSC with dedicated operator key.",
        "starting_acp": "18000",
        "featured": False,
    },
    {
        "id": "tech-orbital-edge",
        "category": "orbital_edge",
        "title": "Orbital edge sealed payload rail",
        "stack": "FF_ORBITAL_EDGE + control-plane registry",
        "blurb": "License sealed ANCAP edge payloads for satellite / high-latency relays.",
        "starting_acp": "55000",
        "featured": False,
    },
    {
        "id": "tech-hypersearch",
        "category": "search_p2p",
        "title": "Agent Hypersearch + SearXNG pack",
        "stack": "OpenClaw Theodore + SearXNG JSON + Wikipedia index",
        "blurb": "Deploy private search for AI agents with ACP-first tooling.",
        "starting_acp": "12000",
        "featured": False,
    },
    {
        "id": "tech-wallet-sdk",
        "category": "wallet_sdk",
        "title": "ACP mobile wallet SDK surface",
        "stack": "Expo + acp-api-client + SecureVault adapter",
        "blurb": "White-label mobile ACP wallet modules (exchange tab, passport, MASVS L1 path).",
        "starting_acp": "32000",
        "featured": True,
    },
    {
        "id": "tech-aeterna-intents",
        "category": "longevity",
        "title": "AETERNA genomic consult intent pack",
        "stack": "AETERNA API + catalog SKUs",
        "blurb": "ACP-priced longevity consult workflows (licensed partners only).",
        "starting_acp": "100000",
        "featured": False,
    },
    {
        "id": "tech-floquet-bosonic",
        "category": "quantum_compute",
        "title": "Floquet bosonic-code / quantum-lattice-gate consult",
        "stack": "Bosonic codes in microwave resonators + single-period Floquet + quantum lattice gates",
        "blurb": (
            "Literacy license for partner-ready briefs on ~1000× fewer Floquet periods "
            "(one control cycle vs thousands) for bosonic codes on superconducting circuits. "
            "Cites Huang–Du–Guo PRL (2026). Theoretical; not an ANCAP quantum computer."
        ),
        "starting_acp": "75000",
        "featured": True,
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


def _min_next(current: Decimal, boost_bps: int = 0) -> Decimal:
    # Higher exponential network score → slightly lower increment (capped).
    bps = max(Decimal("50"), _INCREMENT_BPS - Decimal(boost_bps))
    step = max(_MIN_INCREMENT, (current * bps / Decimal(10000)).quantize(_Q, rounding=ROUND_HALF_UP))
    return (current + step).quantize(_Q, rounding=ROUND_HALF_UP)


def contract_hash_for(lot: dict[str, Any]) -> str:
    payload = {
        "settlement": "acp_escrow_smart_contract",
        "vertical": "tech",
        "lot_id": lot["id"],
        "category": lot["category"],
        "title": lot["title"],
        "stack": lot["stack"],
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


def _row_to_dict(row: TechAuctionLot) -> dict[str, Any]:
    return {
        "id": str(row.id),
        "category": row.category,
        "title": row.title,
        "stack": row.stack,
        "blurb": row.blurb,
        "starting_acp": str(row.starting_acp),
        "featured": bool(row.featured),
        "status": row.status,
        "seller_user_id": str(row.seller_user_id) if row.seller_user_id else None,
        "contract_hash": row.contract_hash,
        "tx_hash": row.tx_hash,
        "contract_address": row.contract_address,
        "listed_by_user": True,
    }


async def _user_lots(session: AsyncSession) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            select(TechAuctionLot)
            .where(TechAuctionLot.status == "live")
            .order_by(TechAuctionLot.created_at.desc())
        )
    ).scalars().all()
    return [_row_to_dict(r) for r in rows]


async def _all_lot_defs(session: AsyncSession) -> list[dict[str, Any]]:
    user_lots = await _user_lots(session)
    seen = {lot["id"] for lot in user_lots}
    seeds = [dict(lot) for lot in _SEED if lot["id"] not in seen]
    return [*seeds, *user_lots]


async def _find_lot_def(session: AsyncSession, lot_id: str) -> dict[str, Any]:
    lot_id = normalize_lot_id(lot_id, unknown="Unknown tech auction lot")
    seed = _SEED_BY_ID.get(lot_id)
    if seed:
        return dict(seed)
    row = await session.get(TechAuctionLot, lot_id)
    if row is None or row.status != "live":
        raise HTTPException(status_code=404, detail="Unknown tech auction lot")
    return _row_to_dict(row)


async def _high_bids(session: AsyncSession) -> dict[str, tuple[Decimal, int]]:
    rows = (
        await session.execute(
            select(
                TechAuctionBid.lot_id,
                TechAuctionBid.amount_acp,
                TechAuctionBid.status,
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


async def _boost_bps(session: AsyncSession, user_id: str | None) -> int:
    if not user_id:
        return 0
    try:
        growth = await compute_growth(session, user_id=user_id)
        # Cap boost at 100 bps (1%) off increment schedule.
        mult = float(growth.total_multiplier)
        return min(100, max(0, int((mult - 1.0) * 200)))
    except Exception:
        return 0


def _lot_public(
    lot: dict[str, Any],
    high: dict[str, tuple[Decimal, int]],
    *,
    boost_bps: int = 0,
) -> TechAuctionLotPublic:
    starting = Decimal(str(lot["starting_acp"]))
    info = high.get(str(lot["id"]))
    current = starting
    count = 0
    if info:
        current = max(starting, info[0])
        count = info[1]
    return TechAuctionLotPublic(
        id=str(lot["id"]),
        category=lot["category"],  # type: ignore[arg-type]
        title=str(lot["title"]),
        stack=str(lot["stack"]),
        blurb=str(lot.get("blurb") or ""),
        starting_acp=_api_str(starting),
        current_acp=_api_str(current),
        min_next_acp=_api_str(_min_next(current, boost_bps)),
        bid_count=count,
        featured=bool(lot.get("featured")),
        status=str(lot.get("status") or "live"),  # type: ignore[arg-type]
        contract_hash=str(lot.get("contract_hash") or contract_hash_for(lot)),
        tx_hash=lot.get("tx_hash"),
        contract_address=lot.get("contract_address"),
        exponential_boost_bps=boost_bps,
        listed_by_user=bool(lot.get("listed_by_user")),
    )


async def catalog(session: AsyncSession, *, user_id: str | None = None) -> TechAuctionCatalogPublic:
    high = await _high_bids(session)
    boost = await _boost_bps(session, user_id)
    lots = [_lot_public(lot, high, boost_bps=boost) for lot in await _all_lot_defs(session)]
    featured = [lot for lot in lots if lot.featured]
    return TechAuctionCatalogPublic(
        title="ANCAP TECH Auction",
        tagline="License ANCAP technologies — AI, identity, escrow, orbital, quantum-compute literacy — settled in ACP.",
        compliance_note=_COMPLIANCE,
        lots=lots,
        featured=featured,
        technologies=list(_TECH_STACK),
    )


async def get_lot(session: AsyncSession, lot_id: str, *, user_id: str | None = None) -> TechAuctionLotPublic:
    lot = await _find_lot_def(session, lot_id)
    high = await _high_bids(session)
    boost = await _boost_bps(session, user_id)
    return _lot_public(lot, high, boost_bps=boost)


async def list_tech(
    session: AsyncSession, *, user_id: str, body: TechAuctionListCreate
) -> TechAuctionLotPublic:
    if not body.license_acknowledged:
        raise HTTPException(status_code=400, detail="license_acknowledged required")
    allowed: tuple[TechCategory, ...] = (
        "ai_workflow",
        "identity_nfc",
        "orbital_edge",
        "bridge_rail",
        "longevity",
        "search_p2p",
        "wallet_sdk",
        "quantum_compute",
        "other",
    )
    if body.category not in allowed:
        raise HTTPException(status_code=400, detail="Invalid technology category")
    title = _clean_text(body.title, "title", min_len=3, max_len=120)
    stack = _clean_text(body.stack, "stack", min_len=2, max_len=160)
    blurb = _clean_text(body.blurb, "blurb", min_len=8, max_len=480)
    starting = _dec(body.starting_acp, "starting_acp")
    lot_id = str(uuid.uuid4())
    payload = {
        "id": lot_id,
        "category": body.category,
        "title": title,
        "stack": stack,
        "starting_acp": _api_str(starting),
    }
    digest = contract_hash_for(payload)
    tx_hash, contract_address = anchor_create_lot(
        lot_id=lot_id,
        seller_address="0x0000000000000000000000000000000000000001",
        reserve_acp=starting,
        claim_hash=digest,
        vertical="tech",
    )
    row = TechAuctionLot(
        id=lot_id,
        seller_user_id=user_id,
        category=body.category,
        title=title,
        stack=stack,
        blurb=blurb,
        starting_acp=starting,
        status="live",
        contract_hash=digest,
        tx_hash=tx_hash,
        contract_address=contract_address,
        featured=False,
        created_at=_utcnow(),
    )
    session.add(row)
    await session.flush()
    return await get_lot(session, lot_id, user_id=user_id)


async def place_bid(
    session: AsyncSession,
    *,
    user_id: str,
    lot_id: str,
    amount_acp: str,
    note: str | None = None,
) -> TechAuctionBidPublic:
    lot = await _find_lot_def(session, lot_id)
    seller = lot.get("seller_user_id")
    if seller and str(seller) == str(user_id):
        raise HTTPException(status_code=400, detail="Seller cannot bid on their own tech lot")
    amount = _dec(amount_acp, "amount_acp")
    await lock_auction_lot(session, "tech", str(lot["id"]))
    public = await get_lot(session, str(lot["id"]), user_id=user_id)
    floor = Decimal(public.starting_acp)
    minimum = floor if public.bid_count == 0 else Decimal(public.min_next_acp)
    if amount < minimum:
        raise HTTPException(
            status_code=400,
            detail=f"Bid must be at least {_api_str(minimum)} ACP",
        )

    await session.execute(
        update(TechAuctionBid)
        .where(
            TechAuctionBid.lot_id == str(lot["id"]),
            TechAuctionBid.status.in_(("placed", "winning")),
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
    row = TechAuctionBid(
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
    updated = await get_lot(session, str(lot["id"]), user_id=user_id)
    return TechAuctionBidPublic(
        id=uuid.UUID(str(row.id)),
        lot_id=str(lot["id"]),
        amount_acp=_api_str(Decimal(str(row.amount_acp))),
        status=str(row.status),
        created_at=row.created_at,
        contract_hash=str(row.contract_hash),
        tx_hash=row.tx_hash,
        lot=updated,
    )
