"""Auction-deal hybrid envelope — X-Wing draft-10 style (platform vault).

Suite: ML-KEM-768 + X25519 combiner (SHA3-256 X-Wing label) → HKDF-SHA256 →
XChaCha20-Poly1305. Matches ACP explorer encryption_security / docs/ACP_PQC_ENCRYPTION.md
for off-chain deal sealing. Platform recipient keys are HKDF-derived from SECRET_KEY
(or AUCTION_DEAL_MASTER_KEY). Experimental until independent review — not a TLS replacement.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import struct
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import mlkem, x25519
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from app.config import get_settings

CIPHER_ID = "xwing-draft10-ml-kem-768-x25519-hkdf-sha256-xchacha20poly1305-v1"
HYBRID_SUITE = "X-Wing-draft10/HKDF-SHA256/XChaCha20-Poly1305"
HYBRID_VERSION = 1
CONTEXT = b"ACP/auction-deal/v1"
KDF_LABEL = b"ACP/hybrid-kem/content-key/v1"
XWING_LABEL = bytes([0x5C, 0x2E, 0x2F, 0x2F, 0x5E, 0x5C])
AAD_MAGIC = b"ACP-PQ-ENVELOPE"
ML_KEM_CT_LEN = 1088
MAX_PLAINTEXT = 1_048_576


def _master_material() -> bytes:
    settings = get_settings()
    dedicated = (getattr(settings, "auction_deal_master_key", None) or "").strip()
    if dedicated:
        return dedicated.encode("utf-8")
    secret = (settings.secret_key or "ancap-dev-auction-deal").encode("utf-8")
    return secret + b"|auction-deal-xwing-v1"


def _hkdf(length: int, *, salt: bytes, info: bytes) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=salt,
        info=info,
    ).derive(_master_material())


def _platform_x25519() -> tuple[x25519.X25519PrivateKey, bytes]:
    seed = _hkdf(32, salt=b"ancap-auction-deal-x25519-salt-v1", info=b"ancap-auction-deal-x25519-v1")
    priv = x25519.X25519PrivateKey.from_private_bytes(seed)
    pub = priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    return priv, pub


def _platform_mlkem() -> tuple[mlkem.MLKEM768PrivateKey, bytes]:
    seed = _hkdf(64, salt=b"ancap-auction-deal-mlkem-salt-v1", info=b"ancap-auction-deal-mlkem-v1")
    priv = mlkem.MLKEM768PrivateKey.from_seed_bytes(seed)
    pub = priv.public_key().public_bytes_raw()
    return priv, pub


def recipient_key_id() -> bytes:
    _, x_pub = _platform_x25519()
    _, ml_pub = _platform_mlkem()
    h = hashlib.sha256()
    h.update(bytes([HYBRID_VERSION]))
    h.update(HYBRID_SUITE.encode("ascii"))
    h.update(x_pub)
    h.update(ml_pub)
    return h.digest()


def content_hash(plaintext: bytes) -> str:
    return "sha256:" + hashlib.sha256(plaintext).hexdigest()


def _combine_xwing(
    ml_shared: bytes,
    x25519_shared: bytes,
    ephemeral_x25519: bytes,
    recipient_x25519: bytes,
) -> bytes:
    if len(ml_shared) != 32 or len(x25519_shared) != 32:
        raise ValueError("Invalid X-Wing shared secret lengths")
    h = hashlib.sha3_256()
    h.update(ml_shared)
    h.update(x25519_shared)
    h.update(ephemeral_x25519)
    h.update(recipient_x25519)
    h.update(XWING_LABEL)
    return h.digest()


def _associated_data(
    *,
    key_id: bytes,
    ephemeral_x25519: bytes,
    ml_ct: bytes,
    nonce: bytes,
    context: bytes,
) -> bytes:
    suite = HYBRID_SUITE.encode("ascii")
    aad = bytearray()
    aad.extend(AAD_MAGIC)
    aad.append(HYBRID_VERSION)
    aad.extend(struct.pack(">H", len(suite)))
    aad.extend(suite)
    aad.extend(key_id)
    aad.extend(ephemeral_x25519)
    aad.extend(struct.pack(">H", len(ml_ct)))
    aad.extend(ml_ct)
    aad.extend(nonce)
    aad.extend(struct.pack(">I", len(context)))
    aad.extend(context)
    return bytes(aad)


def _derive_content_key(xwing_shared: bytes, key_id: bytes, aad: bytes) -> bytes:
    aad_hash = hashlib.sha256(aad).digest()
    info = KDF_LABEL + aad_hash
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=key_id,
        info=info,
    ).derive(xwing_shared)


def _rotl32(v: int, n: int) -> int:
    return ((v << n) | (v >> (32 - n))) & 0xFFFFFFFF


def _hchacha20(key: bytes, nonce16: bytes) -> bytes:
    """HChaCha20 (draft-irtf-cfrg-xchacha) for XChaCha20 key derivation."""
    if len(key) != 32 or len(nonce16) != 16:
        raise ValueError("HChaCha20 requires 32-byte key and 16-byte nonce")
    constants = (0x61707865, 0x3320646E, 0x79622D32, 0x6B206574)
    state = list(constants)
    state.extend(struct.unpack("<8I", key))
    state.extend(struct.unpack("<4I", nonce16))

    def quarter(a: int, b: int, c: int, d: int) -> tuple[int, int, int, int]:
        a = (a + b) & 0xFFFFFFFF
        d = _rotl32(d ^ a, 16)
        c = (c + d) & 0xFFFFFFFF
        b = _rotl32(b ^ c, 12)
        a = (a + b) & 0xFFFFFFFF
        d = _rotl32(d ^ a, 8)
        c = (c + d) & 0xFFFFFFFF
        b = _rotl32(b ^ c, 7)
        return a, b, c, d

    for _ in range(10):
        state[0], state[4], state[8], state[12] = quarter(state[0], state[4], state[8], state[12])
        state[1], state[5], state[9], state[13] = quarter(state[1], state[5], state[9], state[13])
        state[2], state[6], state[10], state[14] = quarter(state[2], state[6], state[10], state[14])
        state[3], state[7], state[11], state[15] = quarter(state[3], state[7], state[11], state[15])
        state[0], state[5], state[10], state[15] = quarter(state[0], state[5], state[10], state[15])
        state[1], state[6], state[11], state[12] = quarter(state[1], state[6], state[11], state[12])
        state[2], state[7], state[8], state[13] = quarter(state[2], state[7], state[8], state[13])
        state[3], state[4], state[9], state[14] = quarter(state[3], state[4], state[9], state[14])

    out = state[0:4] + state[12:16]
    return struct.pack("<8I", *out)


def _xchacha20poly1305_encrypt(key: bytes, nonce24: bytes, plaintext: bytes, aad: bytes) -> bytes:
    subkey = _hchacha20(key, nonce24[:16])
    # IETF XChaCha20-Poly1305: 12-byte nonce = 4 zero bytes || nonce[16:24]
    return ChaCha20Poly1305(subkey).encrypt(b"\x00\x00\x00\x00" + nonce24[16:], plaintext, aad)


def _xchacha20poly1305_decrypt(key: bytes, nonce24: bytes, ciphertext: bytes, aad: bytes) -> bytes:
    subkey = _hchacha20(key, nonce24[:16])
    return ChaCha20Poly1305(subkey).decrypt(b"\x00\x00\x00\x00" + nonce24[16:], ciphertext, aad)


def encrypt_deal(obj: dict[str, Any], *, context: bytes = CONTEXT) -> tuple[str, str, str]:
    """Return (envelope_b64, content_hash, cipher_id)."""
    plaintext = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    if len(plaintext) > MAX_PLAINTEXT:
        raise ValueError("Deal plaintext too large")

    ml_priv, ml_pub = _platform_mlkem()
    _x_priv, x_pub = _platform_x25519()
    key_id = recipient_key_id()

    ml_shared, ml_ct = ml_priv.public_key().encapsulate()
    if len(ml_ct) != ML_KEM_CT_LEN:
        raise RuntimeError("Unexpected ML-KEM-768 ciphertext length")

    eph_priv = x25519.X25519PrivateKey.generate()
    eph_pub = eph_priv.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    x_shared = eph_priv.exchange(x25519.X25519PublicKey.from_public_bytes(x_pub))

    xwing = _combine_xwing(ml_shared, x_shared, eph_pub, x_pub)
    nonce = os.urandom(24)
    aad = _associated_data(
        key_id=key_id,
        ephemeral_x25519=eph_pub,
        ml_ct=ml_ct,
        nonce=nonce,
        context=context,
    )
    content_key = _derive_content_key(xwing, key_id, aad)
    ct = _xchacha20poly1305_encrypt(content_key, nonce, plaintext, aad)

    envelope = {
        "version": HYBRID_VERSION,
        "suite": HYBRID_SUITE,
        "cipher_id": CIPHER_ID,
        "recipient_key_id": base64.urlsafe_b64encode(key_id).decode("ascii"),
        "ephemeral_x25519": base64.urlsafe_b64encode(eph_pub).decode("ascii"),
        "ml_kem_768_ciphertext": base64.urlsafe_b64encode(ml_ct).decode("ascii"),
        "nonce": base64.urlsafe_b64encode(nonce).decode("ascii"),
        "ciphertext": base64.urlsafe_b64encode(ct).decode("ascii"),
        "ml_kem_pub_fp": hashlib.sha256(ml_pub).hexdigest()[:16],
    }
    raw = json.dumps(envelope, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return (
        base64.urlsafe_b64encode(raw).decode("ascii"),
        content_hash(plaintext),
        CIPHER_ID,
    )


def decrypt_deal(*, envelope_b64: str, context: bytes = CONTEXT) -> dict[str, Any]:
    raw = base64.urlsafe_b64decode(envelope_b64.encode("ascii"))
    envelope = json.loads(raw.decode("utf-8"))
    if envelope.get("version") != HYBRID_VERSION or envelope.get("suite") != HYBRID_SUITE:
        raise ValueError("Unsupported auction-deal crypto suite")
    if envelope.get("cipher_id") != CIPHER_ID:
        raise ValueError("Unsupported auction-deal cipher_id")

    ml_priv, _ = _platform_mlkem()
    x_priv, x_pub = _platform_x25519()
    key_id = recipient_key_id()
    stored_kid = base64.urlsafe_b64decode(envelope["recipient_key_id"].encode("ascii"))
    if stored_kid != key_id:
        raise ValueError("Recipient key id mismatch")

    ml_ct = base64.urlsafe_b64decode(envelope["ml_kem_768_ciphertext"].encode("ascii"))
    eph_pub = base64.urlsafe_b64decode(envelope["ephemeral_x25519"].encode("ascii"))
    nonce = base64.urlsafe_b64decode(envelope["nonce"].encode("ascii"))
    ct = base64.urlsafe_b64decode(envelope["ciphertext"].encode("ascii"))

    ml_shared = ml_priv.decapsulate(ml_ct)
    x_shared = x_priv.exchange(x25519.X25519PublicKey.from_public_bytes(eph_pub))
    xwing = _combine_xwing(ml_shared, x_shared, eph_pub, x_pub)
    aad = _associated_data(
        key_id=key_id,
        ephemeral_x25519=eph_pub,
        ml_ct=ml_ct,
        nonce=nonce,
        context=context,
    )
    content_key = _derive_content_key(xwing, key_id, aad)
    pt = _xchacha20poly1305_decrypt(content_key, nonce, ct, aad)
    data = json.loads(pt.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Deal payload must be an object")
    return data


def vault_public_meta() -> dict[str, str]:
    return {
        "cipher_id": CIPHER_ID,
        "suite": HYBRID_SUITE,
        "kdf": "HKDF-SHA256",
        "aead": "XChaCha20-Poly1305",
        "kem": "X-Wing-draft10 (ML-KEM-768 + X25519)",
        "note": (
            "Auction deal payloads sealed at rest under the ACP hybrid PQC envelope "
            "(docs/ACP_PQC_ENCRYPTION.md). Experimental off-chain vault."
        ),
    }
