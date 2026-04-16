from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Literal


class AcpDepositAddressResponse(BaseModel):
    address: str


class AcpBalanceResponse(BaseModel):
    address: str
    units: str
    acp: str
    utxo_count: int = 0


class AcpWithdrawRequest(BaseModel):
    to_address: str
    amount_acp: str = Field(..., description="Decimal string, e.g. 1.5")


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
