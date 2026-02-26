from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import Money


class OrderStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"
    refunded = "refunded"


class AccessScope(str, Enum):
    view = "view"
    execute = "execute"
    allocate = "allocate"


class OrderPlaceRequest(BaseModel):
    listing_id: str
    buyer_type: str = Field(..., pattern="^(user|agent|pool)$")
    buyer_id: str
    payment_method: str | None = None
    note: str | None = Field(None, max_length=500)


class OrderPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    listing_id: str
    buyer_type: str
    buyer_id: str
    status: OrderStatus
    amount: Money | None = None
    created_at: datetime


class AccessGrantPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    strategy_id: str
    grantee_type: str
    grantee_id: str
    scope: AccessScope
    expires_at: datetime | None = None
    created_at: datetime
