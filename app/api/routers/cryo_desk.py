"""Cryopreservation desk HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.cryo_desk import CryoCatalogPublic, CryoPartnerPublic, CryoServicePublic
from app.services import cryo_desk as svc

router = APIRouter(prefix="/cryo", tags=["Cryopreservation"])


@router.get("/catalog", response_model=CryoCatalogPublic)
async def cryo_catalog():
    raw = svc.catalog()
    return CryoCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        services=[CryoServicePublic(**s) for s in raw["services"]],
        partners=[CryoPartnerPublic(**p) for p in raw["partners"]],
        legal_href=raw["legal_href"],
    )
