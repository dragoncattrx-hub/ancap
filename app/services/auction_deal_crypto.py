"""Auction-deal hybrid envelope — thin wrapper over shared X-Wing seal.

Preserves auction-specific recipient-key HKDF salts so existing sealed deals
remain decryptable. New vaults (passport/DNA/perimeter/wallet) use
``app.services.pqc_envelope`` with their own contexts.
"""
from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.services import pqc_envelope

CIPHER_ID = pqc_envelope.CIPHER_ID
HYBRID_SUITE = pqc_envelope.HYBRID_SUITE
HYBRID_VERSION = pqc_envelope.HYBRID_VERSION
CONTEXT = b"ACP/auction-deal/v1"

_AUCTION_SUFFIX = b"|auction-deal-xwing-v1"
_AUCTION_FALLBACK = b"ancap-dev-auction-deal|auction-deal-xwing-v1"
_AUCTION_X25519_SALT = b"ancap-auction-deal-x25519-salt-v1"
_AUCTION_X25519_INFO = b"ancap-auction-deal-x25519-v1"
_AUCTION_MLKEM_SALT = b"ancap-auction-deal-mlkem-salt-v1"
_AUCTION_MLKEM_INFO = b"ancap-auction-deal-mlkem-v1"


def _dedicated() -> str | None:
    settings = get_settings()
    return (getattr(settings, "auction_deal_master_key", None) or "").strip() or None


def _seal_kwargs() -> dict:
    return {
        "dedicated": _dedicated(),
        "secret_key_suffix": _AUCTION_SUFFIX,
        "development_fallback": _AUCTION_FALLBACK,
        "purpose": "Auction deal crypto",
        "x25519_salt": _AUCTION_X25519_SALT,
        "x25519_info": _AUCTION_X25519_INFO,
        "mlkem_salt": _AUCTION_MLKEM_SALT,
        "mlkem_info": _AUCTION_MLKEM_INFO,
    }


def content_hash(plaintext: bytes) -> str:
    return pqc_envelope.content_hash(plaintext)


def recipient_key_id() -> bytes:
    from app.services.crypto_secrets import resolve_secret_material

    master = resolve_secret_material(
        dedicated=_dedicated() or "",
        secret_key_suffix=_AUCTION_SUFFIX,
        development_fallback=_AUCTION_FALLBACK,
        purpose="Auction deal crypto",
    )
    return pqc_envelope.recipient_key_id(
        master,
        x25519_salt=_AUCTION_X25519_SALT,
        x25519_info=_AUCTION_X25519_INFO,
        mlkem_salt=_AUCTION_MLKEM_SALT,
        mlkem_info=_AUCTION_MLKEM_INFO,
    )


def encrypt_deal(obj: dict[str, Any], *, context: bytes = CONTEXT) -> tuple[str, str, str]:
    return pqc_envelope.seal_json(obj, context=context, **_seal_kwargs())


def decrypt_deal(*, envelope_b64: str, context: bytes = CONTEXT) -> dict[str, Any]:
    return pqc_envelope.open_json(envelope_b64=envelope_b64, context=context, **_seal_kwargs())


def vault_public_meta() -> dict[str, str]:
    return pqc_envelope.vault_public_meta(
        note=(
            "Auction deal payloads sealed at rest under the ACP hybrid PQC envelope "
            "(docs/ACP_PQC_ENCRYPTION.md). Experimental off-chain vault."
        )
    )


# Back-compat aliases used by auction services
seal_auction_deal = encrypt_deal
open_auction_deal = decrypt_deal
