"""L3: Stakes and slashing API."""
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException, Depends

from app.api.deps import DbSession, require_agent_id
from app.schemas.stakes import StakeCreateRequest, StakePublic, SlashRequest
from app.db.models import Stake
from sqlalchemy import select
from app.services.stakes import stake, release_stake, slash_agent

router = APIRouter(prefix="/stakes", tags=["Stakes (L3)"])


@router.post("", response_model=StakePublic, status_code=201)
async def create_stake(
    body: StakeCreateRequest,
    session: DbSession,
    agent_id: Annotated[UUID, Depends(require_agent_id)],
):
    """Stake amount from caller's agent account. Requires X-API-Key."""
    try:
        value = Decimal(body.amount)
        if value <= 0:
            raise ValueError("Amount must be positive")
        st = await stake(
            session,
            agent_id=agent_id,
            amount_currency=body.currency,
            amount_value=value,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return StakePublic(
        id=str(st.id),
        agent_id=str(st.agent_id),
        amount_currency=st.amount_currency,
        amount_value=str(st.amount_value),
        status=st.status.value,
        slash_reason=st.slash_reason,
        created_at=st.created_at,
        released_at=st.released_at,
    )


@router.post("/{stake_id}/release", response_model=StakePublic)
async def release_stake_endpoint(
    stake_id: UUID,
    session: DbSession,
    agent_id: Annotated[UUID, Depends(require_agent_id)],
):
    try:
        st = await release_stake(session, stake_id=stake_id, agent_id=agent_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return StakePublic(
        id=str(st.id),
        agent_id=str(st.agent_id),
        amount_currency=st.amount_currency,
        amount_value=str(st.amount_value),
        status=st.status.value,
        slash_reason=st.slash_reason,
        created_at=st.created_at,
        released_at=st.released_at,
    )


@router.get("", response_model=list[StakePublic])
async def list_stakes(
    session: DbSession,
    agent_id: UUID = Query(..., description="Filter by agent"),
):
    q = select(Stake).where(Stake.agent_id == agent_id).order_by(Stake.created_at.desc())
    r = await session.execute(q)
    rows = r.scalars().all()
    return [
        StakePublic(
            id=str(st.id),
            agent_id=str(st.agent_id),
            amount_currency=st.amount_currency,
            amount_value=str(st.amount_value),
            status=st.status.value,
            slash_reason=st.slash_reason,
            created_at=st.created_at,
            released_at=st.released_at,
        )
        for st in rows
    ]


@router.post("/slash/{agent_id}", status_code=200)
async def slash_agent_endpoint(agent_id: UUID, body: SlashRequest, session: DbSession):
    """Slash agent (moderator/system). Deducts from active stakes to platform."""
    try:
        amount = Decimal(body.amount)
        if amount <= 0:
            raise ValueError("Amount must be positive")
        slashed = await slash_agent(
            session,
            agent_id=agent_id,
            amount_currency=body.currency,
            amount_value=amount,
            reason=body.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"slashed": str(slashed), "currency": body.currency}
