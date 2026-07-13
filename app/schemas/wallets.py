from __future__ import annotations

import math
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator
from typing import Literal


class AcpDepositAddressResponse(BaseModel):
    address: str


class AcpBalanceResponse(BaseModel):
    address: str
    units: str
    acp: str
    utxo_count: int = 0
    on_chain_acp: str | None = None
    in_work_acp: str | None = None
    in_work_staked_acp: str | None = None
    in_work_ledger_acp: str | None = None
    available_acp: str | None = None
    vested_unlocked_acp: str | None = None
    vested_locked_acp: str | None = None
    balance_note: str | None = None


class AcpWithdrawRequest(BaseModel):
    to_address: str
    amount_acp: str = Field(..., description="Decimal string, e.g. 1.5")
    fee_acp: str | None = Field(default=None, description="Optional fee in ACP (must be >= network minimum)")
    wallet_password: str = Field(..., min_length=8, description="Account password used to decrypt wallet seed")

    @field_validator("amount_acp", "fee_acp", mode="before")
    @classmethod
    def _coerce_decimal_field(cls, v: object) -> str | None:
        if v is None:
            return None
        if isinstance(v, bool):
            raise ValueError("expected a number or decimal string, not a boolean")
        if isinstance(v, int):
            return str(v)
        if isinstance(v, float):
            if not math.isfinite(v):
                raise ValueError("expected a finite number")
            # Avoid scientific notation and stray float artifacts where possible.
            d = Decimal(str(v))
            return format(d, "f").rstrip("0").rstrip(".") or "0"
        return str(v).strip()


class AcpWithdrawResponse(BaseModel):
    accepted: bool
    txid: str | None = None
    reason: str | None = None


class AcpSwapQuoteRequest(BaseModel):
    usdt_trc20_amount: str = Field(..., description="Decimal string, e.g. 25")


class AcpSwapQuoteResponse(BaseModel):
    usdt_trc20_amount: str
    rate_acp_per_usdt: str
    estimated_acp_amount: str


class AcpSwapOrderCreateRequest(BaseModel):
    usdt_trc20_amount: str = Field(..., description="Decimal string, e.g. 25")
    payout_acp_address: str = Field(..., description="ACP address where converted funds are sent")
    note: str | None = None


class AcpSwapOrderConfirmRequest(BaseModel):
    tron_txid: str | None = None


class AcpSwapOrderPublic(BaseModel):
    id: str
    user_id: str
    status: Literal["awaiting_deposit", "pending_review", "completed", "cancelled", "rejected"]
    usdt_trc20_amount: str
    rate_acp_per_usdt: str
    estimated_acp_amount: str
    payout_acp_address: str
    deposit_trc20_address: str
    deposit_reference: str
    tron_txid: str | None = None
    payout_txid: str | None = None
    note: str | None = None
    created_at: str
    updated_at: str


class AcpSwapCompleteResponse(BaseModel):
    order: AcpSwapOrderPublic
    transfer: AcpWithdrawResponse


class AcpSwapCompleteRequest(BaseModel):
    wallet_password: str = Field(..., min_length=8, description="Account password used to decrypt wallet seed")


class AcpTransactionIoPublic(BaseModel):
    address: str | None = None
    units: str
    acp: str
    vout: int | None = None


class AcpTransactionDetailsPublic(BaseModel):
    txid: str
    block_height: int
    block_hash: str | None = None
    block_time: str
    confirmations: int
    total_input_units: str
    total_input_acp: str
    total_output_units: str
    total_output_acp: str
    fee_units: str
    fee_acp: str
    inputs: list[AcpTransactionIoPublic]
    outputs: list[AcpTransactionIoPublic]


class AcpTransactionPublic(BaseModel):
    txid: str
    block_height: int
    block_time: str
    confirmations: int
    direction: Literal["in", "out", "self"]
    sent_units: str
    sent_acp: str
    received_units: str
    received_acp: str
    net_units: str
    net_acp: str
