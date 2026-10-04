"""Starlink installation desk — ACP/wACP-settled field service (Germany / NRW first).

ANCAP is not an official Starlink / Telekom reseller. Paying ACP settles a
platform intake + escrow coordination with an independently qualified installer
partner. Building permits and electrical work remain with the customer/partner.
"""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from app.services.bridge_decimal import WACP_PER_ACP
from app.services.market_economy import get_cached_wacp_usd, usd_to_acp

SERVICE_FEE_EUR = Decimal("3")

SERVICE_IDS: dict[str, str] = {
    "starlink-standard": "a8000008-0000-4000-8000-000000000001",
    "starlink-roof": "a8000008-0000-4000-8000-000000000002",
    "starlink-business": "a8000008-0000-4000-8000-000000000003",
    "starlink-network": "a8000008-0000-4000-8000-000000000004",
    "starlink-mobile": "a8000008-0000-4000-8000-000000000005",
    "starlink-relocate": "a8000008-0000-4000-8000-000000000006",
    "starlink-troubleshoot": "a8000008-0000-4000-8000-000000000007",
}

# Catalog face for workflow_store quote_catalog_acp (= EUR total including fee).
WORKFLOW_CATALOG_EUR: dict[str, str] = {
    "starlink-install-intake": "153",
    "starlink-standard": "153",
    "starlink-roof": "203",
    "starlink-business": "303",
    "starlink-network": "53",
    "starlink-mobile": "183",
    "starlink-relocate": "178",
    "starlink-troubleshoot": "83",
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Starlink Installation — real-world services with ACP",
        "tagline": (
            "Order professional Starlink mounting and network setup through ancap.cloud. "
            "Pay with ACP, wACP, or USDT (via /buy-acp). Germany / NRW first, then EU."
        ),
        "compliance_note": (
            "ANCAP is a payment and coordination platform — not an official Starlink reseller, "
            "not Telekom, and not a Jobcenter employment guarantee. Mounting is performed by an "
            "independently qualified installer partner. Building permits (Baurecht), roof safety, "
            "and electrical work remain the responsibility of the customer and the partner. "
            "Crypto payments require your own eligibility self-attestation under applicable law. "
            "AVGS / Jobcenter funding is decided solely by the agency — this page describes a "
            "business service model, not a funding promise."
        ),
        "legal_href": "/legal/starlink-install",
        "service_fee_eur": str(SERVICE_FEE_EUR),
        "official_reseller": False,
        "jobcenter_guarantee": False,
        "regions": [
            {
                "id": "de-nrw",
                "label": "NRW (Nordrhein-Westfalen)",
                "blurb": "Primary service area for Jobcenter / AVGS-ready demos and local installs.",
            },
            {
                "id": "de",
                "label": "Deutschland",
                "blurb": "Nationwide Germany coverage via partner network (lead times vary).",
            },
            {
                "id": "eu-eea-uk",
                "label": "EU / EEA / UK",
                "blurb": "Expanding corridor — business installs first; confirm availability before travel.",
            },
        ],
        "partners": [
            {
                "id": "installer-nrw-verified",
                "label": "Andrew / Verified Installer",
                "location": "Germany · NRW",
                "verified": True,
                "blurb": (
                    "Independently qualified field installer for residential and light commercial "
                    "Starlink mounts. Not employed by Starlink or Telekom."
                ),
            }
        ],
        "services": [
            {
                "id": "starlink-standard",
                "review_target_id": SERVICE_IDS["starlink-standard"],
                "label": "Standard Starlink Installation",
                "price_eur": "150",
                "workflow_slug": "starlink-standard",
                "regions": ["de-nrw", "de"],
                "blurb": "Residential kit mount, basic aiming, and handoff. Kit hardware sold separately by Starlink.",
            },
            {
                "id": "starlink-roof",
                "review_target_id": SERVICE_IDS["starlink-roof"],
                "label": "Roof / wall mounting",
                "price_eur": "200",
                "workflow_slug": "starlink-roof",
                "regions": ["de-nrw", "de"],
                "blurb": "Elevated roof or facade mount with partner safety protocol. Permits not included.",
            },
            {
                "id": "starlink-business",
                "review_target_id": SERVICE_IDS["starlink-business"],
                "label": "Business installation",
                "price_eur": "300",
                "workflow_slug": "starlink-business",
                "regions": ["de-nrw", "de", "eu-eea-uk"],
                "blurb": "SME / site install with documented handoff. Complex sites may need a follow-on quote.",
            },
            {
                "id": "starlink-network",
                "review_target_id": SERVICE_IDS["starlink-network"],
                "label": "Network / Wi-Fi configuration",
                "price_eur": "50",
                "workflow_slug": "starlink-network",
                "regions": ["de-nrw", "de"],
                "blurb": "Router / Wi-Fi setup and basic LAN check after dish is online.",
            },
            {
                "id": "starlink-mobile",
                "review_target_id": SERVICE_IDS["starlink-mobile"],
                "label": "Mobile / RV installation",
                "price_eur": "180",
                "workflow_slug": "starlink-mobile",
                "regions": ["de-nrw", "de"],
                "blurb": "Vehicle / RV mount literacy and partner install where local rules allow.",
            },
            {
                "id": "starlink-relocate",
                "review_target_id": SERVICE_IDS["starlink-relocate"],
                "label": "Relocation / reinstallation",
                "price_eur": "175",
                "workflow_slug": "starlink-relocate",
                "regions": ["de-nrw", "de"],
                "blurb": "Move an existing kit to a new site and re-aim.",
            },
            {
                "id": "starlink-troubleshoot",
                "review_target_id": SERVICE_IDS["starlink-troubleshoot"],
                "label": "Troubleshooting & optimization",
                "price_eur": "80",
                "workflow_slug": "starlink-troubleshoot",
                "regions": ["de-nrw", "de"],
                "blurb": "Obstruction, cable, and performance troubleshooting visit.",
            },
        ],
    }


def find_service(service_id: str) -> dict[str, Any] | None:
    for svc in catalog()["services"]:
        if svc["id"] == service_id:
            return svc
    return None


def quote(
    *,
    service_id: str,
    region: str | None = None,
    payment_currency: str = "ACP",
) -> dict[str, Any]:
    svc = find_service(service_id)
    if svc is None:
        raise ValueError(f"unknown service_id: {service_id}")

    region_ids = {r["id"] for r in catalog()["regions"]}
    if region and region not in region_ids:
        raise ValueError(f"unknown region: {region}")
    if region and region not in (svc.get("regions") or []):
        raise ValueError(f"service not available in region: {region}")

    install = Decimal(str(svc["price_eur"]))
    fee = SERVICE_FEE_EUR
    total_eur = (install + fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # Display EUR≈USDT 1:1 for sticker; ACP from live oracle.
    spot = get_cached_wacp_usd(allow_stale=True)
    amount_acp = usd_to_acp(total_eur, wacp_usd=spot)
    amount_wacp = (amount_acp * Decimal(WACP_PER_ACP)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    cur = (payment_currency or "ACP").strip().upper()
    if cur == "WACP":
        pay_amount = amount_wacp
    elif cur == "USDT":
        pay_amount = total_eur
    else:
        cur = "ACP"
        pay_amount = amount_acp

    partner = catalog()["partners"][0]
    return {
        "service_id": service_id,
        "region": region,
        "label": svc["label"],
        "installation_fee_eur": format(install, "f"),
        "service_fee_eur": format(fee, "f"),
        "total_eur": format(total_eur, "f"),
        "total_usdt": format(total_eur, "f"),
        "amount_acp": format(amount_acp, "f"),
        "amount_wacp": format(amount_wacp, "f"),
        "payment_currency": cur,
        "pay_amount": format(pay_amount, "f"),
        "oracle_wacp_usd": format(spot or Decimal("0"), "f"),
        "workflow_slug": svc.get("workflow_slug") or "starlink-install-intake",
        "provider_label": partner["label"],
        "provider_location": partner["location"],
        "escrow_note": (
            "Funds reserve into ANCAP workflow escrow on payment. Partner payout after "
            "installation confirmation (MVP: operator capture on run completion)."
        ),
    }
