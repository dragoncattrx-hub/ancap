"""Registration anti-sybil signals for free ACP grants.

Accounts can always register; repeated IP/device signals quarantine free grants
(welcome / faucet) until review. Hashes are one-way salted digests — raw IPs
are not stored.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import RegistrationSignal
from app.services.rate_limit import get_request_ip


def _hash_signal(kind: str, value: str) -> str:
    secret = (get_settings().secret_key or "ancap").encode("utf-8")
    digest = hashlib.sha256(secret + b"|" + kind.encode("utf-8") + b"|" + value.encode("utf-8"))
    return digest.hexdigest()


@dataclass(frozen=True)
class SybilDecision:
    free_grants_allowed: bool
    reason: str | None = None
    ip_hash: str | None = None
    device_hash: str | None = None


async def evaluate_registration_signals(
    session: AsyncSession,
    *,
    request: Request,
    user_id: UUID,
    device_fingerprint: str | None,
) -> SybilDecision:
    settings = get_settings()
    ip = get_request_ip(request) or "unknown"
    ip_hash = _hash_signal("ip", ip)
    device_raw = (device_fingerprint or "").strip()
    device_hash = _hash_signal("device", device_raw) if device_raw else None

    window_hours = max(1, int(settings.registration_signal_window_hours or 168))
    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)

    ip_count = (
        await session.execute(
            select(func.count())
            .select_from(RegistrationSignal)
            .where(
                RegistrationSignal.ip_hash == ip_hash,
                RegistrationSignal.created_at >= since,
                RegistrationSignal.free_grants_allowed.is_(True),
            )
        )
    ).scalar_one()
    ip_count = int(ip_count or 0)

    device_count = 0
    if device_hash:
        device_count = int(
            (
                await session.execute(
                    select(func.count())
                    .select_from(RegistrationSignal)
                    .where(
                        RegistrationSignal.device_hash == device_hash,
                        RegistrationSignal.created_at >= since,
                        RegistrationSignal.free_grants_allowed.is_(True),
                    )
                )
            ).scalar_one()
            or 0
        )

    max_ip = max(1, int(settings.registration_signal_max_per_ip or 2))
    max_device = max(1, int(settings.registration_signal_max_per_device or 2))

    allowed = True
    reason: str | None = None
    if ip_count >= max_ip:
        allowed = False
        reason = "ip_velocity"
    elif device_hash and device_count >= max_device:
        allowed = False
        reason = "device_velocity"

    session.add(
        RegistrationSignal(
            user_id=user_id,
            ip_hash=ip_hash,
            device_hash=device_hash,
            free_grants_allowed=allowed,
            risk_flags={"reason": reason} if reason else {},
        )
    )
    await session.flush()
    return SybilDecision(
        free_grants_allowed=allowed,
        reason=reason,
        ip_hash=ip_hash,
        device_hash=device_hash,
    )


async def user_free_grants_quarantined(session: AsyncSession, *, user_id: UUID) -> bool:
    row = (
        await session.execute(
            select(RegistrationSignal)
            .where(RegistrationSignal.user_id == user_id)
            .order_by(RegistrationSignal.created_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if row is None:
        return False
    return not bool(row.free_grants_allowed)
