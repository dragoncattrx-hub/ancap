"""WebID KYC partner slot — fail-closed until commercial credentials exist."""
from __future__ import annotations

from app.config import get_settings
from app.schemas.webid import WebIdAdapterStatusPublic


def webid_is_configured() -> bool:
    settings = get_settings()
    if not bool(settings.webid_enabled):
        return False
    return bool(
        (settings.webid_api_base or "").strip()
        and (settings.webid_client_id or "").strip()
        and (settings.webid_client_secret or "").strip()
    )


def webid_public_status() -> WebIdAdapterStatusPublic:
    settings = get_settings()
    enabled = bool(settings.webid_enabled)
    configured = webid_is_configured()
    notes: list[str] = [
        "WebID is a KYC/KYB identity partner slot — it does not issue payment cards or enable Apple Pay.",
        "Physical cards and Apple Pay require a separate licensed BaaS/EMI issuer after counsel review.",
    ]
    if not enabled:
        notes.append("WEBID_ENABLED is false — IDV flows stay off.")
    elif not configured:
        notes.append("WEBID_API_BASE / WEBID_CLIENT_ID / WEBID_CLIENT_SECRET incomplete — fail-closed.")
    return WebIdAdapterStatusPublic(
        configured=configured,
        enabled=enabled,
        role="kyc_partner_slot",
        issues_cards=False,
        apple_pay_ready=False,
        notes=notes,
    )
