"""MoonPay Commerce (Helio) public schemas — never put secrets here."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class HelioAdapterStatusPublic(BaseModel):
    configured: bool
    paylink_configured: bool
    webhook_secret_present: bool
    network: str = "main"
    paylink_id: Optional[str] = None
    primary_payment_method: str = "fiat"
    default_amount: str = "10"
    currency_hint: str = "USDC"
    webhook_path: str = "/v1/commerce/helio/webhook"
    public_webhook_url: str = "https://api.ancap.cloud/v1/commerce/helio/webhook"
    docs_url: str = "https://moonpay.hel.io/developer"
    notes: list[str] = Field(default_factory=list)


class HelioWebhookAck(BaseModel):
    status: str = "ok"
    event: Optional[str] = None
    transaction_id: Optional[str] = None


class HelioWebhookDebugPublic(BaseModel):
    """Operator-facing summary only — never echo shared tokens or raw signatures."""

    received: bool = True
    verified: bool
    event: Optional[str] = None
    meta: dict[str, Any] = Field(default_factory=dict)
