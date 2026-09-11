"""Quantum-link digital SIM desk — PQC channels + global low-ping mesh intents.

ACP-settled product intents only. ANCAP does not claim a proprietary QKD satellite
constellation today. “Quantum encryption” here means post-quantum / QKD-partner
pathways documented for licensed carriers. Not a regulated telecom license by itself.

Principles (literacy): docs/QUANTUM_PRIVATE_CAPACITY_PRINCIPLES.md — mapped from the
public iXBT Live write-up of Zhu–Wang private-capacity superadditivity (no affiliation).
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
        "Principles below are ANCAP engineering literacy derived from that write-up — not a product warranty."
    ),
}

# Distilled for API / UI — full prose in docs/QUANTUM_PRIVATE_CAPACITY_PRINCIPLES.md
PRINCIPLES: tuple[dict[str, str], ...] = (
    {
        "id": "P1",
        "title": "Private capacity ≠ ordinary capacity",
        "body": (
            "Delivery under noise is not secrecy. Private capacity requires the legitimate "
            "receiver to beat the environment/eavesdropper (Holevo-bounded leakage)."
        ),
    },
    {
        "id": "P2",
        "title": "Classically, 0 + 0 = 0",
        "body": (
            "Under classical wiretap additivity, stacking eavesdropper-dominated paths still "
            "yields zero private capacity. More hops alone do not create secrecy."
        ),
    },
    {
        "id": "P3",
        "title": "Quantum superadditivity: 0 + 0 > 0",
        "body": (
            "Two channels with strictly zero private capacity can jointly yield positive private "
            "capacity. Secrecy can be an emergent joint property (Zhu–Wang result as publicly reported)."
        ),
    },
    {
        "id": "P4",
        "title": "Do not discard a hop for zero private capacity alone",
        "body": (
            "A link is not forever cryptographically useless solely because its standalone private "
            "capacity is zero — it may still participate in a joint secure architecture."
        ),
    },
    {
        "id": "P5",
        "title": "Joint non-separable decode required",
        "body": (
            "Independent per-path measurement (even with classical coordination) can destroy the "
            "effect. Secrecy appears at an indivisible joint measurement/decode over both outputs."
        ),
    },
    {
        "id": "P6",
        "title": "Scale separation: linear vs quadratic",
        "body": (
            "Keep signal intensity small so receiver information can grow linearly while "
            "environment leakage is bounded quadratically — positive secrecy only inside a narrow window."
        ),
    },
    {
        "id": "P7",
        "title": "AI may propose; machines must verify",
        "body": (
            "LLM-assisted search can find candidates; formal verification (e.g. Lean 4) is required "
            "before treating a proof as settled — same culture as ACP Lean / PQC CI."
        ),
    },
    {
        "id": "P8",
        "title": "Local eavesdropper dominance ≠ global dominance",
        "body": (
            "Environment beating the receiver on one isolated hop does not guarantee the same when "
            "hops run in parallel under a joint protocol — basis for sat + BTS + repeater mesh literacy."
        ),
    },
)


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
            "licensed carriers and orbital partners. Subject to telecom, export, and spectrum law. "
            "Principles P1–P8 are research literacy, not a lab certification."
        ),
        "research_ref": RESEARCH_REF,
        "principles": list(PRINCIPLES),
        "principles_doc": "docs/QUANTUM_PRIVATE_CAPACITY_PRINCIPLES.md",
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
                    "optional partner QKD hop where available. Grounded in principles P1/P5/P7."
                ),
            },
            {
                "id": "qsim-global-mesh",
                "review_target_id": SERVICE_IDS["qsim-global-mesh"],
                "label": "Global low-ping mesh subscription intent",
                "price_from_acp": "45000",
                "blurb": (
                    "Prefer lowest RTT across partner satellites, BTS, and repeaters — joint path "
                    "diversity per P3/P4/P8, not classical 0+0=0 hop stacking (P2)."
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
