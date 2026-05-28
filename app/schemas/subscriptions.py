from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.schemas.common import Money, Pagination


class SubscriptionStatus(str, Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"
    past_due = "past_due"


class SubscriptionBillingPeriod(str, Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    annual = "annual"


class SubscriptionCreateRequest(BaseModel):
    listing_id: str
    billing_period: SubscriptionBillingPeriod = SubscriptionBillingPeriod.monthly
    auto_renew: bool = True


class SubscriptionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    listing_id: str
    user_id: str
    status: SubscriptionStatus
    billing_period: SubscriptionBillingPeriod
    price: Money
    next_billing_at: datetime | None = None
    auto_renew: bool
    retry_count: int
    last_order_id: str | None = None
    created_at: datetime
    updated_at: datetime


class SubscriptionListResponse(Pagination[SubscriptionPublic]):
    pass
