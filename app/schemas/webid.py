"""WebID KYC partner slot — public schemas only; never put secrets here."""
from __future__ import annotations

from pydantic import BaseModel, Field


class WebIdAdapterStatusPublic(BaseModel):
    configured: bool = False
    enabled: bool = False
    role: str = "kyc_partner_slot"
    issues_cards: bool = False
    apple_pay_ready: bool = False
    partner_url: str = "https://webid-solutions.com/en/"
    waitlist_path: str = "/cards"
    waitlist_interest: str = "physical_card_apple_pay"
    status_path: str = "/v1/commerce/webid/status"
    docs_path: str = "docs/WEBID_KYC_AND_CARD_ISSUING_PATH.md"
    notes: list[str] = Field(default_factory=list)
