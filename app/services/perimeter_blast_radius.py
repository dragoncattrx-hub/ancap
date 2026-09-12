"""Blast-radius proof: DNA/passport keys must not open a perimeter brief.

Publishes a failed-decryption test, not an assertion. Derived keys never leave
the process — only SHA-384 fingerprints of this host's namespace material.
"""
from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305

from app.services import dna_rna_crypto, passport_crypto, perimeter_crypto

CANARY: dict[str, Any] = {
    "blast_radius_canary": True,
    "contamination": "industrial",
    "site_label": "namespace-separation-fixture",
}

PROCEDURE: tuple[str, ...] = (
    "Snapshot SHA-384 fingerprints of DNA, passport, and perimeter derived keys on this host. Raw keys never leave the process.",
    "Encrypt a published canary brief (or a captured owner job) under the perimeter vault (AES-256-GCM, perimeter AAD).",
    "Attempt AES-256-GCM open with the DNA key using DNA AAD, then again using perimeter AAD.",
    "Attempt ChaCha20-Poly1305 open with the passport key (passport AAD) and AES-256-GCM open with the passport key (perimeter AAD).",
    "Control: open with the perimeter key and perimeter AAD — must succeed.",
    "Pass only if every foreign attempt fails (InvalidTag) and the control succeeds.",
)


def _fp(material: bytes) -> str:
    return "sha384:" + hashlib.sha384(material).hexdigest()


def _namespace_snapshot() -> dict[str, Any]:
    dna_key = dna_rna_crypto.derive_bank_key()
    passport_key = passport_crypto.derive_docs_key()
    peri_key = perimeter_crypto.derive_vault_key()
    return {
        "dna": {
            "cipher_id": dna_rna_crypto.CIPHER_ID,
            "kdf": "HKDF-SHA384",
            "aad": dna_rna_crypto.KEY_INFO.decode("ascii"),
            "salt": "ancap-dna-rna-bank-salt-v1",
            "key_fingerprint": _fp(dna_key),
        },
        "passport": {
            "cipher_id": passport_crypto.CIPHER_ID,
            "kdf": "HKDF-SHA256",
            "aad": passport_crypto.KEY_INFO.decode("ascii"),
            "salt": "ancap-passport-edu-salt-v2",
            "key_fingerprint": _fp(passport_key),
        },
        "perimeter": {
            "cipher_id": perimeter_crypto.CIPHER_ID,
            "kdf": "HKDF-SHA384",
            "aad": perimeter_crypto.KEY_INFO.decode("ascii"),
            "salt": "ancap-perimeter-abrams-suiteb-salt-v1",
            "key_fingerprint": _fp(peri_key),
        },
        "fingerprints_distinct": len({_fp(dna_key), _fp(passport_key), _fp(peri_key)}) == 3,
        "keys": {"dna": dna_key, "passport": passport_key, "perimeter": peri_key},
    }


def _attempt(*, role: str, aead: str, aad_label: str, opened: bool, error: str | None) -> dict[str, Any]:
    return {
        "role": role,
        "aead": aead,
        "aad": aad_label,
        "opened": opened,
        "error": error,
    }


def _try_aes(*, key: bytes, nonce: bytes, ct: bytes, aad: bytes, role: str, aad_label: str) -> dict[str, Any]:
    try:
        AESGCM(key).decrypt(nonce, ct, associated_data=aad)
        return _attempt(role=role, aead="AES-256-GCM", aad_label=aad_label, opened=True, error=None)
    except InvalidTag:
        return _attempt(role=role, aead="AES-256-GCM", aad_label=aad_label, opened=False, error="InvalidTag")
    except Exception as exc:  # noqa: BLE001 — failed-open is the measured result
        return _attempt(role=role, aead="AES-256-GCM", aad_label=aad_label, opened=False, error=type(exc).__name__)


def _try_chacha(*, key: bytes, nonce: bytes, ct: bytes, aad: bytes, role: str, aad_label: str) -> dict[str, Any]:
    try:
        ChaCha20Poly1305(key).decrypt(nonce, ct, associated_data=aad)
        return _attempt(role=role, aead="ChaCha20-Poly1305", aad_label=aad_label, opened=True, error=None)
    except InvalidTag:
        return _attempt(role=role, aead="ChaCha20-Poly1305", aad_label=aad_label, opened=False, error="InvalidTag")
    except Exception as exc:  # noqa: BLE001 — failed-open is the measured result
        return _attempt(role=role, aead="ChaCha20-Poly1305", aad_label=aad_label, opened=False, error=type(exc).__name__)


def _run_attempts(*, ciphertext_b64: str, nonce_b64: str, keys: dict[str, bytes]) -> list[dict[str, Any]]:
    ct = base64.urlsafe_b64decode(ciphertext_b64.encode("ascii"))
    nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
    dna_aad = dna_rna_crypto.KEY_INFO
    peri_aad = perimeter_crypto.KEY_INFO
    pass_aad = passport_crypto.KEY_INFO
    return [
        _try_aes(key=keys["dna"], nonce=nonce, ct=ct, aad=dna_aad, role="dna_key_dna_aad", aad_label=dna_aad.decode("ascii")),
        _try_aes(key=keys["dna"], nonce=nonce, ct=ct, aad=peri_aad, role="dna_key_perimeter_aad", aad_label=peri_aad.decode("ascii")),
        _try_chacha(
            key=keys["passport"],
            nonce=nonce,
            ct=ct,
            aad=pass_aad,
            role="passport_key_passport_aad",
            aad_label=pass_aad.decode("ascii"),
        ),
        _try_aes(
            key=keys["passport"],
            nonce=nonce,
            ct=ct,
            aad=peri_aad,
            role="passport_key_perimeter_aad",
            aad_label=peri_aad.decode("ascii"),
        ),
        _try_aes(
            key=keys["perimeter"],
            nonce=nonce,
            ct=ct,
            aad=peri_aad,
            role="control_perimeter",
            aad_label=peri_aad.decode("ascii"),
        ),
    ]


def _held(attempts: list[dict[str, Any]]) -> bool:
    foreign = [a for a in attempts if a["role"] != "control_perimeter"]
    control = next(a for a in attempts if a["role"] == "control_perimeter")
    return (not any(a["opened"] for a in foreign)) and bool(control["opened"])


def _public_snapshot(snap: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in snap.items() if k != "keys"}


def run_canary_proof() -> dict[str, Any]:
    snap = _namespace_snapshot()
    plaintext = json.dumps(CANARY, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    ct_b64, nonce_b64, chash, cipher_id = perimeter_crypto.encrypt_payload(CANARY)
    attempts = _run_attempts(ciphertext_b64=ct_b64, nonce_b64=nonce_b64, keys=snap["keys"])
    held = _held(attempts) and bool(snap["fingerprints_distinct"])
    return {
        "subject": "canary",
        "proof_status": "held" if held else "failed",
        "procedure": list(PROCEDURE),
        "namespaces": _public_snapshot(snap),
        "captured_brief": {
            "kind": "published_canary",
            "cipher_id": cipher_id,
            "content_hash": chash,
            "ciphertext_sha384": _fp(base64.urlsafe_b64decode(ct_b64.encode("ascii"))),
            "nonce_sha384": _fp(base64.urlsafe_b64decode(nonce_b64.encode("ascii"))),
            "plaintext_sha384": _fp(plaintext),
        },
        "attempts": attempts,
        "note": (
            "Failed-decryption test against this operator host. "
            "Key fingerprints are SHA-384 of derived 32-byte keys, not the keys. "
            "Owners can replay the same attempts on their own captured brief via "
            "GET /perimeter-cleanup/jobs/{id}/blast-radius."
        ),
    }


def run_captured_brief_proof(*, ciphertext_b64: str, nonce_b64: str, content_hash: str, cipher_id: str) -> dict[str, Any]:
    snap = _namespace_snapshot()
    attempts = _run_attempts(ciphertext_b64=ciphertext_b64, nonce_b64=nonce_b64, keys=snap["keys"])
    held = _held(attempts) and bool(snap["fingerprints_distinct"])
    ct = base64.urlsafe_b64decode(ciphertext_b64.encode("ascii"))
    nonce = base64.urlsafe_b64decode(nonce_b64.encode("ascii"))
    return {
        "subject": "captured_owner_brief",
        "proof_status": "held" if held else "failed",
        "procedure": list(PROCEDURE),
        "namespaces": _public_snapshot(snap),
        "captured_brief": {
            "kind": "owner_job",
            "cipher_id": cipher_id,
            "content_hash": content_hash,
            "ciphertext_sha384": _fp(ct),
            "nonce_sha384": _fp(nonce),
        },
        "attempts": attempts,
        "note": (
            "Same host-key snapshot as the public canary, applied to this owner's captured ciphertext. "
            "Plaintext is not included. Control open uses the perimeter namespace only."
        ),
    }
