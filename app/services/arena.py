"""ACP Arena — prediction markets + provably-fair house games settled in ACP."""
from __future__ import annotations

import hashlib
import json
import secrets
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ArenaBet, ArenaHouseRound, ArenaMarket
from app.schemas.arena import (
    ArenaBetCreate,
    ArenaBetPublic,
    ArenaCatalogPublic,
    ArenaHouseCommitRequest,
    ArenaHousePlayRequest,
    ArenaHouseRevealRequest,
    ArenaHouseRoundPublic,
    ArenaMarketPublic,
)

_Q = Decimal("0.00000001")
_HOUSE_EDGE_BPS = 200  # 2%
_MIN_STAKE = Decimal("1")
_MAX_STAKE = Decimal("100000")

_COMPLIANCE = (
    "ACP Arena is an entertainment / prediction desk settled only in ACP. "
    "Settlement mode is record-only until ledger debit/credit is enabled — no real ACP is moved yet. "
    "Not available where gambling is restricted. House games use two-step commit-reveal "
    "(POST /arena/house/commit then /arena/house/reveal). Not investment advice."
)

_SEED_MARKETS: tuple[dict[str, Any], ...] = (
    {
        "id": "evt-wacp-volume",
        "title": "wACP 24h bridge volume > 100k ACP?",
        "description": "Resolves YES if documented bridge volume exceeds 100,000 ACP in the next 24h window.",
        "category": "markets",
        "yes": "Above 100k",
        "no": "At or below 100k",
    },
    {
        "id": "evt-passport-mainnet",
        "title": "Digital Passport live on BSC mainnet this quarter?",
        "description": "Resolves YES when DIGITAL_PASSPORT_CONTRACT is published for mainnet.",
        "category": "product",
        "yes": "Mainnet live",
        "no": "Not yet",
    },
    {
        "id": "evt-fauna-100",
        "title": "FAUNA auction posts 100+ bids this month?",
        "description": "Resolves on counted placed bids across animal_auction_bids.",
        "category": "fauna",
        "yes": "100+",
        "no": "Under 100",
    },
)


def _dec(raw: str) -> Decimal:
    try:
        value = Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid ACP amount") from exc
    if value < _MIN_STAKE or value > _MAX_STAKE:
        raise HTTPException(status_code=400, detail=f"Stake must be between {_MIN_STAKE} and {_MAX_STAKE} ACP")
    return value.quantize(_Q, rounding=ROUND_HALF_UP)


def _fmt(value: Decimal) -> str:
    return format(value.quantize(_Q, rounding=ROUND_HALF_UP), "f")


def _hash_payload(payload: dict[str, Any]) -> str:
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(blob.encode()).hexdigest()


async def ensure_markets(session: AsyncSession) -> None:
    for item in _SEED_MARKETS:
        existing = await session.get(ArenaMarket, item["id"])
        if existing is not None:
            continue
        contract_hash = _hash_payload({"market_id": item["id"], "title": item["title"]})
        session.add(
            ArenaMarket(
                id=item["id"],
                title=item["title"],
                description=item["description"],
                category=item["category"],
                status="open",
                outcome_yes_label=item["yes"],
                outcome_no_label=item["no"],
                contract_hash=contract_hash,
            )
        )
    await session.flush()


async def _market_public(session: AsyncSession, market: ArenaMarket) -> ArenaMarketPublic:
    yes_q = await session.execute(
        select(func.coalesce(func.sum(ArenaBet.stake_acp), 0)).where(
            ArenaBet.market_id == market.id,
            ArenaBet.side == "yes",
            ArenaBet.status.in_(("open", "won", "lost")),
        )
    )
    no_q = await session.execute(
        select(func.coalesce(func.sum(ArenaBet.stake_acp), 0)).where(
            ArenaBet.market_id == market.id,
            ArenaBet.side == "no",
            ArenaBet.status.in_(("open", "won", "lost")),
        )
    )
    count_q = await session.execute(
        select(func.count()).select_from(ArenaBet).where(ArenaBet.market_id == market.id)
    )
    return ArenaMarketPublic(
        id=market.id,
        title=market.title,
        description=market.description,
        category=market.category,
        status=market.status,  # type: ignore[arg-type]
        outcome_yes_label=market.outcome_yes_label,
        outcome_no_label=market.outcome_no_label,
        closes_at=market.closes_at,
        resolved_outcome=market.resolved_outcome,
        yes_pool_acp=_fmt(Decimal(yes_q.scalar_one())),
        no_pool_acp=_fmt(Decimal(no_q.scalar_one())),
        bet_count=int(count_q.scalar_one()),
        contract_hash=market.contract_hash,
    )


async def catalog(session: AsyncSession) -> ArenaCatalogPublic:
    await ensure_markets(session)
    rows = list((await session.execute(select(ArenaMarket).order_by(ArenaMarket.created_at.asc()))).scalars().all())
    markets = [await _market_public(session, m) for m in rows]
    return ArenaCatalogPublic(
        title="ACP Arena",
        tagline="Prediction desk + provably-fair house games. Stakes and payouts in ACP only.",
        compliance_note=_COMPLIANCE,
        markets=markets,
        house_games=[
            {
                "id": "coinflip",
                "label": "Coinflip",
                "choices": ["heads", "tails"],
                "payout_multiple": "1.96",
                "house_edge_bps": _HOUSE_EDGE_BPS,
                "flow": "commit_then_reveal",
            },
            {
                "id": "dice",
                "label": "Dice (pick 1–6)",
                "choices": ["1", "2", "3", "4", "5", "6"],
                "payout_multiple": "5.88",
                "house_edge_bps": _HOUSE_EDGE_BPS,
                "flow": "commit_then_reveal",
            },
        ],
    )


async def place_bet(
    session: AsyncSession,
    *,
    user_id: str,
    market_id: str,
    body: ArenaBetCreate,
) -> ArenaBetPublic:
    await ensure_markets(session)
    market = await session.get(ArenaMarket, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Market not found")
    if market.status != "open":
        raise HTTPException(status_code=400, detail="Market is not open")
    stake = _dec(body.stake_acp)
    bet_id = uuid.uuid4()
    contract_hash = _hash_payload(
        {
            "bet_id": str(bet_id),
            "market_id": market_id,
            "user_id": user_id,
            "side": body.side,
            "stake_acp": _fmt(stake),
        }
    )
    row = ArenaBet(
        id=bet_id,
        market_id=market_id,
        user_id=uuid.UUID(user_id),
        side=body.side,
        stake_acp=stake,
        status="open",
        contract_hash=contract_hash,
    )
    session.add(row)
    await session.flush()
    return ArenaBetPublic(
        id=row.id,
        market_id=row.market_id,
        side=row.side,  # type: ignore[arg-type]
        stake_acp=_fmt(stake),
        status=row.status,
        payout_acp=None,
        contract_hash=row.contract_hash,
        created_at=row.created_at,
        market=await _market_public(session, market),
    )


def _resolve_house(game: str, choice: str, server_seed: str, client_seed: str) -> tuple[str, bool, Decimal]:
    digest = hashlib.sha256(f"{server_seed}:{client_seed}:{game}:{choice}".encode()).hexdigest()
    roll = int(digest[:8], 16)
    if game == "coinflip":
        if choice not in ("heads", "tails"):
            raise HTTPException(status_code=400, detail="choice must be heads or tails")
        result = "heads" if roll % 2 == 0 else "tails"
        won = result == choice
        multiple = Decimal("1.96")
    elif game == "dice":
        if choice not in ("1", "2", "3", "4", "5", "6"):
            raise HTTPException(status_code=400, detail="choice must be 1-6")
        result = str((roll % 6) + 1)
        won = result == choice
        multiple = Decimal("5.88")
    else:
        raise HTTPException(status_code=400, detail="Unknown game")
    return result, won, multiple


def _house_public(row: ArenaHouseRound, *, reveal_seed: bool) -> ArenaHouseRoundPublic:
    return ArenaHouseRoundPublic(
        id=row.id,
        game=row.game,  # type: ignore[arg-type]
        stake_acp=_fmt(Decimal(row.stake_acp)),
        choice="" if row.choice == "__pending__" else row.choice,
        server_seed_hash=row.server_seed_hash,
        server_seed=row.server_seed if reveal_seed else None,
        result=row.result,
        won=row.won,
        payout_acp=_fmt(Decimal(row.payout_acp)) if row.payout_acp is not None else None,
        house_edge_bps=row.house_edge_bps,
        status=row.status,
        contract_hash=row.contract_hash,
        created_at=row.created_at,
        fairness_note=(
            "Commit-reveal: sha256(server_seed) must equal server_seed_hash from commit. "
            "Result = sha256(server_seed:client_seed:game:choice)."
        ),
    )


async def commit_house(
    session: AsyncSession,
    *,
    user_id: str,
    body: ArenaHouseCommitRequest,
) -> ArenaHouseRoundPublic:
    stake = _dec(body.stake_acp)
    server_seed = secrets.token_hex(32)
    server_seed_hash = hashlib.sha256(server_seed.encode()).hexdigest()
    round_id = uuid.uuid4()
    contract_hash = _hash_payload(
        {
            "round_id": str(round_id),
            "game": body.game,
            "stake_acp": _fmt(stake),
            "server_seed_hash": server_seed_hash,
            "phase": "commit",
        }
    )
    row = ArenaHouseRound(
        id=round_id,
        user_id=uuid.UUID(user_id),
        game=body.game,
        stake_acp=stake,
        choice="__pending__",
        server_seed_hash=server_seed_hash,
        server_seed=server_seed,
        result=None,
        won=None,
        payout_acp=None,
        house_edge_bps=_HOUSE_EDGE_BPS,
        status="committed",
        contract_hash=contract_hash,
    )
    session.add(row)
    await session.flush()
    return _house_public(row, reveal_seed=False)


async def reveal_house(
    session: AsyncSession,
    *,
    user_id: str,
    body: ArenaHouseRevealRequest,
) -> ArenaHouseRoundPublic:
    try:
        rid = uuid.UUID(str(body.round_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid round_id") from exc
    row = await session.get(ArenaHouseRound, str(rid))
    if row is None or str(row.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Round not found")
    if row.status != "committed":
        raise HTTPException(status_code=400, detail="Round is not awaiting reveal")
    if not row.server_seed:
        raise HTTPException(status_code=500, detail="Committed seed missing")
    choice = body.choice.lower().strip()
    client_seed = body.client_seed.strip()
    if len(client_seed) < 8:
        raise HTTPException(status_code=400, detail="client_seed must be at least 8 chars")
    result, won, multiple = _resolve_house(row.game, choice, row.server_seed, client_seed)
    stake = Decimal(row.stake_acp)
    payout = (stake * multiple).quantize(_Q, rounding=ROUND_HALF_UP) if won else Decimal("0")
    row.choice = choice
    row.result = result
    row.won = won
    row.payout_acp = payout
    row.status = "resolved"
    row.contract_hash = _hash_payload(
        {
            "round_id": str(row.id),
            "game": row.game,
            "choice": choice,
            "client_seed": client_seed,
            "stake_acp": _fmt(stake),
            "server_seed_hash": row.server_seed_hash,
            "result": result,
        }
    )
    await session.flush()
    return _house_public(row, reveal_seed=True)


async def play_house(
    session: AsyncSession,
    *,
    user_id: str,
    body: ArenaHousePlayRequest,
) -> ArenaHouseRoundPublic:
    """Legacy one-shot path disabled — grindable without prior seed commit."""
    _ = (session, user_id, body)
    raise HTTPException(
        status_code=400,
        detail="Use POST /arena/house/commit then POST /arena/house/reveal (commit-reveal required)",
    )
