from __future__ import annotations

from typing import Any

import httpx
from fastapi import HTTPException, Request, status

from app.config import get_settings

_TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(request: Request, token: str | None, action: str) -> None:
    settings = get_settings()
    secret = (settings.turnstile_secret_key or "").strip()
    if not secret:
        return

    token_value = (token or "").strip()
    if not token_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Turnstile verification is required")

    remote_ip = getattr(request.client, "host", None) if request.client else None
    payload: dict[str, Any] = {
        "secret": secret,
        "response": token_value,
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(_TURNSTILE_VERIFY_URL, data=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Turnstile verification is temporarily unavailable",
        ) from exc

    if not data.get("success"):
        error_codes = data.get("error-codes") or []
        suffix = f" ({', '.join(str(code) for code in error_codes)})" if error_codes else ""
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Turnstile verification failed{suffix}")

    verified_action = str(data.get("action") or "").strip()
    if verified_action and verified_action != action:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Turnstile action mismatch")
