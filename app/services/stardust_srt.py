"""StardustSRT weather-control / earth-monitoring desk — ACP partner literacy.

ANCAP settles ACP intents and licensed-partner handoffs inspired by public
StardustSRT earth-software framing (disaster monitoring + weather-control UI literacy).
ANCAP does not operate a geoengineering fleet, does not claim unilateral worldwide
weather modification, and is not affiliated with StardustSRT unless separately contracted.
"""
from __future__ import annotations

from typing import Any

SERVICE_IDS: dict[str, str] = {
    "stardust-extreme-weather": "e6000006-0000-4000-8000-000000000001",
    "stardust-disaster-alert": "e6000006-0000-4000-8000-000000000002",
    "stardust-weather-control-global": "e6000006-0000-4000-8000-000000000003",
    "stardust-weather-control-sub": "e6000006-0000-4000-8000-000000000004",
}


def catalog() -> dict[str, Any]:
    return {
        "title": "Earth Software for Weather Control",
        "brand": "StardustSRT",
        "tagline": (
            "Predict. Analyze. Influence. Worldwide weather-control and disaster-prevention "
            "partner literacy — settled in ACP."
        ),
        "compliance_note": (
            "ANCAP sells ACP-settled partner briefs and coordination intents for earth monitoring "
            "and weather-control architecture literacy. Toggle panels and satellite artwork are "
            "product literacy — not a live geoengineering console, not a guaranteed storm "
            "dissipation or rainfall outcome, and not an official meteorological warning service. "
            "ANCAP does not unilaterally modify weather worldwide and is not affiliated with "
            "StardustSRT (https://stardustsrt.com) unless a separate partner contract is executed. "
            "Physical sensing, cloud-seeding, or licensed weather ops remain with licensed partners "
            "under applicable environmental, aviation, and telecom law. AccuWeather widget weather "
            "on ANCAP remains indicative UX only (/legal/market-data)."
        ),
        "legal_href": "/legal/stardust",
        "website_ref": "https://stardustsrt.com",
        "monitoring_modules": [
            {
                "id": "seismic",
                "label": "Seismic Activity",
                "role": "detection",
                "blurb": "Real-time earthquake detection literacy from space and ground sensors.",
            },
            {
                "id": "tsunami",
                "label": "Tsunami Warning",
                "role": "early_alert",
                "blurb": "Coastal wave-propagation forecasting literacy for partner alert desks.",
            },
            {
                "id": "volcano",
                "label": "Volcano Monitoring",
                "role": "thermal",
                "blurb": "Thermal / infrared activity literacy — not an eruption-date guarantee.",
            },
            {
                "id": "extreme-weather",
                "label": "Extreme Weather",
                "role": "storm_track",
                "blurb": "Hurricane, storm, and heavy-rainfall tracking literacy worldwide.",
            },
            {
                "id": "landslide-flood",
                "label": "Landslide & Flood Risk",
                "role": "terrain",
                "blurb": "Terrain-change and flood-hazard monitoring literacy for partner ops.",
            },
        ],
        "weather_controls": [
            {
                "id": "rainfall",
                "label": "Rainfall Enhancement",
                "icon": "cloud_rain",
                "blurb": "Partner cloud-seeding / rainfall architecture literacy — not a rain guarantee.",
            },
            {
                "id": "storm",
                "label": "Storm Dissipation",
                "icon": "storm",
                "blurb": "Storm-intensity reduction pathway literacy — not a hurricane kill-switch.",
            },
            {
                "id": "temperature",
                "label": "Temperature Regulation",
                "icon": "thermometer",
                "blurb": "Regional temperature-stability literacy — not climate engineering sold by ANCAP.",
            },
            {
                "id": "snow",
                "label": "Snow Management",
                "icon": "snowflake",
                "blurb": "Snowfall management literacy for partner winter ops — not a ski-season warranty.",
            },
        ],
        "outcomes": [
            {"id": "better-rain", "label": "Better Rainfall", "role": "outcome", "blurb": ""},
            {"id": "weaker-storms", "label": "Weaker Storms", "role": "outcome", "blurb": ""},
            {"id": "stable-temp", "label": "Stable Temperatures", "role": "outcome", "blurb": ""},
            {"id": "healthier", "label": "A Healthier Planet", "role": "outcome", "blurb": ""},
        ],
        "services": [
            {
                "id": "stardust-extreme-weather",
                "review_target_id": SERVICE_IDS["stardust-extreme-weather"],
                "label": "Extreme weather worldwide monitor brief",
                "price_from_acp": "18000",
                "blurb": (
                    "ACP-settled partner brief for hurricane / storm / heavy-rainfall monitoring "
                    "literacy across global regions. Not an official weather warning."
                ),
                "workflow_slug": "stardust-extreme-weather-monitor",
                "billing": "one_shot",
            },
            {
                "id": "stardust-disaster-alert",
                "review_target_id": SERVICE_IDS["stardust-disaster-alert"],
                "label": "Disaster early-warning coordination brief",
                "price_from_acp": "28000",
                "blurb": (
                    "Seismic, tsunami, volcano, landslide, and flood early-alert coordination "
                    "literacy for governments / businesses / communities — partner handoff only."
                ),
                "workflow_slug": "stardust-disaster-early-warning",
                "billing": "one_shot",
            },
            {
                "id": "stardust-weather-control-global",
                "review_target_id": SERVICE_IDS["stardust-weather-control-global"],
                "label": "Global weather-control partner brief",
                "price_from_acp": "58000",
                "blurb": (
                    "Worldwide weather-control architecture literacy: rainfall enhancement, storm "
                    "dissipation, temperature regulation, and snow management themes for licensed "
                    "partners. Not a live geoengineering console sold by ANCAP."
                ),
                "workflow_slug": "stardust-weather-control-global",
                "billing": "one_shot",
            },
            {
                "id": "stardust-weather-control-sub",
                "review_target_id": SERVICE_IDS["stardust-weather-control-sub"],
                "label": "Worldwide weather-control subscription",
                "price_from_acp": "45000",
                "blurb": (
                    "Monthly ACP retainer for ongoing worldwide weather-control / earth-monitoring "
                    "partner coordination literacy. Cancel anytime under /legal/refunds."
                ),
                "workflow_slug": "stardust-weather-control-subscription",
                "billing": "subscription",
            },
        ],
    }
