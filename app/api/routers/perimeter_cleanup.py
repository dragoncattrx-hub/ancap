"""Perimeter cleanup desk HTTP surface (Abrams Suite-B encrypted jobs)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, require_auth
from app.config import get_settings
from app.schemas.perimeter_cleanup import (
    PerimeterCatalogPublic,
    PerimeterCipherInfo,
    PerimeterJobCreate,
    PerimeterJobListResponse,
    PerimeterJobPublic,
    PerimeterJobSummary,
    PerimeterServicePublic,
)
from app.services import perimeter_cleanup as desk_svc
from app.services import perimeter_crypto

router = APIRouter(prefix="/perimeter-cleanup", tags=["Perimeter Cleanup"])


def _require_feature() -> None:
    if not get_settings().ff_perimeter_cleanup:
        raise HTTPException(status_code=503, detail="Perimeter cleanup desk is disabled")


def _summary(rec) -> PerimeterJobSummary:
    return PerimeterJobSummary(
        id=str(rec.id),
        service_id=rec.service_id,
        contamination=rec.contamination,
        site_label_hint=rec.site_label_hint,
        status=rec.status,
        cipher_id=rec.cipher_id,
        content_hash=rec.content_hash,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.get("/cipher", response_model=PerimeterCipherInfo)
async def perimeter_cipher_info():
    _require_feature()
    return PerimeterCipherInfo(**desk_svc.cipher_info())


@router.get("/catalog", response_model=PerimeterCatalogPublic)
async def perimeter_catalog():
    _require_feature()
    raw = desk_svc.catalog()
    return PerimeterCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        cipher=raw["cipher"],
        compliance_note=raw["compliance_note"],
        services=[PerimeterServicePublic(**s) for s in raw["services"]],
    )


@router.get("/jobs", response_model=PerimeterJobListResponse)
async def list_perimeter_jobs(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    uid = uuid.UUID(user_id)
    rows = await desk_svc.list_jobs(session, user_id=uid)
    return PerimeterJobListResponse(
        items=[_summary(r) for r in rows],
        cipher_id=desk_svc.cipher_info()["cipher_id"],
    )


@router.post("/jobs", response_model=PerimeterJobPublic, status_code=201)
async def create_perimeter_job(
    body: PerimeterJobCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    uid = uuid.UUID(user_id)
    try:
        rec = await desk_svc.add_job(session, user_id=uid, body=body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    payload = perimeter_crypto.decrypt_payload(
        ciphertext_b64=rec.ciphertext_b64,
        nonce_b64=rec.nonce_b64,
    )
    return PerimeterJobPublic(**_summary(rec).model_dump(), payload=payload)


@router.get("/jobs/{job_id}", response_model=PerimeterJobPublic)
async def get_perimeter_job(
    job_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    try:
        jid = uuid.UUID(job_id)
        uid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    try:
        rec, payload = await desk_svc.get_job(session, job_id=jid, user_id=uid, decrypt=True)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Failed to decrypt job") from exc
    return PerimeterJobPublic(**_summary(rec).model_dump(), payload=payload or {})
