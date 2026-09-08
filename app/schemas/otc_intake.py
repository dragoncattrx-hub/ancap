"""OTC intake: precious metals + physical goods → ACP desk."""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


OtcRail = Literal["metal", "goods"]
OtcStatus = Literal["awaiting_handoff", "pending_review", "completed", "cancelled", "rejected"]
MetalKind = Literal["gold", "silver", "platinum", "palladium"]
GoodsCategory = Literal["electronics", "jewelry", "collectibles", "industrial", "other"]


class OtcMetalCatalogItem(BaseModel):
    kind: MetalKind
    label: str
    indicative_acp_per_gram: str
    note: str


class OtcGoodsCatalogItem(BaseModel):
    category: GoodsCategory
    label: str
    note: str


class OtcCatalogPublic(BaseModel):
    metals: list[OtcMetalCatalogItem]
    goods: list[OtcGoodsCatalogItem]
    handoff_instructions: str
    compliance_note: str


class OtcMetalQuoteRequest(BaseModel):
    metal: MetalKind
    weight_grams: str = Field(..., description="Decimal grams, e.g. 10.5")
    purity_ppt: int = Field(default=999, ge=100, le=1000, description="Parts per thousand, e.g. 999")


class OtcGoodsQuoteRequest(BaseModel):
    category: GoodsCategory
    estimated_value_acp: str = Field(..., description="User-stated ACP estimate for review")


class OtcQuoteResponse(BaseModel):
    rail: OtcRail
    estimated_acp_amount: str
    rate_note: str
    details: dict[str, Any] = Field(default_factory=dict)


class OtcIntakeCreateRequest(BaseModel):
    rail: OtcRail
    payout_acp_address: str
    note: str | None = None
    # metal
    metal: MetalKind | None = None
    weight_grams: str | None = None
    purity_ppt: int | None = Field(default=None, ge=100, le=1000)
    # goods
    goods_category: GoodsCategory | None = None
    goods_title: str | None = Field(default=None, max_length=160)
    goods_description: str | None = Field(default=None, max_length=2000)
    estimated_value_acp: str | None = None

    @field_validator("payout_acp_address")
    @classmethod
    def _addr(cls, v: str) -> str:
        s = (v or "").strip().lower()
        if not s.startswith("acp1") or len(s) < 20:
            raise ValueError("payout_acp_address must be a valid acp1… address")
        return s


class OtcIntakeConfirmRequest(BaseModel):
    proof_ref: str | None = Field(
        default=None,
        max_length=256,
        description="Tracking number, custody receipt id, or photo/hash reference",
    )
    note: str | None = Field(default=None, max_length=500)


class OtcIntakeOrderPublic(BaseModel):
    id: str
    user_id: str
    rail: OtcRail
    status: OtcStatus
    asset_label: str
    asset_detail: dict[str, Any]
    estimated_acp_amount: str
    payout_acp_address: str
    intake_reference: str
    handoff_instructions: str
    proof_ref: str | None = None
    note: str | None = None
    created_at: str
    updated_at: str
