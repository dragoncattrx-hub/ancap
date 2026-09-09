"""ACP Arena schemas — prediction markets + commit-reveal house games in ACP."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

ArenaSide = Literal["yes", "no"]
ArenaGame = Literal["coinflip", "dice"]
MarketStatus = Literal["open", "closed", "resolved"]


class ArenaMarketPublic(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: MarketStatus
    outcome_yes_label: str
    outcome_no_label: str
    closes_at: Optional[datetime] = None
    resolved_outcome: Optional[str] = None
    yes_pool_acp: str
    no_pool_acp: str
    bet_count: int
    contract_hash: str


class ArenaCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    markets: list[ArenaMarketPublic]
    house_games: list[dict]


class ArenaBetCreate(BaseModel):
    side: ArenaSide
    stake_acp: str = Field(..., description="Stake in ACP")


class ArenaBetPublic(BaseModel):
    id: UUID
    market_id: str
    side: ArenaSide
    stake_acp: str
    status: str
    payout_acp: Optional[str] = None
    contract_hash: str
    created_at: datetime
    market: ArenaMarketPublic


class ArenaHouseCommitRequest(BaseModel):
    game: ArenaGame
    stake_acp: str


class ArenaHouseRevealRequest(BaseModel):
    round_id: UUID
    choice: str = Field(..., description="coinflip: heads|tails; dice: 1-6")
    client_seed: str = Field(..., min_length=8, max_length=128)


class ArenaHousePlayRequest(BaseModel):
    """Deprecated one-shot play — kept for clear 400 guidance."""

    game: ArenaGame
    stake_acp: str
    choice: str = Field(..., description="coinflip: heads|tails; dice: 1-6")


class ArenaHouseRoundPublic(BaseModel):
    id: UUID
    game: ArenaGame
    stake_acp: str
    choice: str
    server_seed_hash: str
    server_seed: Optional[str] = None
    result: Optional[str] = None
    won: Optional[bool] = None
    payout_acp: Optional[str] = None
    house_edge_bps: int
    status: str
    contract_hash: str
    created_at: datetime
    fairness_note: str
