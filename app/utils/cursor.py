"""Opaque cursor for pagination: base64url(JSON + HMAC). Sort: created_at desc, id desc."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ValidationError


@dataclass(frozen=True)
class CursorKeys:
    secret: str


class _CursorPayload(BaseModel):
    v: int = 1
    ts: str  # ISO datetime
    id: str  # UUID string (or sortable id as string)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(s: str) -> bytes:
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode((s + pad).encode("utf-8"))


def encode_cursor(keys: CursorKeys, created_at: datetime, id_str: str) -> str:
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    payload = _CursorPayload(ts=created_at.isoformat(), id=id_str).model_dump()
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    sig = hmac.new(keys.secret.encode("utf-8"), body, hashlib.sha256).digest()
    return _b64url_encode(body) + "." + _b64url_encode(sig)


def decode_cursor(keys: CursorKeys, token: str) -> Optional[tuple[datetime, str]]:
    try:
        body_b64, sig_b64 = token.split(".", 1)
        body = _b64url_decode(body_b64)
        sig = _b64url_decode(sig_b64)

        exp_sig = hmac.new(keys.secret.encode("utf-8"), body, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, exp_sig):
            return None

        data = json.loads(body.decode("utf-8"))
        payload = _CursorPayload(**data)

        ts = datetime.fromisoformat(payload.ts)
        return ts, payload.id
    except (ValueError, ValidationError, json.JSONDecodeError):
        return None
