"""Starlink installation desk HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.starlink_install import (
    StarlinkCatalogPublic,
    StarlinkPartnerPublic,
    StarlinkQuotePublic,
    StarlinkQuoteRequest,
    StarlinkRegionPublic,
    StarlinkServicePublic,
)
from app.services import starlink_install_desk as svc

router = APIRouter(prefix="/starlink-install", tags=["Starlink installation"])


@router.get("/catalog", response_model=StarlinkCatalogPublic)
async def starlink_catalog():
    raw = svc.catalog()
    return StarlinkCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        services=[StarlinkServicePublic(**s) for s in raw["services"]],
        regions=[StarlinkRegionPublic(**r) for r in raw["regions"]],
        partners=[StarlinkPartnerPublic(**p) for p in raw.get("partners") or []],
        legal_href=raw["legal_href"],
        service_fee_eur=str(raw.get("service_fee_eur") or "3"),
        official_reseller=bool(raw.get("official_reseller", False)),
        jobcenter_guarantee=bool(raw.get("jobcenter_guarantee", False)),
    )


@router.post("/quote", response_model=StarlinkQuotePublic)
async def starlink_quote(body: StarlinkQuoteRequest):
    try:
        raw = svc.quote(
            service_id=body.service_id.strip(),
            region=(body.region or "").strip() or None,
            payment_currency=body.payment_currency,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return StarlinkQuotePublic(**raw)
