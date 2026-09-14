"""Worldwide legal counsel desk HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.counsel import (
    CounselCatalogPublic,
    CounselRegionPublic,
    CounselServicePublic,
)
from app.services import counsel_desk as svc

router = APIRouter(prefix="/counsel", tags=["Legal counsel"])


@router.get("/catalog", response_model=CounselCatalogPublic)
async def counsel_catalog():
    raw = svc.catalog()
    return CounselCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        services=[CounselServicePublic(**s) for s in raw["services"]],
        regions=[CounselRegionPublic(**r) for r in raw["regions"]],
        legal_href=raw["legal_href"],
        practices_law=bool(raw.get("practices_law", False)),
        attorney_client=bool(raw.get("attorney_client", False)),
    )
