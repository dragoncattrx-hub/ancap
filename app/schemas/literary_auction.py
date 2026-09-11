"""Schemas for literary works auction."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

LitGenre = Literal[
    "poetry",
    "novel",
    "short_story",
    "essay",
    "drama",
    "screenplay",
    "translation",
    "other",
]
LitLotStatus = Literal["live", "sold", "withdrawn"]
LitSettlement = Literal["acp_escrow_smart_contract"]


class LiteraryAuctionLotPublic(BaseModel):
    id: str
    genre: LitGenre
    title: str
    author: str
    blurb: str
    starting_acp: str
    current_acp: str
    min_next_acp: str
    bid_count: int = 0
    featured: bool = False
    status: LitLotStatus = "live"
    settlement: LitSettlement = "acp_escrow_smart_contract"
    contract_hash: str
    tx_hash: str | None = None
    contract_address: str | None = None
    review_target_id: str | None = None
    listed_by_user: bool = False


class LiteraryAuctionCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    lots: list[LiteraryAuctionLotPublic]
    featured: list[LiteraryAuctionLotPublic] = Field(default_factory=list)
    genres: list[dict]


class LiteraryAuctionBidCreate(BaseModel):
    amount_acp: str
    note: str | None = Field(default=None, max_length=240)


class LiteraryAuctionBidPublic(BaseModel):
    id: UUID
    lot_id: str
    amount_acp: str
    status: str
    created_at: datetime
    contract_hash: str
    tx_hash: str | None = None
    lot: LiteraryAuctionLotPublic


class LiteraryAuctionListCreate(BaseModel):
    genre: LitGenre
    title: str = Field(min_length=3, max_length=160)
    author: str = Field(min_length=2, max_length=120)
    blurb: str = Field(min_length=8, max_length=800)
    starting_acp: str
    rights_acknowledged: bool
