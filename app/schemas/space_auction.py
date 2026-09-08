"""Galaxy / solar-system title auction schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

SpaceLotKind = Literal[
    "star",
    "planet",
    "satellite",
    "dwarf_planet",
    "asteroid",
    "comet",
    "nebula",
    "galaxy",
    "black_hole",
    "exoplanet",
    "radiation",
]


class SpaceAuctionLotPublic(BaseModel):
    id: str
    kind: SpaceLotKind
    name: str
    designation: str
    parent: str | None = None
    blurb: str
    starting_acp: str
    current_acp: str
    min_next_acp: str
    bid_count: int = 0
    high_bidder_user_id: UUID | None = None
    featured: bool = False


class SpaceAuctionCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    lots: list[SpaceAuctionLotPublic]
    featured: list[SpaceAuctionLotPublic] = Field(default_factory=list)


class SpaceAuctionBidCreate(BaseModel):
    amount_acp: str = Field(..., description="Bid amount in ACP; must beat current + increment")
    note: str | None = Field(default=None, max_length=240)


class SpaceAuctionBidPublic(BaseModel):
    id: UUID
    lot_id: str
    amount_acp: str
    status: str
    created_at: datetime
    lot: SpaceAuctionLotPublic
