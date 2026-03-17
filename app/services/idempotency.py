from __future__ import annotations

import hashlib
import json
from typing import Any

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import IdempotencyKey


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
    q = select(IdempotencyKey).where(IdempotencyKey.scope == scope, IdempotencyKey.key == key).limit(1)
    r = await session.execute(q)
    row = r.scalar_one_or_none()
    if not row:
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
) -> None:
    req_hash = _hash_request(request_payload)
    encoded = jsonable_encoder(response_json)
    row = IdempotencyKey(
        scope=scope,
        key=key,
        request_hash=req_hash,
        status_code=status_code,
        response_json=encoded,
    )
    session.add(row)
    await session.flush()

