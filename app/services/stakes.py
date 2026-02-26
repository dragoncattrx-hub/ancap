"""L3: Stake, release, slash. Ledger: agent <-> stake_escrow, slash -> platform."""
from decimal import Decimal
from uuid import UUID
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Stake, StakeStatusEnum, LedgerEventTypeEnum, Agent
from app.services.ledger import get_or_create_account, append_event, balance_for_account
from app.constants import PLATFORM_ACCOUNT_OWNER_ID, STAKE_ESCROW_ACCOUNT_OWNER_ID
from app.config import get_settings


async def stake(
    session: AsyncSession,
    *,
    agent_id: UUID,
    amount_currency: str,
    amount_value: Decimal,
) -> Stake:
    """Lock amount from agent to stake_escrow. Creates Stake record (active). When stake_to_activate is set, activates agent if this stake meets threshold."""
    acc_agent = await get_or_create_account(session, "agent", agent_id)
    acc_escrow = await get_or_create_account(session, "stake_escrow", STAKE_ESCROW_ACCOUNT_OWNER_ID)
    bal = await balance_for_account(session, acc_agent.id, amount_currency)
    if (bal.get(amount_currency) or Decimal(0)) < amount_value:
        raise ValueError("Insufficient balance to stake")
    await append_event(
        session,
        LedgerEventTypeEnum.stake,
        amount_currency,
        amount_value,
        src_account_id=acc_agent.id,
        dst_account_id=acc_escrow.id,
        metadata={"agent_id": str(agent_id)},
    )
    st = Stake(
        agent_id=agent_id,
        amount_currency=amount_currency,
        amount_value=amount_value,
        status=StakeStatusEnum.active,
    )
    session.add(st)
    await session.flush()
    # L3 stake-to-activate: set activated_at when stake meets config threshold (or any stake if threshold 0)
    settings = get_settings()
    threshold = Decimal(settings.stake_to_activate_amount or "0")
    agent = await session.get(Agent, agent_id)
    if agent and not agent.activated_at:
        if threshold <= 0 or (amount_currency == settings.stake_to_activate_currency and amount_value >= threshold):
            agent.activated_at = datetime.utcnow()
    return st


async def release_stake(session: AsyncSession, stake_id: UUID, agent_id: UUID) -> Stake:
    """Return stake to agent; mark Stake released."""
    r = await session.execute(select(Stake).where(Stake.id == stake_id, Stake.agent_id == agent_id))
    st = r.scalar_one_or_none()
    if not st:
        raise ValueError("Stake not found")
    if st.status != StakeStatusEnum.active:
        raise ValueError("Stake is not active")
    acc_agent = await get_or_create_account(session, "agent", agent_id)
    acc_escrow = await get_or_create_account(session, "stake_escrow", STAKE_ESCROW_ACCOUNT_OWNER_ID)
    value = st.amount_value
    await append_event(
        session,
        LedgerEventTypeEnum.unstake,
        st.amount_currency,
        value,
        src_account_id=acc_escrow.id,
        dst_account_id=acc_agent.id,
        metadata={"stake_id": str(stake_id), "agent_id": str(agent_id)},
    )
    st.status = StakeStatusEnum.released
    st.released_at = datetime.utcnow()
    await session.flush()
    return st


async def slash_agent(
    session: AsyncSession,
    *,
    agent_id: UUID,
    amount_currency: str,
    amount_value: Decimal,
    reason: str,
) -> Decimal:
    """Slash from agent's active stakes (FIFO). Transfer from stake_escrow to platform. Returns amount slashed."""
    acc_escrow = await get_or_create_account(session, "stake_escrow", STAKE_ESCROW_ACCOUNT_OWNER_ID)
    acc_platform = await get_or_create_account(session, "system", PLATFORM_ACCOUNT_OWNER_ID)
    r = await session.execute(
        select(Stake)
        .where(Stake.agent_id == agent_id, Stake.status == StakeStatusEnum.active)
        .order_by(Stake.created_at.asc())
    )
    stakes = r.scalars().all()
    remaining = amount_value
    slashed_total = Decimal(0)
    for st in stakes:
        if remaining <= 0 or st.amount_currency != amount_currency:
            continue
        # MVP: slash whole stakes only (no partial)
        if st.amount_value > remaining:
            continue
        take = st.amount_value
        await append_event(
            session,
            LedgerEventTypeEnum.slash,
            amount_currency,
            take,
            src_account_id=acc_escrow.id,
            dst_account_id=acc_platform.id,
            metadata={"agent_id": str(agent_id), "reason": reason, "stake_id": str(st.id)},
        )
        slashed_total += take
        remaining -= take
        st.status = StakeStatusEnum.slashed
        st.slash_reason = reason
        st.released_at = datetime.utcnow()
    return slashed_total


async def require_activated_if_stake_required(session: AsyncSession, agent_id: UUID) -> None:
    """If stake_to_activate is configured, raises HTTPException 403 when agent is not activated."""
    from fastapi import HTTPException

    settings = get_settings()
    if float(settings.stake_to_activate_amount or "0") <= 0:
        return
    agent = await session.get(Agent, agent_id)
    if not agent:
        return
    if agent.activated_at is None:
        raise HTTPException(
            status_code=403,
            detail=f"Agent must stake to activate before this action. Stake at least {settings.stake_to_activate_amount} {settings.stake_to_activate_currency} via POST /v1/stakes.",
        )
