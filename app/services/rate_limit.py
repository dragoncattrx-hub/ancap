from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from typing import Deque

from fastapi import HTTPException, Request, status

from app.services.cache import get_redis_client


_rate_limit_buckets: dict[str, Deque[float]] = defaultdict(deque)
_rate_limit_lock = asyncio.Lock()


def clear_rate_limit_state() -> None:
    _rate_limit_buckets.clear()


def get_request_ip(request: Request) -> str:
    return (
        (request.headers.get("cf-connecting-ip") or "").split(",")[0].strip()
        or (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
        or (request.client.host if request.client else "")
        or "unknown"
    )


def build_rate_limit_key(*, scope: str, ip: str, subject: str | None = None) -> str:
    normalized_scope = (scope or "global").strip().lower()
    normalized_ip = (ip or "unknown").strip().lower()
    normalized_subject = (subject or "").strip().lower()
    if normalized_subject:
        return f"{normalized_scope}:{normalized_ip}:{normalized_subject}"
    return f"{normalized_scope}:{normalized_ip}"


async def enforce_rate_limit(*, key: str, limit: int, window_seconds: int) -> None:
    if limit <= 0 or window_seconds <= 0:
        return

    # Skip Redis in tests when REDIS_URL is not set (forces in-memory path).
    # In-memory path is deterministic and does not need a running Redis server.
    import os as _os
    redis_url = _os.environ.get("REDIS_URL", "").strip()
    use_redis = bool(redis_url)

    client = await get_redis_client()
    if use_redis and client is not None:
        redis_key = f"rate_limit:{key}"
        try:
            count = await client.incr(redis_key)
            if count == 1:
                await client.expire(redis_key, window_seconds)
            if int(count) > limit:
                ttl = await client.ttl(redis_key)
                retry_after_seconds = max(1, int(ttl if ttl and ttl > 0 else window_seconds))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code": "RATE_LIMITED",
                        "message": "Too many requests. Try again later.",
                        "retry_after_seconds": retry_after_seconds,
                    },
                    headers={"Retry-After": str(retry_after_seconds)},
                )
            return
        finally:
            await client.aclose()

    now = time.monotonic()
    async with _rate_limit_lock:
        bucket = _rate_limit_buckets[key]
        cutoff = now - window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= limit:
            retry_after_seconds = max(1, int(bucket[0] + window_seconds - now))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "RATE_LIMITED",
                    "message": "Too many requests. Try again later.",
                    "retry_after_seconds": retry_after_seconds,
                },
                headers={"Retry-After": str(retry_after_seconds)},
            )

        bucket.append(now)
