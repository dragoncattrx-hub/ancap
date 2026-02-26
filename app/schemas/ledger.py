from datetime import datetime
from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import Money


class LedgerEventType(str, Enum):
    deposit = "deposit"
    withdraw = "withdraw"
    allocate = "allocate"
    deallocate = "deallocate"
    pnl = "pnl"
    fee = "fee"
    refund = "refund"
    transfer = "transfer"
    stake = "stake"
    unstake = "unstake"
    slash = "slash"


class DepositRequest(BaseModel):
    account_owner_type: str = Field(..., pattern="^(user|agent|pool_treasury)$")
    account_owner_id: str
    amount: Money
    reference: Optional[str] = Field(None, max_length=128)


class WithdrawRequest(BaseModel):
    account_owner_type: str = Field(..., pattern="^(user|agent|pool_treasury)$")
    account_owner_id: str
    amount: Money
    reference: Optional[str] = Field(None, max_length=128)


class AllocateRequest(BaseModel):
    pool_id: str
    strategy_id: str
    amount: Money
    run_params: Optional[dict[str, Any]] = None


class LedgerEventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    ts: datetime
    type: LedgerEventType
    amount: Money
    src_account_id: Optional[str] = None
    dst_account_id: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class BalanceItem(BaseModel):
    currency: str
    amount: str


class BalanceResponse(BaseModel):
    account_id: str
    balances: List[BalanceItem]
