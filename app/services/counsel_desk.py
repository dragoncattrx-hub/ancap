"""Worldwide legal counsel desk — ACP briefs + licensed local-counsel handoff.

ANCAP is not a law firm, does not practice law in any jurisdiction, and does
not form an attorney–client relationship. ACP settles a jurisdiction-match
brief and partner handoff to independently licensed counsel.
"""
from __future__ import annotations

from typing import Any

SERVICE_IDS: dict[str, str] = {
    "counsel-jurisdiction-match": "c7000007-0000-4000-8000-000000000001",
    "counsel-entity-setup": "c7000007-0000-4000-8000-000000000002",
    "counsel-contract-review": "c7000007-0000-4000-8000-000000000003",
    "counsel-crypto-assets": "c7000007-0000-4000-8000-000000000004",
    "counsel-immigration": "c7000007-0000-4000-8000-000000000005",
    "counsel-ip-trademark": "c7000007-0000-4000-8000-000000000006",
    "counsel-dispute-referral": "c7000007-0000-4000-8000-000000000007",
    "counsel-tax-match": "c7000007-0000-4000-8000-000000000008",
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Worldwide legal services desk",
        "tagline": (
            "Buy ACP-settled legal briefs and get matched to licensed counsel in any "
            "covered jurisdiction — entity setup, contracts, crypto assets, immigration, "
            "IP, disputes, and tax counsel matching."
        ),
        "compliance_note": (
            "ANCAP is not a law firm and does not practice law in any jurisdiction. "
            "Paying ACP for a desk brief does not create an attorney–client relationship "
            "with ANCAP, does not waive local licensing rules, and is not a guaranteed "
            "court, visa, tax, or regulatory outcome. Licensed counsel remain independent; "
            "they set engagement letters, fees beyond the ANCAP brief, and advice under "
            "local professional rules. AI outputs on this desk are intake literacy only — "
            "not legal advice. Sanctions, export-control, and conflict checks remain with "
            "the matched counsel and the client."
        ),
        "practices_law": False,
        "attorney_client": False,
        "legal_href": "/legal/counsel",
        "regions": [
            {
                "id": "eu-eea-uk",
                "label": "EU / EEA / UK",
                "blurb": "Company, GDPR, MiCA literacy handoffs to licensed EU/UK counsel.",
            },
            {
                "id": "americas",
                "label": "Americas",
                "blurb": "US state / federal and LatAm counsel match rails (not a US law firm).",
            },
            {
                "id": "mena-africa",
                "label": "MENA / Africa",
                "blurb": "UAE, KSA, and selected African jurisdiction match briefs.",
            },
            {
                "id": "asia-pacific",
                "label": "Asia-Pacific",
                "blurb": "Singapore, Hong Kong, Japan, Australia and regional handoff rails.",
            },
            {
                "id": "cis-cee",
                "label": "CIS / CEE",
                "blurb": "CIS and Central/Eastern Europe counsel matching under local bar rules.",
            },
            {
                "id": "global-remote",
                "label": "Global / remote",
                "blurb": "Cross-border and remote-first counsel where local rules allow.",
            },
        ],
        "services": [
            {
                "id": "counsel-jurisdiction-match",
                "review_target_id": SERVICE_IDS["counsel-jurisdiction-match"],
                "label": "Jurisdiction match (any country)",
                "price_from_acp": "3900",
                "workflow_slug": "counsel-jurisdiction-match",
                "regions": ["global-remote", "eu-eea-uk", "americas", "mena-africa", "asia-pacific", "cis-cee"],
                "blurb": (
                    "Tell us the country / issue; receive a licensed-counsel shortlist and "
                    "handoff pack. Worldwide coverage via partner bars — not ANCAP practicing law."
                ),
            },
            {
                "id": "counsel-entity-setup",
                "review_target_id": SERVICE_IDS["counsel-entity-setup"],
                "label": "Entity / incorporation brief",
                "price_from_acp": "8900",
                "workflow_slug": "counsel-entity-setup",
                "regions": ["eu-eea-uk", "americas", "mena-africa", "asia-pacific", "cis-cee"],
                "blurb": (
                    "Intake brief for company / LLC / foundation setup with a licensed local "
                    "counsel handoff. Not a ready-made company sold by ANCAP."
                ),
            },
            {
                "id": "counsel-contract-review",
                "review_target_id": SERVICE_IDS["counsel-contract-review"],
                "label": "Contract review brief",
                "price_from_acp": "4500",
                "workflow_slug": "counsel-contract-review",
                "regions": ["global-remote"],
                "blurb": (
                    "Structured contract intake and licensed-counsel review handoff. "
                    "ANCAP does not redline as your attorney."
                ),
            },
            {
                "id": "counsel-crypto-assets",
                "review_target_id": SERVICE_IDS["counsel-crypto-assets"],
                "label": "Crypto / digital-assets counsel match",
                "price_from_acp": "12000",
                "workflow_slug": "counsel-crypto-assets",
                "regions": ["eu-eea-uk", "americas", "mena-africa", "asia-pacific"],
                "blurb": (
                    "Token, exchange, stablecoin, and ACP-rail literacy pack plus licensed "
                    "crypto-counsel match. Not an investment prospectus or securities opinion."
                ),
            },
            {
                "id": "counsel-immigration",
                "review_target_id": SERVICE_IDS["counsel-immigration"],
                "label": "Immigration / relocation counsel match",
                "price_from_acp": "9800",
                "workflow_slug": "counsel-immigration",
                "regions": ["eu-eea-uk", "americas", "mena-africa", "asia-pacific"],
                "blurb": (
                    "Visa / relocation counsel matching brief. Not a visa guarantee and not "
                    "government processing by ANCAP."
                ),
            },
            {
                "id": "counsel-ip-trademark",
                "review_target_id": SERVICE_IDS["counsel-ip-trademark"],
                "label": "IP / trademark brief",
                "price_from_acp": "7500",
                "workflow_slug": "counsel-ip-trademark",
                "regions": ["eu-eea-uk", "americas", "asia-pacific", "global-remote"],
                "blurb": (
                    "Trademark / copyright / trade-secret intake for licensed IP counsel. "
                    "Not a registration certificate issued by ANCAP."
                ),
            },
            {
                "id": "counsel-dispute-referral",
                "review_target_id": SERVICE_IDS["counsel-dispute-referral"],
                "label": "Dispute / litigation referral",
                "price_from_acp": "15000",
                "workflow_slug": "counsel-dispute-referral",
                "regions": ["global-remote"],
                "blurb": (
                    "Dispute triage brief and litigation / arbitration counsel referral. "
                    "Not courtroom representation by ANCAP."
                ),
            },
            {
                "id": "counsel-tax-match",
                "review_target_id": SERVICE_IDS["counsel-tax-match"],
                "label": "Tax counsel match",
                "price_from_acp": "11000",
                "workflow_slug": "counsel-tax-match",
                "regions": ["eu-eea-uk", "americas", "asia-pacific", "mena-africa"],
                "blurb": (
                    "Match to independently licensed tax counsel / advisors. ANCAP does not "
                    "provide tax advice and does not file returns."
                ),
            },
        ],
    }


def get_service(service_id: str) -> dict[str, Any]:
    for item in catalog()["services"]:
        if item["id"] == service_id:
            return item
    raise ValueError("Unknown counsel service")
