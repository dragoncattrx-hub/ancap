from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.common import Money
from app.schemas.workflow_store import WorkflowCreditPackagePublic, WorkflowRunPaymentIntentPublic


class StripeIntentCreateRequest(BaseModel):
    package_slug: str = Field(..., min_length=1, max_length=80)
    currency: str = Field(default="USD", min_length=3, max_length=10)
    payment_method_id: Optional[str] = Field(default=None, min_length=3, max_length=128)
    save_payment_method: bool = True
    note: Optional[str] = Field(default=None, max_length=500)


class StripeIntentSessionPublic(BaseModel):
    customer_id: str
    payment_intent_id: str
    client_secret: str
    publishable_key: str
    amount: Money
    currency: str
    payment_method_types: list[str] = Field(default_factory=list)
    status: str


class StripeIntentCreateResponse(BaseModel):
    item: WorkflowRunPaymentIntentPublic
    package: WorkflowCreditPackagePublic
    stripe: StripeIntentSessionPublic


class PaymentMethodCardPublic(BaseModel):
    brand: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    funding: Optional[str] = None
    country: Optional[str] = None


class PaymentMethodPublic(BaseModel):
    id: str
    type: str
    customer_id: Optional[str] = None
    reusable: bool = True
    card: Optional[PaymentMethodCardPublic] = None


class PaymentMethodsResponse(BaseModel):
    items: list[PaymentMethodPublic] = Field(default_factory=list)


class RefundRequestCreateRequest(BaseModel):
    payment_intent_id: str = Field(..., min_length=3, max_length=64)
    reason: str = Field(..., min_length=3, max_length=2000)


class RefundRequestActionRequest(BaseModel):
    admin_notes: Optional[str] = Field(default=None, max_length=1000)


class RefundRequestPublic(BaseModel):
    id: str
    payment_intent_id: str
    user_id: str
    amount: Money
    reason: str
    status: str
    admin_notes: Optional[str] = None
    refund_ledger_event_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None


class RefundRequestsResponse(BaseModel):
    items: list[RefundRequestPublic] = Field(default_factory=list)


class StripeWebhookAck(BaseModel):
    received: bool = True
    duplicate: bool = False
    processed: bool = False
    event_id: Optional[str] = None
    event_type: Optional[str] = None
