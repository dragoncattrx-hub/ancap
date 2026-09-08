"""OTC intake: metals, goods (incl antiques), commodities, real estate, space, IP -> ACP."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


OtcRail = Literal["metal", "goods", "commodity", "real_estate", "space", "ip"]
OtcStatus = Literal["awaiting_handoff", "pending_review", "completed", "cancelled", "rejected"]
MetalKind = Literal["gold", "silver", "platinum", "palladium"]
GoodsCategory = Literal[
    "electronics",
    "jewelry",
    "collectibles",
    "antiques",
    "industrial",
    "other",
]
CommodityKind = Literal[
    "oil",
    "natural_gas",
    "uranium",
    "coal",
    "timber",
    "sand",
    "stone",
    "gravel",
    "iron_ore",
    "copper_ore",
    "lithium",
    "rare_earths",
]
RealEstateDeal = Literal["sale", "rental"]
SpaceObjectClass = Literal[
    "satellite",
    "star",
    "planet",
    "moon",
    "debris_slot",
    "orbital_slot",
    "payload_rights",
    "other_space",
]
IpKind = Literal["patent", "recipe"]


class OtcMetalCatalogItem(BaseModel):
    kind: MetalKind
    label: str
    indicative_acp_per_gram: str
    note: str


class OtcGoodsCatalogItem(BaseModel):
    category: GoodsCategory
    label: str
    note: str


class OtcCommodityCatalogItem(BaseModel):
    kind: CommodityKind
    label: str
    unit: str
    indicative_acp_per_unit: str
    note: str


class OtcRealEstateCatalogItem(BaseModel):
    deal_type: RealEstateDeal
    label: str
    note: str


class OtcSpaceCatalogItem(BaseModel):
    object_class: SpaceObjectClass
    label: str
    note: str
    indicative_starting_acp: str = Field(
        default="0",
        description="Indicative auction / desk starting price in ACP for this class",
    )


class OtcIpCatalogItem(BaseModel):
    kind: IpKind
    label: str
    note: str
    ownership_asset_class: str = Field(
        description="Matching OwnershipAssetClass for post-settlement ACP certificate",
    )


class OtcCatalogPublic(BaseModel):
    metals: list[OtcMetalCatalogItem]
    goods: list[OtcGoodsCatalogItem]
    commodities: list[OtcCommodityCatalogItem] = Field(default_factory=list)
    real_estate: list[OtcRealEstateCatalogItem] = Field(default_factory=list)
    space_objects: list[OtcSpaceCatalogItem] = Field(default_factory=list)
    ip_assets: list[OtcIpCatalogItem] = Field(default_factory=list)
    handoff_instructions: str
    compliance_note: str


class OtcMetalQuoteRequest(BaseModel):
    metal: MetalKind
    weight_grams: str = Field(..., description="Decimal grams, e.g. 10.5")
    purity_ppt: int = Field(default=999, ge=100, le=1000)


class OtcGoodsQuoteRequest(BaseModel):
    category: GoodsCategory
    estimated_value_acp: str = Field(..., description="User-stated ACP estimate for review")


class OtcCommodityQuoteRequest(BaseModel):
    commodity: CommodityKind
    quantity: str = Field(..., description="Decimal quantity in commodity unit")
    grade_note: str | None = Field(default=None, max_length=120)


class OtcRealEstateQuoteRequest(BaseModel):
    deal_type: RealEstateDeal = "sale"
    estimated_value_acp: str = Field(..., description="Sale price or lease NPV estimate in ACP")
    jurisdiction: str | None = Field(default=None, max_length=64)
    lease_months: int | None = Field(default=None, ge=1, le=600)


class OtcSpaceQuoteRequest(BaseModel):
    object_class: SpaceObjectClass = "satellite"
    estimated_value_acp: str = Field(..., description="Indicative ACP estimate for desk review")
    norad_or_cospar_id: str | None = Field(default=None, max_length=64)


class OtcIpQuoteRequest(BaseModel):
    kind: IpKind = "patent"
    estimated_value_acp: str = Field(..., description="Indicative ACP estimate for desk review")
    registration_uri: str | None = Field(
        default=None,
        max_length=512,
        description="Patent office URI / application number, or recipe registry pointer",
    )


class OtcQuoteResponse(BaseModel):
    rail: OtcRail
    estimated_acp_amount: str
    rate_note: str
    details: dict[str, Any] = Field(default_factory=dict)


class OtcIntakeCreateRequest(BaseModel):
    rail: OtcRail
    payout_acp_address: str
    note: str | None = None
    metal: MetalKind | None = None
    weight_grams: str | None = None
    purity_ppt: int | None = Field(default=None, ge=100, le=1000)
    goods_category: GoodsCategory | None = None
    goods_title: str | None = Field(default=None, max_length=160)
    goods_description: str | None = Field(default=None, max_length=2000)
    estimated_value_acp: str | None = None
    commodity: CommodityKind | None = None
    quantity: str | None = None
    grade_note: str | None = Field(default=None, max_length=120)
    re_deal_type: RealEstateDeal | None = None
    re_address_or_parcel: str | None = Field(default=None, max_length=240)
    re_jurisdiction: str | None = Field(default=None, max_length=64)
    re_lease_months: int | None = Field(default=None, ge=1, le=600)
    document_hash: str | None = Field(default=None, min_length=64, max_length=128)
    space_object_class: SpaceObjectClass | None = None
    space_object_id: str | None = Field(default=None, max_length=64)
    space_jurisdiction: str | None = Field(default=None, max_length=64)
    ip_kind: IpKind | None = None
    ip_title: str | None = Field(default=None, max_length=200)
    ip_registration_uri: str | None = Field(default=None, max_length=512)
    ip_jurisdiction: str | None = Field(default=None, max_length=64)

    @field_validator("payout_acp_address")
    @classmethod
    def _addr(cls, v: str) -> str:
        s = (v or "").strip().lower()
        if not s.startswith("acp1") or len(s) < 20:
            raise ValueError("payout_acp_address must be a valid acp1 address")
        return s


class OtcIntakeConfirmRequest(BaseModel):
    proof_ref: str | None = Field(default=None, max_length=256)
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
