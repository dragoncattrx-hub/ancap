"""sACP (Stable ACP) public + intent API models — docs/STABLECOIN_SACP_SPEC.md."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class SacpPublicStatusResponse(BaseModel):
    status: str
    enabled: bool
    paused: bool
    mint_available: bool
    redeem_available: bool
    peg_target: str = "USD"
    peg_note: str
    sacp_contract: str
    gateway_contract: str
    reserve_acp_address: str
    acp_per_usd: str
    min_collateral_ratio: str
    decimals: int = 18
    network: str = "bsc"
    bsc_explorer_base: str
    docs_url: str = "/docs/sacp"
    last_updated_at: datetime | None = None
    notes: list[str] = Field(default_factory=list)


class SacpReserveProofResponse(BaseModel):
    status: str
    enabled: bool
    paused: bool
    peg_target: str = "USD"
    sacp_contract: str
    reserve_acp_address: str
    acp_reserve_balance_smallest: str
    acp_reserve_balance_acp: str
    sacp_total_supply_wei: str
    sacp_circulating: str
    acp_per_usd: str
    min_collateral_ratio: str
    implied_collateral_usd: str | None = None
    required_collateral_usd: str | None = None
    collateral_ratio: str | None = None
    reserve_health: str
    last_updated_at: datetime | None = None
    notes: list[str] = Field(default_factory=list)


class SacpMintIntentRequest(BaseModel):
    acp_amount: str = Field(..., description="ACP units to lock as collateral")
    user_bsc_address: str = Field(..., min_length=42, max_length=66)
    correlation_id: str | None = Field(default=None, max_length=128)

    @field_validator("user_bsc_address")
    @classmethod
    def _norm_bsc(cls, v: str) -> str:
        v = (v or "").strip()
        if not v.startswith("0x") or len(v) < 42:
            raise ValueError("user_bsc_address must be a 0x EVM address")
        return v


class SacpRedeemIntentRequest(BaseModel):
    sacp_amount: str = Field(..., description="sACP units to burn")
    user_acp_address: str = Field(..., min_length=8, max_length=128)
    correlation_id: str | None = Field(default=None, max_length=128)

    @field_validator("user_acp_address")
    @classmethod
    def _norm_acp(cls, v: str) -> str:
        return (v or "").strip()


class SacpOperationPublic(BaseModel):
    id: str
    direction: Literal["mint", "redeem"]
    status: str
    user_bsc_address: str | None = None
    user_acp_address: str | None = None
    amount_acp: str
    amount_sacp: str
    acp_per_usd: str
    min_collateral_ratio: str
    acp_tx_hash: str | None = None
    bsc_tx_hash: str | None = None
    collateral_ref_hex: str | None = None
    correlation_id: str | None = None
    notes: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class SacpAdminBindRequest(BaseModel):
    acp_tx_hash: str | None = None
    bsc_tx_hash: str | None = None
    collateral_ref_hex: str | None = None
    note: str | None = None


class SacpSnapshotRequest(BaseModel):
    reserve_balance_acp_smallest: str = "0"
    sacp_total_supply_wei: str = "0"
    notes: list[str] = Field(default_factory=list)
