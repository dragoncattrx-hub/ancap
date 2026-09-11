"""Digital DNA/RNA bank HTTP surface."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import DbSession, require_auth
from app.config import get_settings
from app.schemas.dna_rna_bank import (
    DnaRnaBankCipherInfo,
    DnaRnaBankCreate,
    DnaRnaBankListResponse,
    DnaRnaBankPublic,
    DnaRnaBankSummary,
)
from app.services import dna_rna_bank as bank_svc
from app.services import dna_rna_crypto

router = APIRouter(prefix="/dna-rna-bank", tags=["DNA RNA Bank"])


def _require_feature() -> None:
    if not get_settings().ff_dna_rna_bank:
        raise HTTPException(status_code=503, detail="DNA/RNA bank is disabled")


def _summary(rec) -> DnaRnaBankSummary:
    return DnaRnaBankSummary(
        id=str(rec.id),
        molecule=rec.molecule,
        entry_type=rec.entry_type,
        title_hint=rec.title_hint,
        species_hint=rec.species_hint,
        cipher_id=rec.cipher_id,
        content_hash=rec.content_hash,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.get("/cipher", response_model=DnaRnaBankCipherInfo)
async def bank_cipher_info():
    _require_feature()
    return DnaRnaBankCipherInfo(**bank_svc.cipher_info())


@router.get("/entries", response_model=DnaRnaBankListResponse)
async def list_bank_entries(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    uid = uuid.UUID(user_id)
    rows = await bank_svc.list_entries(session, user_id=uid)
    return DnaRnaBankListResponse(
        items=[_summary(r) for r in rows],
        cipher_id=bank_svc.cipher_info()["cipher_id"],
    )


@router.post("/entries", response_model=DnaRnaBankPublic, status_code=201)
async def create_bank_entry(
    body: DnaRnaBankCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    uid = uuid.UUID(user_id)
    try:
        rec = await bank_svc.add_entry(session, user_id=uid, body=body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    payload = dna_rna_crypto.decrypt_payload(
        ciphertext_b64=rec.ciphertext_b64,
        nonce_b64=rec.nonce_b64,
    )
    return DnaRnaBankPublic(**_summary(rec).model_dump(), payload=payload)


@router.get("/entries/{entry_id}", response_model=DnaRnaBankPublic)
async def get_bank_entry(
    entry_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    try:
        eid = uuid.UUID(entry_id)
        uid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    try:
        rec, payload = await bank_svc.get_entry(session, entry_id=eid, user_id=uid, decrypt=True)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Failed to decrypt entry") from exc
    return DnaRnaBankPublic(**_summary(rec).model_dump(), payload=payload or {})


@router.delete("/entries/{entry_id}", status_code=204)
async def delete_bank_entry(
    entry_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    _require_feature()
    try:
        eid = uuid.UUID(entry_id)
        uid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    try:
        await bank_svc.delete_entry(session, entry_id=eid, user_id=uid)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return None
