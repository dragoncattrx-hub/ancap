from __future__ import annotations

from pydantic import BaseModel, Field


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

