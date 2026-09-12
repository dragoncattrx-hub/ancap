"""Humanitarian aid desk — ACP briefs with Red Cross / Red Crescent handoff rails.

Not a registered charity. Not a signed ICRC/IFRC/national-society contract
unless a dated operator agreement is published on /legal/humanitarian.
The red cross / red crescent emblems are not licensed for ANCAP use.
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

# Stable UUIDs for review targets
SERVICE_IDS: dict[str, str] = {
    "aid-food": "e5000005-0000-4000-8000-000000000001",
    "aid-water": "e5000005-0000-4000-8000-000000000002",
    "aid-nutrition": "e5000005-0000-4000-8000-000000000003",
    "aid-clothing": "e5000005-0000-4000-8000-000000000004",
    "aid-medical": "e5000005-0000-4000-8000-000000000005",
    "aid-livelihood": "e5000005-0000-4000-8000-000000000006",
}

PARTNER_IDS: dict[str, str] = {
    "ifrc": "e6000006-0000-4000-8000-000000000001",
    "ru-red-cross": "e6000006-0000-4000-8000-000000000002",
    "ua-red-cross": "e6000006-0000-4000-8000-000000000003",
    "de-red-cross": "e6000006-0000-4000-8000-000000000004",
    "us-red-cross": "e6000006-0000-4000-8000-000000000005",
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Humanitarian aid desk",
        "tagline": (
            "ACP-settled briefs for food, water, nutrition, warm clothing, medical supplies, "
            "and livelihood matching — partner handoff rails to Red Cross / Red Crescent "
            "national societies, not an ICRC or IFRC contract."
        ),
        "compliance_note": (
            "ANCAP is not a charitable organisation under RF 135-FZ and is not a tax-exempt "
            "charity in the EU, UK, or US. This desk sells ACP-settled aid briefs and partner "
            "handoffs. A listing of the International Federation of Red Cross and Red Crescent "
            "Societies (IFRC) or a national Red Cross / Red Crescent society is not a signed "
            "partnership, not an emblem licence, and not an ICRC endorsement. The red cross, "
            "red crescent, and red crystal emblems are protected under the Geneva Conventions; "
            "ANCAP does not display them as a logo. Medical-supply intents are not a pharmacy "
            "and not medical advice. Livelihood matching is not a licensed employment agency "
            "in every jurisdiction. ACP paid here is a contribution toward a brief / handoff, "
            "not a tax-deductible donation receipt unless a registered charity separately "
            "receipts funds. Distinct from the 100 ACP welcome grant (/legal/welcome-grant), "
            "which is promotional access credit and is not charity."
        ),
        "emblem_licensed": False,
        "official_partnership": False,
        "services": [
            {
                "id": "aid-food",
                "review_target_id": SERVICE_IDS["aid-food"],
                "label": "Emergency food brief",
                "price_from_acp": "2500",
                "blurb": (
                    "ACP contribution toward a food-aid brief and handoff to a listed national "
                    "society or IFRC appeal channel. Not a guaranteed ration delivery by ANCAP."
                ),
            },
            {
                "id": "aid-water",
                "review_target_id": SERVICE_IDS["aid-water"],
                "label": "Safe water brief",
                "price_from_acp": "1800",
                "blurb": (
                    "ACP contribution toward drinking-water / hygiene briefs routed via partner "
                    "channels. ANCAP does not operate wells, tankers, or WASH crews."
                ),
            },
            {
                "id": "aid-nutrition",
                "review_target_id": SERVICE_IDS["aid-nutrition"],
                "label": "Nutrition and foodstuffs brief",
                "price_from_acp": "2200",
                "blurb": (
                    "Staples and nutrition-support brief (foodstuffs, not a restaurant or "
                    "retail grocery). Partner programme rules govern eligibility."
                ),
            },
            {
                "id": "aid-clothing",
                "review_target_id": SERVICE_IDS["aid-clothing"],
                "label": "Warm clothing brief",
                "price_from_acp": "3000",
                "blurb": (
                    "Seasonal / winter clothing brief for partner distribution. Sizes, SKUs, "
                    "and logistics are the partner's, not an ANCAP warehouse."
                ),
            },
            {
                "id": "aid-medical",
                "review_target_id": SERVICE_IDS["aid-medical"],
                "label": "Medical supplies brief (partner channel)",
                "price_from_acp": "4500",
                "blurb": (
                    "Intent for licensed / partner medical-supply channels only. Not a pharmacy, "
                    "not an online drugstore, not a prescription, and not medical advice. "
                    "Controlled substances and unlicensed drug distribution are prohibited."
                ),
            },
            {
                "id": "aid-livelihood",
                "review_target_id": SERVICE_IDS["aid-livelihood"],
                "label": "Livelihood / starting-work match",
                "price_from_acp": "5000",
                "blurb": (
                    "ACP-settled matching brief for livelihood and starting work (подъёмная работа) "
                    "via partner programmes. Not a licensed employment agency in every country "
                    "and not a guaranteed job, wage, or visa."
                ),
            },
        ],
        "partners": [
            {
                "id": "ifrc",
                "review_target_id": PARTNER_IDS["ifrc"],
                "name": "International Federation of Red Cross and Red Crescent Societies (IFRC)",
                "jurisdiction": "CH",
                "website": "https://www.ifrc.org/",
                "blurb": (
                    "IFRC coordinates national Red Cross and Red Crescent societies. Desk listing "
                    "only — not a Federation membership, not a fundraising agency contract, and "
                    "not ICRC (which is a distinct Movement component)."
                ),
                "verified": False,
                "listing_kind": "desk_handoff",
                "official_partnership": False,
                "emblem_licensed": False,
                "ethics_note": (
                    "ICRC, IFRC, and national societies are distinct. A desk listing is not "
                    "permission to use protected emblems and is not a claim that ANCAP is part "
                    "of the International Red Cross and Red Crescent Movement."
                ),
                "regulatory_note": (
                    "Donate or volunteer only through official IFRC / national-society channels. "
                    "ANCAP ACP settlement is a platform brief, not an IFRC tax receipt."
                ),
            },
            {
                "id": "ru-red-cross",
                "review_target_id": PARTNER_IDS["ru-red-cross"],
                "name": "Российский Красный Крест (Russian Red Cross)",
                "jurisdiction": "RU",
                "website": "https://www.redcross.ru/",
                "blurb": "National society listing for RU-jurisdiction handoff. Not a 135-FZ charity operated by ANCAP.",
                "verified": False,
                "listing_kind": "desk_handoff",
                "official_partnership": False,
                "emblem_licensed": False,
                "ethics_note": (
                    "Listing is not a signed MoU and not a licence of the red-cross emblem. "
                    "Confirm programmes on the society's official site."
                ),
                "regulatory_note": (
                    "RF 135-FZ charitable activity, Civil Code art. 582 gifts, and 38-FZ advertising "
                    "rules apply to how this desk is described. ANCAP is not a благотворительная организация."
                ),
            },
            {
                "id": "ua-red-cross",
                "review_target_id": PARTNER_IDS["ua-red-cross"],
                "name": "Товариство Червоного Хреста України (Ukrainian Red Cross)",
                "jurisdiction": "UA",
                "website": "https://redcross.org.ua/",
                "blurb": "National society listing for UA-jurisdiction handoff. Desk listing only.",
                "verified": False,
                "listing_kind": "desk_handoff",
                "official_partnership": False,
                "emblem_licensed": False,
                "ethics_note": (
                    "A listing is not an emblem licence and not a claim of ICRC or IFRC endorsement "
                    "of ANCAP."
                ),
                "regulatory_note": (
                    "Ukrainian humanitarian and advertising law plus Movement statutes govern the "
                    "society. ANCAP ACP is not a Ukrainian charitable-receipt substitute."
                ),
            },
            {
                "id": "de-red-cross",
                "review_target_id": PARTNER_IDS["de-red-cross"],
                "name": "Deutsches Rotes Kreuz (German Red Cross)",
                "jurisdiction": "DE",
                "website": "https://www.drk.de/",
                "blurb": "National society listing for DE-jurisdiction handoff. Desk listing only.",
                "verified": False,
                "listing_kind": "desk_handoff",
                "official_partnership": False,
                "emblem_licensed": False,
                "ethics_note": (
                    "DRK is independent of ANCAP. No UWG / UCPD claim that ANCAP is the Red Cross "
                    "or that ACP payments are automatically steuerlich absetzbar."
                ),
                "regulatory_note": (
                    "German charitable-donation receipts (Zuwendungsbestätigung) come only from a "
                    "recognised recipient, not from an ANCAP ACP ledger entry."
                ),
            },
            {
                "id": "us-red-cross",
                "review_target_id": PARTNER_IDS["us-red-cross"],
                "name": "American Red Cross",
                "jurisdiction": "US",
                "website": "https://www.redcross.org/",
                "blurb": "National society listing for US-jurisdiction handoff. Desk listing only.",
                "verified": False,
                "listing_kind": "desk_handoff",
                "official_partnership": False,
                "emblem_licensed": False,
                "ethics_note": (
                    "Not an American Red Cross fundraising partner unless a dated agreement is "
                    "published. FTC Act §5 bars dressing commercial platform fees as Red Cross activity."
                ),
                "regulatory_note": (
                    "IRC §170 charitable deductions require a qualified organisation receipt. "
                    "ANCAP ACP on this desk is not that receipt."
                ),
            },
        ],
        "legal_href": "/legal/humanitarian",
    }


def service_uuid(service_id: str) -> UUID:
    raw = SERVICE_IDS.get(service_id)
    if not raw:
        raise ValueError("Unknown humanitarian service")
    return UUID(raw)
