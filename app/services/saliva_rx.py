"""Saliva analysis + individualized drug synthesis / compounding desk.

ACP-settled intents only. Physical assays and compounding are performed solely
by licensed laboratory / pharmacy partners. Not medical advice; not a claim to
cure any disease. No wet-lab synthesis or pathogen work on ANCAP hosts.
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

SERVICE_IDS: dict[str, str] = {
    "saliva-kit": "c3000003-0000-4000-8000-000000000001",
    "saliva-multiomics": "c3000003-0000-4000-8000-000000000002",
    "saliva-disease-panel": "c3000003-0000-4000-8000-000000000003",
    "saliva-rx-design": "c3000003-0000-4000-8000-000000000004",
    "saliva-compound-batch": "c3000003-0000-4000-8000-000000000005",
    "saliva-titration": "c3000003-0000-4000-8000-000000000006",
}

PARTNER_IDS: dict[str, str] = {
    "saliva-lab-network": "d4000004-0000-4000-8000-000000000001",
    "compounding-rx-network": "d4000004-0000-4000-8000-000000000002",
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Saliva Rx desk",
        "tagline": (
            "Treat-by-assay desk: saliva multi-omics → individualized formulation briefs → "
            "licensed compounding / synthesis partners — settled in ACP."
        ),
        "compliance_note": (
            "ANCAP does not diagnose, treat, or cure disease and does not manufacture medicines. "
            "This desk sells ACP intents, assay coordination, and formulation briefs handed to "
            "licensed labs and compounding pharmacies under their jurisdiction. "
            "Saliva biomarkers inform partner workflows; they are not a warranty of cure for any "
            "condition. No pathogen culturing, gene synthesis, or controlled-substance production "
            "runs on ANCAP infrastructure. Always require a licensed clinician/pharmacy where law demands."
        ),
        "pipeline": [
            {
                "id": "collect",
                "label": "1. Saliva collect",
                "detail": "Home or clinic kit; chain-of-custody barcode; ACP kit deposit.",
            },
            {
                "id": "assay",
                "label": "2. Lab assay",
                "detail": "Partner lab multi-omics / biomarker panel from saliva (not wet-lab on ANCAP hosts).",
            },
            {
                "id": "interpret",
                "label": "3. Individual profile",
                "detail": "Per-person biomarker + history brief for clinician / pharmacist review.",
            },
            {
                "id": "formulate",
                "label": "4. Rx design",
                "detail": "Individualized formulation brief (dose, excipients, route) for licensed compounding.",
            },
            {
                "id": "compound",
                "label": "5. Compound / synthesize",
                "detail": "Partner pharmacy synthesizes or compounds the batch under local pharma law.",
            },
            {
                "id": "monitor",
                "label": "6. Titration loop",
                "detail": "Follow-up saliva checks + ACP escrow release on partner milestones.",
            },
        ],
        "services": [
            {
                "id": "saliva-kit",
                "review_target_id": SERVICE_IDS["saliva-kit"],
                "label": "Saliva collection kit + intake",
                "price_from_acp": "2500",
                "blurb": "Kit ship + digital intake questionnaire; escrow until partner lab receives sample.",
            },
            {
                "id": "saliva-multiomics",
                "review_target_id": SERVICE_IDS["saliva-multiomics"],
                "label": "Saliva multi-omics panel",
                "price_from_acp": "18000",
                "blurb": "Partner assay covering host markers / microbiome / metabolomics slices used for formulation briefs.",
            },
            {
                "id": "saliva-disease-panel",
                "review_target_id": SERVICE_IDS["saliva-disease-panel"],
                "label": "Disease-oriented saliva panel brief",
                "price_from_acp": "28000",
                "blurb": (
                    "Condition-scoped biomarker brief from saliva for clinician review — "
                    "supports partner treatment planning; not a diagnosis or cure claim."
                ),
            },
            {
                "id": "saliva-rx-design",
                "review_target_id": SERVICE_IDS["saliva-rx-design"],
                "label": "Individualized Rx design brief",
                "price_from_acp": "45000",
                "blurb": (
                    "Per-individual formulation design (API choices, dose titration band, delivery form) "
                    "from saliva profile + clinician constraints — partner pharmacy executes."
                ),
            },
            {
                "id": "saliva-compound-batch",
                "review_target_id": SERVICE_IDS["saliva-compound-batch"],
                "label": "Personalized compound / synthesis batch",
                "price_from_acp": "95000",
                "blurb": (
                    "ACP settlement for a single-patient compounding or licensed synthesis batch "
                    "matched to the individual's brief. Partner-only manufacture."
                ),
            },
            {
                "id": "saliva-titration",
                "review_target_id": SERVICE_IDS["saliva-titration"],
                "label": "Titration + re-assay loop",
                "price_from_acp": "12000",
                "blurb": "Repeat saliva check + formulation adjustment escrow after first batch.",
            },
        ],
        "partners": [
            {
                "id": "saliva-lab-network",
                "review_target_id": PARTNER_IDS["saliva-lab-network"],
                "name": "Licensed saliva lab network",
                "jurisdiction": "multi",
                "website": "/saliva-rx",
                "blurb": "Desk slot for CLIA/ISO (or local equivalent) saliva assay labs. Verified per contract.",
                "verified": False,
            },
            {
                "id": "compounding-rx-network",
                "review_target_id": PARTNER_IDS["compounding-rx-network"],
                "name": "Licensed compounding / synthesis pharmacies",
                "jurisdiction": "multi",
                "website": "/saliva-rx",
                "blurb": (
                    "Desk slot for pharmacies that compound or synthesize patient-specific medicines "
                    "under prescription and local law. Not operated by ANCAP."
                ),
                "verified": False,
            },
        ],
        "legal_href": "/legal/saliva-rx-notice",
    }


def service_uuid(service_id: str) -> UUID:
    raw = SERVICE_IDS.get(service_id)
    if not raw:
        raise ValueError("Unknown saliva-rx service")
    return UUID(raw)
