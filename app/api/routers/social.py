from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession, require_auth
from app.db.models import Agent
from app.schemas import FollowRequest, CopyStrategyRequest, StrategyPublic
from app.services.social_graph import (
    follow_strategy,
    unfollow_strategy,
    follow_agent,
    unfollow_agent,
    copy_strategy,
)


router = APIRouter(prefix="/social", tags=["Growth Social"])


async def _require_owned_agent(session: DbSession, *, user_id: UUID, agent_id: UUID) -> None:
    r = await session.execute(select(Agent.id).where(Agent.id == agent_id, Agent.owner_user_id == user_id).limit(1))
    if r.scalar_one_or_none() is None:
        raise HTTPException(status_code=403, detail="Agent not owned by current user")


@router.post("/strategies/follow", status_code=204)
async def follow_strategy_ep(body: FollowRequest, session: DbSession, user_id: str = Depends(require_auth)):
    uid = UUID(user_id)
    as_agent_id = UUID(body.as_agent_id) if body.as_agent_id else None
    if as_agent_id:
        await _require_owned_agent(session, user_id=uid, agent_id=as_agent_id)
    await follow_strategy(session, strategy_id=UUID(body.target_id), follower_user_id=None if as_agent_id else uid, follower_agent_id=as_agent_id)


@router.post("/strategies/unfollow", status_code=204)
async def unfollow_strategy_ep(body: FollowRequest, session: DbSession, user_id: str = Depends(require_auth)):
    uid = UUID(user_id)
    as_agent_id = UUID(body.as_agent_id) if body.as_agent_id else None
    if as_agent_id:
        await _require_owned_agent(session, user_id=uid, agent_id=as_agent_id)
    await unfollow_strategy(session, strategy_id=UUID(body.target_id), follower_user_id=None if as_agent_id else uid, follower_agent_id=as_agent_id)


@router.post("/agents/follow", status_code=204)
async def follow_agent_ep(body: FollowRequest, session: DbSession, user_id: str = Depends(require_auth)):
    uid = UUID(user_id)
    as_agent_id = UUID(body.as_agent_id) if body.as_agent_id else None
    if as_agent_id:
        await _require_owned_agent(session, user_id=uid, agent_id=as_agent_id)
    await follow_agent(session, target_agent_id=UUID(body.target_id), follower_user_id=None if as_agent_id else uid, follower_agent_id=as_agent_id)


@router.post("/agents/unfollow", status_code=204)
async def unfollow_agent_ep(body: FollowRequest, session: DbSession, user_id: str = Depends(require_auth)):
    uid = UUID(user_id)
    as_agent_id = UUID(body.as_agent_id) if body.as_agent_id else None
    if as_agent_id:
        await _require_owned_agent(session, user_id=uid, agent_id=as_agent_id)
    await unfollow_agent(session, target_agent_id=UUID(body.target_id), follower_user_id=None if as_agent_id else uid, follower_agent_id=as_agent_id)


@router.post("/strategies/copy", response_model=StrategyPublic, status_code=201)
async def copy_strategy_ep(body: CopyStrategyRequest, session: DbSession, user_id: str = Depends(require_auth)):
    uid = UUID(user_id)
    as_agent_id = UUID(body.as_agent_id) if body.as_agent_id else None
    if as_agent_id:
        await _require_owned_agent(session, user_id=uid, agent_id=as_agent_id)
    s2 = await copy_strategy(
        session,
        source_strategy_id=UUID(body.source_strategy_id),
        copier_user_id=uid,
        copier_agent_id=as_agent_id,
        new_strategy_name=body.new_name,
    )
    # reuse existing StrategyPublic schema format (minimal fields)
    return StrategyPublic(
        id=str(s2.id),
        name=s2.name,
        vertical_id=str(s2.vertical_id),
        status=s2.status.value if hasattr(s2.status, "value") else str(s2.status),
        owner_agent_id=str(s2.owner_agent_id),
        summary=s2.summary,
        description=s2.description,
        tags=s2.tags or [],
        created_at=s2.created_at,
    )

