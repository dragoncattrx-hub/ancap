"""Pydantic models for wACP clearing rail API."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class BridgeIntentAcpToBscCreate(BaseModel):
    user_bsc_address: str = Field(..., min_length=42, max_length=66)
    amount_acp: str = Field(..., description="Decimal ACP amount, e.g. 1.25")
    user_acp_address: str | None = Field(None, max_length=128)


class BridgeOperationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    direction: str
    status: str
    user_bsc_address: str | None
    user_acp_address: str | None
    amount_acp_smallest: str
    amount_wacp_wei: str
    acp_tx_hash: str | None = None
    bsc_tx_hash_mint: str | None = None
    deposit_ref_hex: str | None = None
    bsc_log_index: int | None = None
    version: int | None = None
    created_at: datetime | None


class BridgeStatusResponse(BaseModel):
    bridge_rail_enabled: bool
    bridge_rail_paused: bool
    dry_run: bool
    wacp_contract: str
    gateway_contract: str
    reserve_acp_address: str
    confirmations_acp: int
    confirmations_bsc: int
    bsc_explorer_base: str
    acp_explorer_tx_base: str
    counts_by_status: dict[str, int]
    checkpoint_acp: int | None
    checkpoint_bsc: int | None
    last_reconciliation: dict[str, Any] | None = None


class BridgeReserveSummaryResponse(BaseModel):
    total_acp_smallest_locked_intent: str
    total_wacp_wei_completed_mints: str
    operations_pending: int
    operations_completed: int


class WacpReserveProofResponse(BaseModel):
    status: str
    bridge_enabled: bool
    bridge_paused: bool
    acp_reserve_address: str
    acp_reserve_balance_smallest: str
    wacp_contract: str
    wacp_total_supply_wei: str
    wacp_total_supply_acp_smallest: str
    operational_buffer_smallest: str
    backing_ratio: str | None = None
    reserve_health: str
    last_acp_block_height: int | None = None
    last_bsc_block_number: int | None = None
    last_updated_at: datetime | None = None
    notes: list[str] = Field(default_factory=list)


class WacpPublicStatusResponse(BaseModel):
    status: str
    bridge_enabled: bool
    bridge_paused: bool
    mint_available: bool
    redeem_available: bool
    reserve_proof_status: str
    reserve_health: str
    wacp_contract: str
    gateway_contract: str
    reserve_acp_address: str
    confirmations_acp: int
    confirmations_bsc: int
    bsc_explorer_base: str
    acp_explorer_tx_base: str
    checkpoint_acp: int | None = None
    checkpoint_bsc: int | None = None
    last_updated_at: datetime | None = None
    pair_live: bool = False
    pair_dex: str | None = None
    pair_symbol: str | None = None
    pair_address: str | None = None
    pair_url: str | None = None
    swap_url: str | None = None
    liquidity_tx_hash: str | None = None
    first_swap_buy_tx_hash: str | None = None
    first_swap_sell_tx_hash: str | None = None
    bsc_contract_verified: bool = False
    token_metadata_live: bool = False
    docs: dict[str, str]
    counts_by_status: dict[str, int]
    notes: list[str] = Field(default_factory=list)


class BridgeAllowlistAddRequest(BaseModel):
    bsc_address: str = Field(..., min_length=42, max_length=66)
    note: str | None = None
