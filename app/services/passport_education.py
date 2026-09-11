"""Encrypted education documents on digital passports."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DigitalPassport, DigitalPassportEducationDoc, DigitalPassportStatusEnum
from app.schemas.digital_passport import PassportEducationDocCreate
from app.services import passport_crypto


ALLOWED_DOC_TYPES = frozenset(
    {
        "diploma",
        "certificate",
        "transcript",
        "degree",
        "course_completion",
        "license",
        "other",
    }
)


def cipher_info() -> dict[str, str]:
    return {
        "cipher_id": passport_crypto.CIPHER_ID,
        "algorithm": "ChaCha20-Poly1305",
        "kdf": "HKDF-SHA256",
        "aad": passport_crypto.KEY_INFO.decode("ascii"),
        "note": "Education document payloads are encrypted at rest (v2). Distinct from wallet/mail AES-GCM.",
    }


def _payload_from_create(body: PassportEducationDocCreate) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": body.title.strip(),
        "doc_type": body.doc_type,
    }
    if body.institution:
        payload["institution"] = body.institution.strip()
    if body.program:
        payload["program"] = body.program.strip()
    if body.credential_id:
        payload["credential_id"] = body.credential_id.strip()
    if body.issued_on:
        payload["issued_on"] = body.issued_on.strip()
    if body.expires_on:
        payload["expires_on"] = body.expires_on.strip()
    if body.country:
        payload["country"] = body.country.strip()
    if body.grade:
        payload["grade"] = body.grade.strip()
    if body.notes:
        payload["notes"] = body.notes.strip()
    if body.extra:
        payload["extra"] = body.extra
    return payload


async def get_owned_passport(
    session: AsyncSession,
    *,
    passport_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DigitalPassport:
    rec = await session.get(DigitalPassport, str(passport_id))
    if rec is None or str(rec.user_id) != str(user_id):
        raise LookupError("Passport not found")
    return rec


async def list_docs(
    session: AsyncSession,
    *,
    passport_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[DigitalPassportEducationDoc]:
    await get_owned_passport(session, passport_id=passport_id, user_id=user_id)
    q = (
        select(DigitalPassportEducationDoc)
        .where(
            DigitalPassportEducationDoc.passport_id == str(passport_id),
            DigitalPassportEducationDoc.owner_user_id == str(user_id),
        )
        .order_by(DigitalPassportEducationDoc.created_at.desc())
    )
    return list((await session.execute(q)).scalars().all())


async def add_doc(
    session: AsyncSession,
    *,
    passport_id: uuid.UUID,
    user_id: uuid.UUID,
    body: PassportEducationDocCreate,
) -> DigitalPassportEducationDoc:
    passport = await get_owned_passport(session, passport_id=passport_id, user_id=user_id)
    if passport.status != DigitalPassportStatusEnum.active:
        raise ValueError("Passport must be active to attach education documents")
    if body.doc_type not in ALLOWED_DOC_TYPES:
        raise ValueError(f"Unsupported doc_type: {body.doc_type}")

    payload = _payload_from_create(body)
    ciphertext_b64, nonce_b64, content_hash, cipher_id = passport_crypto.encrypt_payload(payload)
    now = datetime.now(timezone.utc)
    rec = DigitalPassportEducationDoc(
        id=str(uuid.uuid4()),
        passport_id=str(passport.id),
        owner_user_id=str(user_id),
        doc_type=body.doc_type,
        title_hint=body.title.strip()[:200],
        institution_hint=(body.institution or "").strip()[:200] or None,
        cipher_id=cipher_id,
        nonce_b64=nonce_b64,
        ciphertext_b64=ciphertext_b64,
        content_hash=content_hash,
        metadata_json={"schema": "passport-edu-v1"},
        created_at=now,
        updated_at=now,
    )
    session.add(rec)
    await session.flush()
    return rec


async def get_doc(
    session: AsyncSession,
    *,
    passport_id: uuid.UUID,
    doc_id: uuid.UUID,
    user_id: uuid.UUID,
    decrypt: bool = True,
) -> tuple[DigitalPassportEducationDoc, dict[str, Any] | None]:
    await get_owned_passport(session, passport_id=passport_id, user_id=user_id)
    rec = await session.get(DigitalPassportEducationDoc, str(doc_id))
    if (
        rec is None
        or str(rec.passport_id) != str(passport_id)
        or str(rec.owner_user_id) != str(user_id)
    ):
        raise LookupError("Education document not found")
    payload = None
    if decrypt:
        payload = passport_crypto.decrypt_payload(
            ciphertext_b64=rec.ciphertext_b64,
            nonce_b64=rec.nonce_b64,
        )
    return rec, payload


async def delete_doc(
    session: AsyncSession,
    *,
    passport_id: uuid.UUID,
    doc_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    rec, _ = await get_doc(
        session,
        passport_id=passport_id,
        doc_id=doc_id,
        user_id=user_id,
        decrypt=False,
    )
    await session.delete(rec)
    await session.flush()
