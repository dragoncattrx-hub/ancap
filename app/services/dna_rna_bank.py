"""Encrypted digital DNA/RNA bank service."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DnaRnaBankEntry
from app.schemas.dna_rna_bank import DnaRnaBankCreate
from app.services import dna_rna_crypto

ALLOWED_MOLECULES = frozenset({"dna", "rna"})
ALLOWED_TYPES = frozenset(
    {
        "sequence_summary",
        "vcf_panel",
        "blood_rna_panel",
        "transcriptome_summary",
        "methylation_panel",
        "microbiome_rna",
        "other",
    }
)


def cipher_info() -> dict[str, str]:
    return {
        "cipher_id": dna_rna_crypto.CIPHER_ID,
        "algorithm": "AES-256-GCM",
        "kdf": "HKDF-SHA384",
        "aad": dna_rna_crypto.KEY_INFO.decode("ascii"),
        "note": (
            "DNA/RNA bank payloads encrypted at rest (v1). "
            "Distinct from passport ChaCha20-Poly1305 and wallet/mail AES-GCM."
        ),
    }


def _payload_from_create(body: DnaRnaBankCreate) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "title": body.title.strip(),
        "molecule": body.molecule,
        "entry_type": body.entry_type,
    }
    if body.species:
        payload["species"] = body.species.strip()
    if body.sample_id:
        payload["sample_id"] = body.sample_id.strip()
    if body.collected_on:
        payload["collected_on"] = body.collected_on.strip()
    if body.lab_hint:
        payload["lab_hint"] = body.lab_hint.strip()
    if body.notes:
        payload["notes"] = body.notes.strip()
    if body.sequence_summary:
        payload["sequence_summary"] = body.sequence_summary.strip()
    if body.panel_json:
        payload["panel_json"] = body.panel_json
    if body.extra:
        payload["extra"] = body.extra
    return payload


async def list_entries(session: AsyncSession, *, user_id: uuid.UUID) -> list[DnaRnaBankEntry]:
    q = (
        select(DnaRnaBankEntry)
        .where(DnaRnaBankEntry.owner_user_id == str(user_id))
        .order_by(DnaRnaBankEntry.created_at.desc())
    )
    return list((await session.execute(q)).scalars().all())


async def add_entry(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    body: DnaRnaBankCreate,
) -> DnaRnaBankEntry:
    if body.molecule not in ALLOWED_MOLECULES:
        raise ValueError(f"Unsupported molecule: {body.molecule}")
    if body.entry_type not in ALLOWED_TYPES:
        raise ValueError(f"Unsupported entry_type: {body.entry_type}")

    payload = _payload_from_create(body)
    ciphertext_b64, nonce_b64, content_hash, cipher_id = dna_rna_crypto.encrypt_payload(payload)
    now = datetime.now(timezone.utc)
    rec = DnaRnaBankEntry(
        id=str(uuid.uuid4()),
        owner_user_id=str(user_id),
        molecule=body.molecule,
        entry_type=body.entry_type,
        title_hint=body.title.strip()[:200],
        species_hint=(body.species or "").strip()[:120] or None,
        cipher_id=cipher_id,
        nonce_b64=nonce_b64,
        ciphertext_b64=ciphertext_b64,
        content_hash=content_hash,
        metadata_json={"schema": "dna-rna-bank-v1"},
        created_at=now,
        updated_at=now,
    )
    session.add(rec)
    await session.flush()
    return rec


async def get_entry(
    session: AsyncSession,
    *,
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
    decrypt: bool = True,
) -> tuple[DnaRnaBankEntry, dict[str, Any] | None]:
    rec = await session.get(DnaRnaBankEntry, str(entry_id))
    if rec is None or str(rec.owner_user_id) != str(user_id):
        raise LookupError("Bank entry not found")
    payload = None
    if decrypt:
        payload = dna_rna_crypto.decrypt_payload(
            ciphertext_b64=rec.ciphertext_b64,
            nonce_b64=rec.nonce_b64,
        )
    return rec, payload


async def delete_entry(
    session: AsyncSession,
    *,
    entry_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    rec, _ = await get_entry(session, entry_id=entry_id, user_id=user_id, decrypt=False)
    await session.delete(rec)
    await session.flush()
