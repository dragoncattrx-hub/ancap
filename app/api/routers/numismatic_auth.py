"""Mobile numismatic authenticity + valuation API (iPhone wallet)."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.numismatic_auth import (
    NumismaticAuthPublic,
    NumismaticAuthRequest,
    NumismaticCatalogPublic,
    NumismaticValuePublic,
    NumismaticValueRequest,
)
from app.services import numismatic_auth as numi_svc

router = APIRouter(prefix="/mobile/numismatic", tags=["Mobile Numismatic"])


@router.get("/catalog", response_model=NumismaticCatalogPublic)
def numismatic_catalog():
    return numi_svc.catalog()


@router.post("/authenticate", response_model=NumismaticAuthPublic)
def numismatic_authenticate(body: NumismaticAuthRequest):
    return numi_svc.authenticate(body)


@router.post("/value", response_model=NumismaticValuePublic)
def numismatic_value(body: NumismaticValueRequest):
    return numi_svc.value(body)
