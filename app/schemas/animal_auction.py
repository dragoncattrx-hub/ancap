"""FAUNA companion-animal auction schemas (ACP smart-contract escrow)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

AnimalSpecies = Literal["dog", "cat", "horse", "bird", "rabbit", "fish", "other_companion"]
AnimalLotStatus = Literal["live", "sold", "withdrawn"]
AnimalSettlement = Literal["acp_escrow_smart_contract"]


class AnimalAuctionLotPublic(BaseModel):
    id: str
    species: AnimalSpecies
    name: str
    breed: str
    age_months: int | None = None
    blurb: str
    starting_acp: str
    current_acp: str
    min_next_acp: str
    bid_count: int = 0
    high_bidder_user_id: UUID | None = None
    seller_user_id: UUID | None = None
    featured: bool = False
    status: AnimalLotStatus = "live"
    settlement: AnimalSettlement = "acp_escrow_smart_contract"
    contract_hash: str
    listed_by_user: bool = False


class AnimalAuctionCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    lots: list[AnimalAuctionLotPublic]
    featured: list[AnimalAuctionLotPublic] = Field(default_factory=list)


class AnimalAuctionBidCreate(BaseModel):
    amount_acp: str = Field(..., description="Bid amount in ACP; must beat current + increment")
    note: str | None = Field(default=None, max_length=240)


class AnimalAuctionBidPublic(BaseModel):
    id: UUID
    lot_id: str
    amount_acp: str
    status: str
    created_at: datetime
    contract_hash: str
    lot: AnimalAuctionLotPublic


class AnimalAuctionListCreate(BaseModel):
    species: AnimalSpecies
    name: str = Field(min_length=1, max_length=80)
    breed: str = Field(min_length=1, max_length=80)
    age_months: int | None = Field(default=None, ge=0, le=600)
    blurb: str = Field(min_length=8, max_length=480)
    starting_acp: str = Field(..., description="Reserve / opening price in ACP")
    license_acknowledged: bool = Field(
        description="Seller must confirm licensed companion-animal transfer, not wildlife"
    )
