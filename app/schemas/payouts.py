from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import Money


class PayoutRequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"
    failed = "failed"


class PayoutMethod(str, Enum):
    acp_wallet = "acp_wallet"
    bsc_address = "bsc_address"
    bank_transfer = "bank_transfer"


class PayoutRequestCreateRequest(BaseModel):
    amount: Money
    method: PayoutMethod
    destination: str = Field(..., min_length=3, max_length=255)


class PayoutRequestActionRequest(BaseModel):
    admin_notes: Optional[str] = Field(default=None, max_length=1000)


class PayoutRequestPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    amount: Money
    status: PayoutRequestStatus
    method: PayoutMethod
    destination: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None


class PayoutRequestsResponse(BaseModel):
    items: list[PayoutRequestPublic] = Field(default_factory=list)
