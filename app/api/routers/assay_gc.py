"""Prototype gas-chromatography / XRF assay desk API."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.assay_gc import AssayGcAnalyzePublic, AssayGcAnalyzeRequest, AssayGcCatalogPublic
from app.services import assay_gc as assay_svc

router = APIRouter(prefix="/assay/gc", tags=["Assay GC Prototype"])


@router.get("/catalog", response_model=AssayGcCatalogPublic)
def assay_gc_catalog():
    return assay_svc.catalog()


@router.post("/analyze", response_model=AssayGcAnalyzePublic)
def assay_gc_analyze(body: AssayGcAnalyzeRequest):
    return assay_svc.analyze(body)
