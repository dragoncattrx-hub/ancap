from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Agent, FaucetClaim, LedgerEventTypeEnum
from app.services.ledger import get_or_create_account, append_event, is_ledger_invariant_halted


SYSTEM_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")


@dataclass(frozen=True)
class FaucetDecision:
    status: str  # granted|held|rejected
    reason: str | None = None


async def _basic_eligibility(
    session: AsyncSession,
    *,
    user_id: UUID | None,
    agent_id: UUID | None,
) -> FaucetDecision:
    if user_id is None and agent_id is None:
        return FaucetDecision(status="rejected", reason="missing_subject")

    # quarantine guardrail
    if agent_id is not None:
        r = await session.execute(select(Agent).where(Agent.id == agent_id))
        ag = r.scalar_one_or_none()
        if ag and str(ag.status) == "quarantined":
            return FaucetDecision(status="held", reason="agent_quarantined")

    # one granted claim per user (enforced by DB unique index as well)
    if user_id is not None:
        r = await session.execute(
            select(FaucetClaim).where(FaucetClaim.user_id == user_id, FaucetClaim.claim_status == "granted")
        )
        if r.scalar_one_or_none() is not None:
            return FaucetDecision(status="rejected", reason="already_claimed")

    return FaucetDecision(status="granted", reason=None)


async def claim_faucet(
    session: AsyncSession,
    *,
    user_id: UUID | None,
    agent_id: UUID | None,
    currency: str,
    amount_value: Decimal,
) -> FaucetClaim:
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger invariant violated; operations temporarily blocked")
    if amount_value <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")

    decision = await _basic_eligibility(session, user_id=user_id, agent_id=agent_id)
    claim_status = decision.status

    # Strong idempotency: if already granted, return the granted claim (do not create a new rejected row).
    if claim_status == "rejected" and decision.reason == "already_claimed" and user_id is not None:
        r = await session.execute(
            select(FaucetClaim).where(FaucetClaim.user_id == user_id, FaucetClaim.claim_status == "granted")
        )
        existing = r.scalar_one_or_none()
        if existing is not None:
            return existing

    claim = FaucetClaim(
        user_id=user_id,
        agent_id=agent_id,
        currency=currency,
        amount_value=amount_value,
        claim_status=claim_status,
        risk_flags={"reason": decision.reason} if decision.reason else {},
    )
    session.add(claim)
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        if user_id is not None:
            r = await session.execute(
                select(FaucetClaim).where(FaucetClaim.user_id == user_id, FaucetClaim.claim_status == "granted")
            )
            existing = r.scalar_one_or_none()
            if existing is not None:
                return existing
        raise HTTPException(status_code=409, detail="Faucet claim already exists")

    if claim.claim_status != "granted":
        return claim

    sys_acc = await get_or_create_account(session, "system", SYSTEM_OWNER_ID)
    if agent_id is not None:
        dst_acc = await get_or_create_account(session, "agent", agent_id)
    elif user_id is not None:
        dst_acc = await get_or_create_account(session, "user", user_id)
    else:
        raise HTTPException(status_code=400, detail="missing destination")

    # Keep faucet payout as one balanced transfer event to preserve ledger invariants.
    ev2 = await append_event(
        session,
        LedgerEventTypeEnum.transfer,
        currency,
        amount_value,
        src_account_id=sys_acc.id,
        dst_account_id=dst_acc.id,
        metadata={"type": "faucet", "faucet_claim_id": str(claim.id)},
    )
    claim.ledger_tx_id = ev2.id
    await session.flush()
    return claim

