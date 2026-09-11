"""Cryopreservation desk — tardigrade-inspired protocols + licensed partners.

Educational / partner-prep desk only. Not medical advice. Physical cryonics
performed solely by licensed partners (e.g. KrioRus, Tomorrow.bio).
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

# Stable UUIDs for review targets
SERVICE_IDS: dict[str, str] = {
    "cryo-full-body": "a1000001-0000-4000-8000-000000000001",
    "cryo-neuro": "a1000001-0000-4000-8000-000000000002",
    "cryo-tardigrade-protocol": "a1000001-0000-4000-8000-000000000003",
    "cryo-standby": "a1000001-0000-4000-8000-000000000004",
}

PARTNER_IDS: dict[str, str] = {
    "kriorus": "b2000002-0000-4000-8000-000000000001",
    "tomorrow-bio": "b2000002-0000-4000-8000-000000000002",
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Cryopreservation desk",
        "tagline": "ACP-settled cryonics intents with tardigrade-inspired research protocols — licensed partners only.",
        "compliance_note": (
            "ANCAP does not operate cryonics facilities. Services are intents / briefs settled in ACP "
            "and handed to verified partners. Tardigrade (тихоходки) blood / cryptobiosis references are "
            "research-inspired protocol metadata — not an approved human transfusion product. "
            "Not medical advice. Subject to partner jurisdiction health law and constitutional limits "
            "as of the legal notice date."
        ),
        "services": [
            {
                "id": "cryo-full-body",
                "review_target_id": SERVICE_IDS["cryo-full-body"],
                "label": "Whole-body cryopreservation intent",
                "price_from_acp": "250000",
                "blurb": "Partner handoff for whole-body cryopreservation after consent + medical pack.",
            },
            {
                "id": "cryo-neuro",
                "review_target_id": SERVICE_IDS["cryo-neuro"],
                "label": "Neuro / brain-focused cryopreservation intent",
                "price_from_acp": "120000",
                "blurb": "Neuropreservation pathway via licensed partner; ACP escrow until intake confirmed.",
            },
            {
                "id": "cryo-tardigrade-protocol",
                "review_target_id": SERVICE_IDS["cryo-tardigrade-protocol"],
                "label": "Tardigrade-inspired cryptobiosis protocol brief",
                "price_from_acp": "45000",
                "blurb": (
                    "Research brief using tardigrade (тихоходки) cryptobiosis literature as inspiration "
                    "for partner cryoprotectant discussion — not clinical use of tardigrade blood."
                ),
            },
            {
                "id": "cryo-standby",
                "review_target_id": SERVICE_IDS["cryo-standby"],
                "label": "SST / standby coordination",
                "price_from_acp": "18000",
                "blurb": "Standby / rapid response coordination fee settled in ACP with partner roster.",
            },
        ],
        "partners": [
            {
                "id": "kriorus",
                "review_target_id": PARTNER_IDS["kriorus"],
                "name": "КриоРус (KrioRus)",
                "jurisdiction": "RU",
                "website": "https://kriorus.ru/",
                "blurb": "Российский партнёр по крионике. Handoff после ACP-intent и согласия.",
                "verified": True,
            },
            {
                "id": "tomorrow-bio",
                "review_target_id": PARTNER_IDS["tomorrow-bio"],
                "name": "Tomorrow.bio",
                "jurisdiction": "EU",
                "website": "https://www.tomorrow.bio/",
                "blurb": "European human cryopreservation non-profit / provider. Partner desk listing.",
                "verified": True,
            },
        ],
        "legal_href": "/legal/cryo-constitution",
    }


def service_uuid(service_id: str) -> UUID:
    raw = SERVICE_IDS.get(service_id)
    if not raw:
        raise ValueError("Unknown cryo service")
    return UUID(raw)
