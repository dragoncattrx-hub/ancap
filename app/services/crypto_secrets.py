"""Shared helpers for HKDF / pepper material — refuse predictable defaults outside development."""
from __future__ import annotations

from app.config import get_settings


def resolve_secret_material(
    *,
    dedicated: str | None,
    secret_key_suffix: bytes,
    development_fallback: bytes,
    purpose: str,
) -> bytes:
    """Prefer a dedicated key, then SECRET_KEY; allow hardcoded fallback only in development."""
    settings = get_settings()
    dedicated_value = (dedicated or "").strip()
    if dedicated_value:
        return dedicated_value.encode("utf-8")

    secret = (settings.secret_key or "").strip()
    if secret:
        return secret.encode("utf-8") + secret_key_suffix

    env = (settings.environment or "").strip().lower()
    if env == "development":
        return development_fallback

    raise RuntimeError(f"{purpose} requires SECRET_KEY (or a dedicated master key) outside development")


def resolve_pepper(*, purpose: str, development_fallback: str = "ancap-dev-pepper") -> str:
    settings = get_settings()
    secret = (settings.secret_key or "").strip()
    if secret:
        return secret
    env = (settings.environment or "").strip().lower()
    if env == "development":
        return development_fallback
    raise RuntimeError(f"{purpose} requires SECRET_KEY outside development")
