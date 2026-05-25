from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, UTC
from typing import Any

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import IdempotencyKey

# Idempotency keys expire after 24 hours by default
IDEMPOTENCY_TTL_HOURS = 24


def _hash_request(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


async def get_idempotency_hit(
    session: AsyncSession,
    *,
    scope: str,
    key: str,
    request_payload: Any,
) -> IdempotencyKey | None:
    """Return existing record. If request_hash differs, raise 409."""
    q = select(IdempotencyKey).where(
        IdempotencyKey.scope == scope,
        IdempotencyKey.key == key,
    ).limit(1)
    r = await session.execute(q)
    row = r.scalar_one_or_none()
    if not row:
        return None
    # Expired keys are treated as absent
    if row.expires_at and row.expires_at < datetime.now(UTC):
        return None
    req_hash = _hash_request(request_payload)
    if row.request_hash != req_hash:
        raise HTTPException(status_code=409, detail="Idempotency-Key reuse with different request payload")
    return row


async def store_idempotency_result(
    session: AsyncSession,
    *,
    scope: str,
    key: str,
    request_payload: Any,
    status_code: int,
    response_json: Any,
    ttl_hours: int = IDEMPOTENCY_TTL_HOURS,
) -> None:
    req_hash = _hash_request(request_payload)
    encoded = jsonable_encoder(response_json)
    expires_at = datetime.now(UTC) + timedelta(hours=ttl_hours)
    row = IdempotencyKey(
        scope=scope,
        key=key,
        request_hash=req_hash,
        status_code=status_code,
        response_json=encoded,
        expires_at=expires_at,
    )
    session.add(row)
    await session.flush()

