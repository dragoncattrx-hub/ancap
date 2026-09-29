"""DNA/RNA digital bank crypto — X-Wing seal with AES-GCM legacy dual-read."""
from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.config import get_settings
from app.services import pqc_envelope

LEGACY_CIPHER_ID = "aes256-gcm-hkdf-sha384-dna-rna-v1"
CIPHER_ID = pqc_envelope.CIPHER_ID
KEY_INFO = b"ancap-dna-rna-bank-v1"
NONCE_LEN = 12
PQC_CONTEXT = b"ACP/dna-rna-bank/v1"
PQC_NONCE_MARKER = "xwing-v1"


def _master_material() -> bytes:
    from app.services.crypto_secrets import resolve_secret_material

    settings = get_settings()
    dedicated = (getattr(settings, "dna_rna_bank_master_key", None) or "").strip()
    return resolve_secret_material(
        dedicated=dedicated,
        secret_key_suffix=b"|dna-rna-bank-v1",
        development_fallback=b"ancap-dev-dna-rna-bank|dna-rna-bank-v1",
        purpose="DNA/RNA bank crypto",
    )


def derive_bank_key() -> bytes:
    return HKDF(
        algorithm=hashes.SHA384(),
        length=32,
        salt=b"ancap-dna-rna-bank-salt-v1",
        info=KEY_INFO,
    ).derive(_master_material())


def content_hash(plaintext: bytes) -> str:
    return "sha384:" + hashlib.sha384(plaintext).hexdigest()


def _pqc_kwargs() -> dict:
    settings = get_settings()
    dedicated = (getattr(settings, "dna_rna_bank_master_key", None) or "").strip() or None
    return {
        "dedicated": dedicated,
        "secret_key_suffix": b"|dna-rna-bank-v1|xwing-v1",
        "development_fallback": b"ancap-dev-dna-rna-bank|dna-rna-bank-v1|xwing-v1",
        "purpose": "DNA/RNA bank PQC",
    }


def encrypt_payload(obj: dict[str, Any]) -> tuple[str, str, str, str]:
    env_b64, chash, cipher_id = pqc_envelope.seal_json(obj, context=PQC_CONTEXT, **_pqc_kwargs())
    # Prefer sha384-prefixed hash for bank continuity in indexes.
    plaintext = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return env_b64, PQC_NONCE_MARKER, content_hash(plaintext), cipher_id


def _decrypt_legacy(*, ciphertext_b64: str, nonce_b64: str) -> dict[str, Any]:
    ct = base64.urlsafe_b64decode(ciphertext_b64.encode("ascii"))
    nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
    pt = AESGCM(derive_bank_key()).decrypt(nonce, ct, associated_data=KEY_INFO)
    data = json.loads(pt.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("DNA/RNA bank payload must be an object")
    return data


def decrypt_payload(
    *,
    ciphertext_b64: str,
    nonce_b64: str,
    cipher_id: str | None = None,
) -> dict[str, Any]:
    cid = (cipher_id or "").strip()
    if cid == CIPHER_ID or nonce_b64 == PQC_NONCE_MARKER or pqc_envelope.looks_like_envelope(ciphertext_b64):
        return pqc_envelope.open_json(envelope_b64=ciphertext_b64, context=PQC_CONTEXT, **_pqc_kwargs())
    return _decrypt_legacy(ciphertext_b64=ciphertext_b64, nonce_b64=nonce_b64)
