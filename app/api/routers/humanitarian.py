"""Humanitarian aid desk HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.humanitarian import (
    HumanitarianCatalogPublic,
    HumanitarianPartnerPublic,
    HumanitarianServicePublic,
)
from app.services import humanitarian_desk as svc

router = APIRouter(prefix="/humanitarian", tags=["Humanitarian aid"])


@router.get("/catalog", response_model=HumanitarianCatalogPublic)
async def humanitarian_catalog():
    raw = svc.catalog()
    return HumanitarianCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        services=[HumanitarianServicePublic(**s) for s in raw["services"]],
        partners=[HumanitarianPartnerPublic(**p) for p in raw["partners"]],
        legal_href=raw["legal_href"],
        emblem_licensed=bool(raw.get("emblem_licensed", False)),
        official_partnership=bool(raw.get("official_partnership", False)),
    )
