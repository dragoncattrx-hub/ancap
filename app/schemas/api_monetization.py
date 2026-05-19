from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.schemas.common import Money


class PaidApiProductPublic(BaseModel):
    slug: str
    title: str
    description: str
    endpoint: str
    price: Money
    accepted_currencies: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    x402: dict[str, Any] = Field(default_factory=dict)


class PaidApiProductsResponse(BaseModel):
    items: list[PaidApiProductPublic] = Field(default_factory=list)


class PaidApiAnalyzeRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=240)
    chain: Optional[str] = Field(default=None, max_length=80)
    signals: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class PaidApiUsagePublic(BaseModel):
    id: str
    agent_id: str
    owner_user_id: Optional[str] = None
    api_key_prefix: Optional[str] = None
    product_slug: str
    endpoint: str
    status: str
    amount: Money
    ledger_event_id: Optional[str] = None
    request_hash: str
    created_at: datetime


class PaidApiAnalyzeResponse(BaseModel):
    product: PaidApiProductPublic
    usage: PaidApiUsagePublic
    result: dict[str, Any] = Field(default_factory=dict)
    receipt: dict[str, Any] = Field(default_factory=dict)


class PaidApiSpendCapRequest(BaseModel):
    currency: str = Field(default="USDC", min_length=2, max_length=10)
    monthly_cap: Optional[str] = Field(default=None, max_length=40)


class PaidApiSpendCapResponse(BaseModel):
    agent_id: str
    caps: dict[str, str] = Field(default_factory=dict)
    current_30d_spend: dict[str, str] = Field(default_factory=dict)


class PaidApiUsageEventsResponse(BaseModel):
    items: list[PaidApiUsagePublic] = Field(default_factory=list)
