"""Reconcile faucet claims against registration quarantine for operator review."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FaucetClaim
from app.services.anti_sybil import user_free_grants_quarantined


async def faucet_abuse_check_tick(session: AsyncSession, *, max_items: int = 500) -> dict:
    """Flag granted faucet claims whose users are sybil-quarantined.

    Does not auto-clawback spent balances (that can break ledger invariants).
    Operators can reverse promotional credit using the welcome-grant / faucet
    legal policy after manual review.
    """
    rows = (
        await session.execute(
            select(FaucetClaim)
            .where(FaucetClaim.claim_status == "granted")
            .order_by(FaucetClaim.created_at.asc())
            .limit(max(1, int(max_items)))
        )
    ).scalars().all()

    checked = 0
    quarantined = 0
    for claim in rows:
        checked += 1
        if claim.user_id is None:
            continue
        if not await user_free_grants_quarantined(session, user_id=claim.user_id):
            continue
        quarantined += 1
        claim.claim_status = "held"
        flags = dict(claim.risk_flags or {})
        flags["abuse_tick"] = "registration_sybil_quarantine"
        flags["review"] = "manual_clawback_candidate"
        claim.risk_flags = flags

    await session.flush()
    return {
        "checked": checked,
        "quarantined": quarantined,
        "clawed_back": 0,
        "max_items": max_items,
    }
