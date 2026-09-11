"""Mobile exchange office: multi-asset catalog, hub quotes, tickets.

ACP is the accounting hub. Any supported asset quotes into ACP, out of ACP,
or cross via ACP (FROM → ACP → TO). Settlement still runs on existing rails
(swap desk, OTC intake, bridge, future fiat on-ramp).
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


AssetKind = Literal[
    "native",
    "crypto",
    "stablecoin",
    "metal",
    "goods",
    "commodity",
    "real_estate",
    "space",
    "ip",
    "fiat",
]
AssetAvailability = Literal["live", "beta", "planned"]
QuoteMode = Literal[
    "identity",
    "fixed",
    "indicative",
    "rfq",
    "bridge_1_1",
    "stable_peg",
    "market_feed",
]
SettlementRail = Literal[
    "ledger",
    "swap_desk",
    "otc_metal",
    "otc_goods",
    "otc_commodity",
    "otc_real_estate",
    "otc_space",
    "otc_ip",
    "bridge",
    "stablecoin",
    "dex_deep_link",
    "fiat_onramp",
    "hub_cross",
]
ExchangeDirection = Literal["into_acp", "from_acp", "both", "none"]
TicketStatus = Literal[
    "quoted",
    "opened",
    "awaiting_user",
    "pending_review",
    "settling",
    "completed",
    "cancelled",
    "rejected",
    "expired",
]


class ExchangeAssetPublic(BaseModel):
    id: str
    symbol: str
    label: str
    kind: AssetKind
    availability: AssetAvailability
    direction: ExchangeDirection
    rail: SettlementRail
    quote_mode: QuoteMode
    unit: str = Field(description="Display unit, e.g. ACP, USDT, g, piece, USD")
    decimals: int = 8
    network: str | None = None
    note: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ExchangePairPublic(BaseModel):
    from_asset: str
    to_asset: str
    available: bool
    rail: SettlementRail
    legs: int = Field(description="1 = direct via hub leg, 2 = cross through ACP")
    availability: AssetAvailability
    note: str | None = None


class ExchangeCatalogPublic(BaseModel):
    hub_asset: str = "acp"
    model: str = "acp_hub"
    assets: list[ExchangeAssetPublic]
    pairs: list[ExchangePairPublic]
    quote_ttl_seconds: int
    handoff_note: str
    compliance_note: str


class ExchangeQuoteLeg(BaseModel):
    from_asset: str
    to_asset: str
    from_amount: str
    to_amount: str
    rate: str
    rail: SettlementRail
    quote_mode: QuoteMode
    note: str | None = None


class ExchangeQuoteRequest(BaseModel):
    from_asset: str = Field(..., min_length=1, max_length=64)
    to_asset: str = Field(..., min_length=1, max_length=64)
    from_amount: str = Field(..., description="Decimal amount in from_asset units")
    # Optional OTC metal params when from/to is a metal asset
    purity_ppt: int | None = Field(default=None, ge=100, le=1000)
    # Optional goods estimate when quoting goods → ACP with user estimate
    goods_estimate_acp: str | None = None

    @field_validator("from_asset", "to_asset")
    @classmethod
    def _norm_asset(cls, v: str) -> str:
        return (v or "").strip().lower()


class ExchangeQuotePublic(BaseModel):
    quote_id: str
    from_asset: str
    to_asset: str
    from_amount: str
    to_amount: str
    acp_hub_amount: str
    rate_from_to: str
    legs: list[ExchangeQuoteLeg]
    rail: SettlementRail
    expires_at: str
    indicative: bool
    rate_note: str
    next_step: str


class ExchangeTicketCreateRequest(BaseModel):
    quote_id: str
    payout_acp_address: str | None = Field(
        default=None,
        description="Required when to_asset is ACP (or hub settlement credits ACP).",
    )
    counterparty_address: str | None = Field(
        default=None,
        description="Optional destination for from_acp rails (e.g. BSC for wACP).",
    )
    note: str | None = Field(default=None, max_length=500)
    # Goods / metal detail when opening OTC from a ticket
    goods_title: str | None = Field(default=None, max_length=160)
    goods_description: str | None = Field(default=None, max_length=2000)

    @field_validator("payout_acp_address")
    @classmethod
    def _addr(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip().lower()
        if not s.startswith("acp1") or len(s) < 20:
            raise ValueError("payout_acp_address must be a valid acp1… address")
        return s


class ExchangeTicketAuthSettleRequest(BaseModel):
    tron_txid: str | None = Field(
        default=None,
        max_length=128,
        description="Optional USDT TRC-20 deposit txid when settling swap_desk.",
    )


class ExchangeTicketAdminCompleteRequest(BaseModel):
    note: str | None = Field(default=None, max_length=500)


class ExchangeTicketPublic(BaseModel):
    id: str
    user_id: str | None = None
    status: TicketStatus
    from_asset: str
    to_asset: str
    from_amount: str
    to_amount_estimated: str
    acp_hub_amount: str
    rail: SettlementRail
    rail_ref_type: str | None = None
    rail_ref_id: str | None = None
    quote_id: str
    quote_snapshot: dict[str, Any] = Field(default_factory=dict)
    payout_acp_address: str | None = None
    counterparty_address: str | None = None
    intake_reference: str | None = None
    handoff_instructions: str | None = None
    next_step: str
    note: str | None = None
    expires_at: str | None = None
    created_at: str
    updated_at: str
