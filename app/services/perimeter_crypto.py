"""Perimeter cleanup vault crypto — Abrams Suite-B style AES-256-GCM + HKDF-SHA384 (v1).

Public algorithms aligned with NSA Suite B / CNSA at-rest practice used alongside
Abrams-class Type-1 radio stacks (AES-256). This is **not** classified Type 1
keying material — only open Suite-B algorithms in a dedicated key namespace.

Distinct from:
- passport education docs (ChaCha20-Poly1305 + HKDF-SHA256 v2)
- DNA/RNA bank (AES-256-GCM + HKDF-SHA384, different salt/info)
- wallet / mail AES-GCM
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.config import get_settings

CIPHER_ID = "aes256-gcm-hkdf-sha384-abrams-suiteb-v1"
KEY_INFO = b"ancap-perimeter-abrams-suiteb-v1"
NONCE_LEN = 12


def _master_material() -> bytes:
    settings = get_settings()
    dedicated = (getattr(settings, "perimeter_cleanup_master_key", None) or "").strip()
    if dedicated:
        return dedicated.encode("utf-8")
    secret = (settings.secret_key or "ancap-dev-perimeter-abrams").encode("utf-8")
    return secret + b"|perimeter-abrams-suiteb-v1"


def derive_vault_key() -> bytes:
    return HKDF(
        algorithm=hashes.SHA384(),
        length=32,
        salt=b"ancap-perimeter-abrams-suiteb-salt-v1",
        info=KEY_INFO,
    ).derive(_master_material())


def content_hash(plaintext: bytes) -> str:
    return "sha384:" + hashlib.sha384(plaintext).hexdigest()


def encrypt_payload(obj: dict[str, Any]) -> tuple[str, str, str, str]:
    plaintext = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    nonce = os.urandom(NONCE_LEN)
    ct = AESGCM(derive_vault_key()).encrypt(nonce, plaintext, associated_data=KEY_INFO)
    return (
        base64.urlsafe_b64encode(ct).decode("ascii"),
        base64.urlsafe_b64encode(nonce).decode("ascii"),
        content_hash(plaintext),
        CIPHER_ID,
    )


def decrypt_payload(*, ciphertext_b64: str, nonce_b64: str) -> dict[str, Any]:
    ct = base64.urlsafe_b64decode(ciphertext_b64.encode("ascii"))
    nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
    pt = AESGCM(derive_vault_key()).decrypt(nonce, ct, associated_data=KEY_INFO)
    data = json.loads(pt.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Perimeter payload must be an object")
    return data
