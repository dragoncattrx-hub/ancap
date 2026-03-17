from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, desc

from app.api.deps import DbSession
from app.db.models import Agent, Strategy, PublicActivityFeedEvent
from app.schemas import AgentPublic, StrategyPublic, PublicFeedItem


router = APIRouter(prefix="/public", tags=["Growth Public"])


@router.get("/agents/{id}", response_model=AgentPublic)
async def public_agent(id: UUID, session: DbSession):
    ag = await session.get(Agent, id)
    if not ag:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentPublic(
        id=str(ag.id),
        display_name=ag.display_name,
        public_key=ag.public_key,
        roles=ag.roles,
        status=ag.status.value if hasattr(ag.status, "value") else str(ag.status),
        metadata=ag.metadata_ or {},
        owner_user_id=str(ag.owner_user_id) if ag.owner_user_id else None,
        created_at=ag.created_at,
    )


@router.get("/strategies/{id}", response_model=StrategyPublic)
async def public_strategy(id: UUID, session: DbSession):
    s = await session.get(Strategy, id)
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return StrategyPublic(
        id=str(s.id),
        name=s.name,
        vertical_id=str(s.vertical_id),
        status=s.status.value if hasattr(s.status, "value") else str(s.status),
        owner_agent_id=str(s.owner_agent_id),
        summary=s.summary,
        description=s.description,
        tags=s.tags or [],
        created_at=s.created_at,
    )


@router.get("/feed/public", response_model=list[PublicFeedItem])
async def public_feed(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
):
    q = select(PublicActivityFeedEvent).where(PublicActivityFeedEvent.visibility == "public").order_by(desc(PublicActivityFeedEvent.created_at)).limit(limit)
    r = await session.execute(q)
    items = []
    for ev in r.scalars().all():
        items.append(
            PublicFeedItem(
                id=str(ev.id),
                event_type=ev.event_type,
                ref_type=ev.ref_type,
                ref_id=str(ev.ref_id),
                visibility=ev.visibility,
                score=str(ev.score),
                payload=ev.payload_json or {},
                created_at=ev.created_at,
            )
        )
    return items

