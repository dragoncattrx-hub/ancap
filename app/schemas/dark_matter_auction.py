"""Dark matter title auction schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

DarkMatterLotKind = Literal[
    "halo",
    "filament",
    "void",
    "cluster",
    "detector",
    "particle",
    "cosmology",
]


class DarkMatterLotPublic(BaseModel):
    id: str
    kind: DarkMatterLotKind
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


class DarkMatterCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    legal_href: str = "/legal/dark-matter"
    lots: list[DarkMatterLotPublic]
    featured: list[DarkMatterLotPublic] = Field(default_factory=list)


class DarkMatterBidCreate(BaseModel):
    amount_acp: str = Field(..., description="Bid amount in ACP; must beat current + increment")
    note: str | None = Field(default=None, max_length=240)


class DarkMatterBidPublic(BaseModel):
    id: UUID
    lot_id: str
    amount_acp: str
    status: str
    created_at: datetime
    lot: DarkMatterLotPublic
