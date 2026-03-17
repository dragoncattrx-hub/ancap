from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StarterPack, StarterPackAssignment


DEFAULT_STARTER_PACK_CODE = "default"


async def ensure_default_starter_pack(session: AsyncSession) -> StarterPack:
    r = await session.execute(select(StarterPack).where(StarterPack.code == DEFAULT_STARTER_PACK_CODE))
    sp = r.scalar_one_or_none()
    if sp:
        return sp
    sp = StarterPack(
        code=DEFAULT_STARTER_PACK_CODE,
        name="Default Starter Pack",
        is_active=True,
        config_json={
            "faucet": {"enabled": True},
            "quickstart": {"enabled": True},
            "tasks_seed": True,
        },
    )
    session.add(sp)
    await session.flush()
    return sp


async def assign_starter_pack(
    session: AsyncSession,
    *,
    user_id: UUID | None,
    agent_id: UUID | None,
    starter_pack_code: str = DEFAULT_STARTER_PACK_CODE,
) -> StarterPackAssignment:
    if user_id is None and agent_id is None:
        raise HTTPException(status_code=400, detail="user_id or agent_id required")

    r = await session.execute(select(StarterPack).where(StarterPack.code == starter_pack_code, StarterPack.is_active.is_(True)))
    sp = r.scalar_one_or_none()
    if not sp:
        sp = await ensure_default_starter_pack(session)

    # best-effort idempotency: prefer user_id, fall back to agent_id
    q = select(StarterPackAssignment).where(StarterPackAssignment.starter_pack_id == sp.id)
    if user_id is not None:
        q = q.where(StarterPackAssignment.user_id == user_id)
    elif agent_id is not None:
        q = q.where(StarterPackAssignment.agent_id == agent_id)
    rr = await session.execute(q)
    existing = rr.scalar_one_or_none()
    if existing:
        return existing

    a = StarterPackAssignment(
        starter_pack_id=sp.id,
        user_id=user_id,
        agent_id=agent_id,
        status="assigned",
    )
    session.add(a)
    await session.flush()
    return a


async def activate_starter_pack(
    session: AsyncSession,
    *,
    assignment_id: UUID,
) -> StarterPackAssignment:
    r = await session.execute(select(StarterPackAssignment).where(StarterPackAssignment.id == assignment_id))
    a = r.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Starter pack assignment not found")
    if a.status == "activated":
        return a
    a.status = "activated"
    a.activated_at = datetime.utcnow()
    await session.flush()
    return a

