"""Passport education-document crypto — ChaCha20-Poly1305 (v2).

Distinct from wallet AES-GCM and mail-account AES-GCM.
Key: HKDF-SHA256(SECRET_KEY | optional PASSPORT_DOCS_MASTER_KEY, info=ancap-passport-edu-v2).
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

CIPHER_ID = "chacha20poly1305-hkdf-sha256-v2"
KEY_INFO = b"ancap-passport-edu-docs-v2"
NONCE_LEN = 12


def _master_material() -> bytes:
    settings = get_settings()
    dedicated = (getattr(settings, "passport_docs_master_key", None) or "").strip()
    if dedicated:
        return dedicated.encode("utf-8")
    secret = (settings.secret_key or "ancap-dev-passport-docs").encode("utf-8")
    return secret + b"|passport-edu-docs"


def derive_docs_key() -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"ancap-passport-edu-salt-v2",
        info=KEY_INFO,
    ).derive(_master_material())


def content_hash(plaintext: bytes) -> str:
    return "sha256:" + hashlib.sha256(plaintext).hexdigest()


def encrypt_payload(obj: dict[str, Any]) -> tuple[str, str, str, str]:
    """Return (ciphertext_b64, nonce_b64, content_hash, cipher_id)."""
    plaintext = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    nonce = os.urandom(NONCE_LEN)
    ct = ChaCha20Poly1305(derive_docs_key()).encrypt(nonce, plaintext, associated_data=KEY_INFO)
    return (
        base64.urlsafe_b64encode(ct).decode("ascii"),
        base64.urlsafe_b64encode(nonce).decode("ascii"),
        content_hash(plaintext),
        CIPHER_ID,
    )


def decrypt_payload(*, ciphertext_b64: str, nonce_b64: str) -> dict[str, Any]:
    ct = base64.urlsafe_b64decode(ciphertext_b64.encode("ascii"))
    nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
    pt = ChaCha20Poly1305(derive_docs_key()).decrypt(nonce, ct, associated_data=KEY_INFO)
    data = json.loads(pt.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("passport education payload must be an object")
    return data
