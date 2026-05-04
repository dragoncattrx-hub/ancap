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


class BridgeAllowlistAddRequest(BaseModel):
    bsc_address: str = Field(..., min_length=42, max_length=66)
    note: str | None = None
