"""Quantum-link digital SIM desk — PQC channels + global low-ping mesh intents.

ACP-settled product intents only. ANCAP does not claim a proprietary QKD satellite
constellation today. “Quantum encryption” here means post-quantum / QKD-partner
pathways documented for licensed carriers. Not a regulated telecom license by itself.
"""
from __future__ import annotations

from typing import Any

SERVICE_IDS: dict[str, str] = {
    "qsim-esim": "e5000005-0000-4000-8000-000000000001",
    "qsim-pqc-channel": "e5000005-0000-4000-8000-000000000002",
    "qsim-global-mesh": "e5000005-0000-4000-8000-000000000003",
    "qsim-sat-backhaul": "e5000005-0000-4000-8000-000000000004",
    "qsim-relay-fleet": "e5000005-0000-4000-8000-000000000005",
}

RESEARCH_REF = {
    "id": "ixbt-quantum-paradox-2026",
    "title": "iXBT Live — AI helped prove an ‘impossible’ quantum paradox in data protection",
    "url": (
        "https://www.ixbt.com/live/science/"
        "0-0-0-ii-pomog-dokazat-nevozmozhnyy-kvantovyy-paradoks-v-zaschite-dannyh.html"
    ),
    "note": (
        "Public science journalism cite. ANCAP is not affiliated with iXBT. "
        "Citation informs PQC / quantum-info literacy for the digital SIM desk — not a product warranty."
    ),
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Quantum-link digital SIM",
        "tagline": (
            "Digital eSIM with post-quantum channel intents and a global low-ping mesh "
            "via satellites, base stations, and repeaters — settled in ACP."
        ),
        "compliance_note": (
            "ANCAP sells ACP intents / coordination briefs and partner handoffs. "
            "We do not unilaterally operate a licensed MNO, claim classified QKD hardware, "
            "or guarantee sub-ms latency worldwide. ‘Quantum encryption’ = post-quantum crypto "
            "(e.g. ML-KEM / Dilithium-class rails already in ACP docs) plus optional partner QKD paths. "
            "Global mesh (satellites, BTS, repeaters) is a coverage architecture goal executed with "
            "licensed carriers and orbital partners. Subject to telecom, export, and spectrum law."
        ),
        "research_ref": RESEARCH_REF,
        "legal_href": "/legal/research-refs",
        "services": [
            {
                "id": "qsim-esim",
                "review_target_id": SERVICE_IDS["qsim-esim"],
                "label": "Digital eSIM / profile provisioning intent",
                "price_from_acp": "2500",
                "blurb": "Issue or rotate a digital SIM profile via partner MNO/MVNO — ACP escrow until activation proof.",
            },
            {
                "id": "qsim-pqc-channel",
                "review_target_id": SERVICE_IDS["qsim-pqc-channel"],
                "label": "Quantum-ready encrypted voice/data channel",
                "price_from_acp": "18000",
                "blurb": (
                    "Channel profile using post-quantum key exchange for signalling/media; "
                    "optional partner QKD hop where available. Informed by public quantum-info research cites."
                ),
            },
            {
                "id": "qsim-global-mesh",
                "review_target_id": SERVICE_IDS["qsim-global-mesh"],
                "label": "Global low-ping mesh subscription intent",
                "price_from_acp": "45000",
                "blurb": (
                    "Prefer lowest RTT path across partner satellites, terrestrial base stations, "
                    "and regional repeaters — routing policy brief settled in ACP."
                ),
            },
            {
                "id": "qsim-sat-backhaul",
                "review_target_id": SERVICE_IDS["qsim-sat-backhaul"],
                "label": "Satellite backhaul priority lane",
                "price_from_acp": "32000",
                "blurb": "Priority scheduling intent on partner LEO/MEO backhaul for ACP-authenticated sessions.",
            },
            {
                "id": "qsim-relay-fleet",
                "review_target_id": SERVICE_IDS["qsim-relay-fleet"],
                "label": "Worldwide relay / repeater coordination",
                "price_from_acp": "12000",
                "blurb": "Coordinate partner ground repeaters and edge relays for coverage continuity — not ANCAP-owned towers.",
            },
        ],
        "mesh_layers": [
            {"id": "satellite", "label": "Satellites (LEO/MEO partner capacity)", "role": "backhaul / coverage"},
            {"id": "bts", "label": "Base stations (licensed terrestrial)", "role": "access"},
            {"id": "repeater", "label": "Repeaters / edge relays", "role": "fill / failover"},
        ],
    }
