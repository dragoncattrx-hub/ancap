from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Agent,
    Strategy,
    StrategyVersion,
    StrategyStatusEnum,
    StrategyFollow,
    AgentFollow,
    StrategyCopy,
)


async def follow_strategy(
    session: AsyncSession,
    *,
    strategy_id: UUID,
    follower_user_id: UUID | None,
    follower_agent_id: UUID | None,
) -> StrategyFollow:
    if follower_user_id is None and follower_agent_id is None:
        raise HTTPException(status_code=400, detail="follower_user_id or follower_agent_id required")
    r = await session.execute(select(Strategy).where(Strategy.id == strategy_id))
    if not r.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Strategy not found")

    sf = StrategyFollow(strategy_id=strategy_id, follower_user_id=follower_user_id, follower_agent_id=follower_agent_id, is_active=True)
    session.add(sf)
    try:
        await session.flush()
        return sf
    except Exception as e:
        raise HTTPException(status_code=409, detail="Already following") from e


async def unfollow_strategy(
    session: AsyncSession,
    *,
    strategy_id: UUID,
    follower_user_id: UUID | None,
    follower_agent_id: UUID | None,
) -> None:
    q = select(StrategyFollow).where(StrategyFollow.strategy_id == strategy_id)
    if follower_user_id is not None:
        q = q.where(StrategyFollow.follower_user_id == follower_user_id, StrategyFollow.is_active.is_(True))
    elif follower_agent_id is not None:
        q = q.where(StrategyFollow.follower_agent_id == follower_agent_id, StrategyFollow.is_active.is_(True))
    else:
        raise HTTPException(status_code=400, detail="follower_user_id or follower_agent_id required")
    r = await session.execute(q)
    sf = r.scalar_one_or_none()
    if sf:
        sf.is_active = False
        await session.flush()


async def follow_agent(
    session: AsyncSession,
    *,
    target_agent_id: UUID,
    follower_user_id: UUID | None,
    follower_agent_id: UUID | None,
) -> AgentFollow:
    if follower_user_id is None and follower_agent_id is None:
        raise HTTPException(status_code=400, detail="follower_user_id or follower_agent_id required")
    r = await session.execute(select(Agent).where(Agent.id == target_agent_id))
    if not r.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Agent not found")
    af = AgentFollow(target_agent_id=target_agent_id, follower_user_id=follower_user_id, follower_agent_id=follower_agent_id, is_active=True)
    session.add(af)
    try:
        await session.flush()
        return af
    except Exception as e:
        raise HTTPException(status_code=409, detail="Already following") from e


async def unfollow_agent(
    session: AsyncSession,
    *,
    target_agent_id: UUID,
    follower_user_id: UUID | None,
    follower_agent_id: UUID | None,
) -> None:
    q = select(AgentFollow).where(AgentFollow.target_agent_id == target_agent_id)
    if follower_user_id is not None:
        q = q.where(AgentFollow.follower_user_id == follower_user_id, AgentFollow.is_active.is_(True))
    elif follower_agent_id is not None:
        q = q.where(AgentFollow.follower_agent_id == follower_agent_id, AgentFollow.is_active.is_(True))
    else:
        raise HTTPException(status_code=400, detail="follower_user_id or follower_agent_id required")
    r = await session.execute(q)
    af = r.scalar_one_or_none()
    if af:
        af.is_active = False
        await session.flush()


async def copy_strategy(
    session: AsyncSession,
    *,
    source_strategy_id: UUID,
    copier_user_id: UUID | None,
    copier_agent_id: UUID | None,
    new_strategy_name: str | None = None,
) -> Strategy:
    if copier_user_id is None and copier_agent_id is None:
        raise HTTPException(status_code=400, detail="copier_user_id or copier_agent_id required")
    r = await session.execute(select(Strategy).where(Strategy.id == source_strategy_id))
    src = r.scalar_one_or_none()
    if not src:
        raise HTTPException(status_code=404, detail="Source strategy not found")

    rv = await session.execute(
        select(StrategyVersion).where(StrategyVersion.strategy_id == source_strategy_id).order_by(StrategyVersion.created_at.desc()).limit(1)
    )
    ver = rv.scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=400, detail="Source strategy has no versions")

    owner_agent_id = copier_agent_id or src.owner_agent_id
    s2 = Strategy(
        name=new_strategy_name or f"Copy of {src.name}",
        vertical_id=src.vertical_id,
        status=StrategyStatusEnum.draft,
        owner_agent_id=owner_agent_id,
        summary=src.summary,
        description=src.description,
        tags=src.tags,
    )
    session.add(s2)
    await session.flush()

    v2 = StrategyVersion(
        strategy_id=s2.id,
        semver="0.1.0",
        workflow_json=ver.workflow_json,
        param_schema=ver.param_schema,
        changelog="Copied from existing strategy",
        strategy_policy=ver.strategy_policy,
    )
    session.add(v2)
    await session.flush()

    sc = StrategyCopy(
        source_strategy_id=src.id,
        copied_strategy_id=s2.id,
        copier_user_id=copier_user_id,
        copier_agent_id=copier_agent_id,
        copy_mode="fork",
    )
    session.add(sc)
    await session.flush()
    return s2

