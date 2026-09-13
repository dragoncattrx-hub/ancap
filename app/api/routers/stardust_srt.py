"""StardustSRT weather-control / earth-monitoring HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.stardust_srt import (
    StardustCatalogPublic,
    StardustControlPublic,
    StardustModulePublic,
    StardustServicePublic,
)
from app.services import stardust_srt as svc

router = APIRouter(prefix="/stardust", tags=["StardustSRT"])


@router.get("/catalog", response_model=StardustCatalogPublic)
async def stardust_catalog():
    raw = svc.catalog()
    return StardustCatalogPublic(
        title=raw["title"],
        brand=raw.get("brand") or "StardustSRT",
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        legal_href=raw["legal_href"],
        website_ref=raw.get("website_ref") or "https://stardustsrt.com",
        services=[StardustServicePublic(**s) for s in raw["services"]],
        monitoring_modules=[StardustModulePublic(**m) for m in raw.get("monitoring_modules") or []],
        weather_controls=[StardustControlPublic(**c) for c in raw.get("weather_controls") or []],
        outcomes=[StardustModulePublic(**o) for o in raw.get("outcomes") or []],
    )
