"""Schemas for TECH IP / technology license auctions."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

TechCategory = Literal[
    "ai_workflow",
    "identity_nfc",
    "orbital_edge",
    "bridge_rail",
    "longevity",
    "search_p2p",
    "wallet_sdk",
    "other",
]
TechLotStatus = Literal["live", "sold", "withdrawn"]
TechSettlement = Literal["acp_escrow_smart_contract"]


class TechAuctionLotPublic(BaseModel):
    id: str
    category: TechCategory
    title: str
    stack: str
    blurb: str
    starting_acp: str
    current_acp: str
    min_next_acp: str
    bid_count: int = 0
    featured: bool = False
    status: TechLotStatus = "live"
    settlement: TechSettlement = "acp_escrow_smart_contract"
    contract_hash: str
    tx_hash: str | None = None
    contract_address: str | None = None
    exponential_boost_bps: int = 0
    listed_by_user: bool = False


class TechAuctionCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    lots: list[TechAuctionLotPublic]
    featured: list[TechAuctionLotPublic] = Field(default_factory=list)
    technologies: list[dict]


class TechAuctionBidCreate(BaseModel):
    amount_acp: str
    note: str | None = Field(default=None, max_length=240)


class TechAuctionBidPublic(BaseModel):
    id: UUID
    lot_id: str
    amount_acp: str
    status: str
    created_at: datetime
    contract_hash: str
    tx_hash: str | None = None
    lot: TechAuctionLotPublic


class TechAuctionListCreate(BaseModel):
    category: TechCategory
    title: str = Field(min_length=3, max_length=120)
    stack: str = Field(min_length=2, max_length=160)
    blurb: str = Field(min_length=8, max_length=480)
    starting_acp: str
    license_acknowledged: bool
