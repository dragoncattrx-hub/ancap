"""Saliva Rx desk HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.saliva_rx import (
    SalivaRxCatalogPublic,
    SalivaRxPartnerPublic,
    SalivaRxPipelineStepPublic,
    SalivaRxServicePublic,
)
from app.services import saliva_rx as svc

router = APIRouter(prefix="/saliva-rx", tags=["Saliva Rx"])


@router.get("/catalog", response_model=SalivaRxCatalogPublic)
async def saliva_rx_catalog():
    raw = svc.catalog()
    return SalivaRxCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        pipeline=[SalivaRxPipelineStepPublic(**p) for p in raw["pipeline"]],
        services=[SalivaRxServicePublic(**s) for s in raw["services"]],
        partners=[SalivaRxPartnerPublic(**p) for p in raw["partners"]],
        legal_href=raw["legal_href"],
    )
