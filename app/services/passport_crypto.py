"""Passport education-document crypto — X-Wing seal (v3) with legacy dual-read.

New writes use X-Wing draft-10 envelope. Decrypt accepts:
- cipher_id xwing-… → PQC envelope (ciphertext_b64 holds envelope; nonce unused)
- legacy chacha20poly1305-hkdf-sha256-v2 → ChaCha20-Poly1305
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.config import get_settings
from app.services import pqc_envelope

LEGACY_CIPHER_ID = "chacha20poly1305-hkdf-sha256-v2"
CIPHER_ID = pqc_envelope.CIPHER_ID
KEY_INFO = b"ancap-passport-edu-docs-v2"
NONCE_LEN = 12
PQC_CONTEXT = b"ACP/passport-edu-docs/v1"
PQC_NONCE_MARKER = "xwing-v1"


def _master_material() -> bytes:
    from app.services.crypto_secrets import resolve_secret_material

    settings = get_settings()
    dedicated = (getattr(settings, "passport_docs_master_key", None) or "").strip()
    return resolve_secret_material(
        dedicated=dedicated,
        secret_key_suffix=b"|passport-edu-docs",
        development_fallback=b"ancap-dev-passport-docs|passport-edu-docs",
        purpose="Passport docs crypto",
    )


def derive_docs_key() -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"ancap-passport-edu-salt-v2",
        info=KEY_INFO,
    ).derive(_master_material())


def content_hash(plaintext: bytes) -> str:
    return "sha256:" + hashlib.sha256(plaintext).hexdigest()


def _pqc_kwargs() -> dict:
    settings = get_settings()
    dedicated = (getattr(settings, "passport_docs_master_key", None) or "").strip() or None
    return {
        "dedicated": dedicated,
        "secret_key_suffix": b"|passport-edu-docs|xwing-v1",
        "development_fallback": b"ancap-dev-passport-docs|passport-edu-docs|xwing-v1",
        "purpose": "Passport docs PQC",
    }


def encrypt_payload(obj: dict[str, Any]) -> tuple[str, str, str, str]:
    """Return (ciphertext_b64, nonce_b64, content_hash, cipher_id)."""
    env_b64, chash, cipher_id = pqc_envelope.seal_json(obj, context=PQC_CONTEXT, **_pqc_kwargs())
    return env_b64, PQC_NONCE_MARKER, chash, cipher_id


def _decrypt_legacy(*, ciphertext_b64: str, nonce_b64: str) -> dict[str, Any]:
    ct = base64.urlsafe_b64decode(ciphertext_b64.encode("ascii"))
    nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
    pt = ChaCha20Poly1305(derive_docs_key()).decrypt(nonce, ct, associated_data=KEY_INFO)
    data = json.loads(pt.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("passport education payload must be an object")
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


# Keep unused import of os for legacy parity / tests that monkeypatch
_ = os
