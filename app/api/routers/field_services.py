"""Field services hub HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas.field_services import (
    FieldCatalogPublic,
    FieldGroupPublic,
    FieldPartnerPublic,
    FieldQuotePublic,
    FieldQuoteRequest,
    FieldRegionPublic,
    FieldServicePublic,
)
from app.services import field_services_desk as svc

router = APIRouter(prefix="/field-services", tags=["Field services"])


@router.get("/catalog", response_model=FieldCatalogPublic)
async def field_services_catalog(group: str | None = Query(default=None)):
    gid = (group or "").strip() or None
    raw = svc.catalog(group_id=gid)
    return FieldCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        groups=[FieldGroupPublic(**g) for g in raw.get("groups") or []],
        services=[FieldServicePublic(**s) for s in raw["services"]],
        regions=[FieldRegionPublic(**r) for r in raw["regions"]],
        partners=[FieldPartnerPublic(**p) for p in raw.get("partners") or []],
        legal_href=raw["legal_href"],
        service_fee_eur=str(raw.get("service_fee_eur") or "3"),
        official_reseller=bool(raw.get("official_reseller", False)),
        jobcenter_guarantee=bool(raw.get("jobcenter_guarantee", False)),
    )


@router.post("/quote", response_model=FieldQuotePublic)
async def field_services_quote(body: FieldQuoteRequest):
    try:
        raw = svc.quote(
            service_id=body.service_id.strip(),
            region=(body.region or "").strip() or None,
            payment_currency=body.payment_currency,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FieldQuotePublic(**raw)
