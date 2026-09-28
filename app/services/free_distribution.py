"""Free ACP distribution controls (welcome grant, faucet, referral signup bonus).

Stops promotional minting when disabled or when cumulative free ACP reaches the
configured cap (default 1_000_000 ACP).
"""
from __future__ import annotations

import hashlib
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import LedgerEvent


FREE_DISTRIBUTION_TYPES = frozenset(
    {
        "welcome_grant",
        "faucet",
        "referral_signup_bonus",
    }
)

_FREE_DISTRIBUTION_LOCK_KEY = int.from_bytes(
    hashlib.sha256(b"ancap:free_acp_distribution_cap").digest()[:8],
    "big",
    signed=True,
)


def free_distribution_cap() -> Decimal:
    try:
        value = Decimal(str(get_settings().free_acp_distribution_cap or "0"))
        return value if value > 0 else Decimal("0")
    except Exception:
        return Decimal("0")


def faucet_max_amount() -> Decimal:
    try:
        value = Decimal(str(get_settings().faucet_max_amount_acp or "10"))
        return value if value > 0 else Decimal("10")
    except Exception:
        return Decimal("10")


async def total_free_acp_distributed(session: AsyncSession) -> Decimal:
    """Sum credited ACP for known free-distribution ledger metadata types.

    Referral signup bonuses write a negative system-debit row and a positive
    beneficiary-credit row with the same metadata type. Count only positive
    amounts so each bonus contributes once toward the cap.
    """
    total = Decimal("0")
    for dist_type in FREE_DISTRIBUTION_TYPES:
        row = (
            await session.execute(
                select(func.coalesce(func.sum(LedgerEvent.amount_value), 0)).where(
                    LedgerEvent.amount_currency == "ACP",
                    LedgerEvent.metadata_["type"].astext == dist_type,
                    LedgerEvent.amount_value > 0,
                )
            )
        ).scalar_one()
        total += Decimal(str(row or 0))
    return total


async def free_distribution_status(session: AsyncSession) -> dict:
    settings = get_settings()
    enabled = bool(settings.free_acp_distribution_enabled)
    cap = free_distribution_cap()
    distributed = await total_free_acp_distributed(session)
    remaining = max(Decimal("0"), cap - distributed) if cap > 0 else Decimal("0")
    open_for_grants = enabled and (cap <= 0 or distributed < cap)
    return {
        "enabled": enabled,
        "open": open_for_grants,
        "cap_acp": str(cap),
        "distributed_acp": str(distributed),
        "remaining_acp": str(remaining),
        "reason": None
        if open_for_grants
        else ("disabled" if not enabled else "cap_reached"),
    }


async def free_distribution_allows(session: AsyncSession, *, amount: Decimal) -> tuple[bool, str | None]:
    """Return (allowed, reason) for issuing `amount` more free ACP.

    Takes a transaction-scoped advisory lock so concurrent registrations /
    faucet claims / referral bonuses cannot overshoot the cap under
    read-committed isolation.
    """
    if amount <= 0:
        return False, "non_positive_amount"
    await session.execute(
        text("SELECT pg_advisory_xact_lock(:k)"),
        {"k": _FREE_DISTRIBUTION_LOCK_KEY},
    )
    status = await free_distribution_status(session)
    if not status["open"]:
        return False, status["reason"]
    remaining = Decimal(status["remaining_acp"])
    cap = Decimal(status["cap_acp"])
    if cap > 0 and amount > remaining:
        return False, "cap_reached"
    return True, None
