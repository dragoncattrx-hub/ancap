from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ClaimCodeCreateRequest(BaseModel):
    amount: str
    currency: str = "ACP"
    max_redemptions: int = Field(default=1, ge=1, le=10000)
    expires_in_hours: int | None = Field(default=168, ge=1, le=8760)
    campaign_label: str | None = None
    pin: str | None = Field(default=None, min_length=4, max_length=32)


class ClaimCodeCreateResponse(BaseModel):
    id: str
    code: str
    code_hint: str
    amount: str
    currency: str
    max_redemptions: int
    expires_at: datetime | None
    campaign_label: str | None
    redeem_url: str


class ClaimCodeRedeemRequest(BaseModel):
    code: str = Field(min_length=6, max_length=64)
    pin: str | None = None


class ClaimCodeRedeemResponse(BaseModel):
    status: str
    amount: str
    currency: str
    ledger_event_id: str
    proof_url: str


class ClaimCodePublic(BaseModel):
    id: str
    code_hint: str
    amount: str
    currency: str
    status: str
    max_redemptions: int
    redemption_count: int
    expires_at: datetime | None
    campaign_label: str | None
    created_at: datetime
