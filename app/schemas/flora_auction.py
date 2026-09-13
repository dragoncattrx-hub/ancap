"""FLORA flower auction schemas — any flower, any form, qty 1…∞, ACP escrow."""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

FlowerForm = Literal[
    "cut",
    "bouquet",
    "potted",
    "seed",
    "bulb",
    "dried",
    "arrangement",
    "hybrid_literacy",
    "other",
]
FloraLotStatus = Literal["live", "sold", "withdrawn"]
FloraSettlement = Literal["acp_escrow_smart_contract"]


class FloraAuctionLotPublic(BaseModel):
    id: str
    form: FlowerForm
    name: str
    variety: str
    quantity: int | None = Field(
        default=None,
        description="Units available. null = unlimited (∞).",
    )
    blurb: str
    starting_acp: str
    current_acp: str
    min_next_acp: str
    bid_count: int = 0
    image_href: str | None = None
    featured: bool = False
    status: FloraLotStatus = "live"
    settlement: FloraSettlement = "acp_escrow_smart_contract"
    contract_hash: str
    listed_by_user: bool = False


class FloraAuctionCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    hero_image_href: str = "/flora/black-beauty.jpg"
    lots: list[FloraAuctionLotPublic]
    featured: list[FloraAuctionLotPublic] = Field(default_factory=list)


class FloraAuctionBidCreate(BaseModel):
    amount_acp: str
    note: str | None = Field(default=None, max_length=240)


class FloraAuctionBidPublic(BaseModel):
    id: UUID
    lot_id: str
    amount_acp: str
    status: str
    created_at: datetime
    contract_hash: str
    tx_hash: str | None = None
    deal_cipher_id: str | None = None
    deal_content_hash: str | None = None
    lot: FloraAuctionLotPublic


class FloraAuctionListCreate(BaseModel):
    form: FlowerForm
    name: str = Field(min_length=1, max_length=120)
    variety: str = Field(min_length=1, max_length=120)
    quantity: int | None = Field(
        default=None,
        description="Units to sell. Omit or null for unlimited (∞). Finite qty must be >= 1.",
    )
    blurb: str = Field(min_length=8, max_length=480)
    starting_acp: str
    image_href: str | None = Field(default=None, max_length=160)
    license_acknowledged: bool

    @field_validator("quantity")
    @classmethod
    def _qty(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value < 1:
            raise ValueError("quantity must be >= 1 or null (unlimited)")
        if value > 10**15:
            raise ValueError("quantity exceeds ceiling")
        return value
