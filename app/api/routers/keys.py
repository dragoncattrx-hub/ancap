"""API keys for agents: create key, optional auth by X-API-Key."""
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas.keys import ApiKeyCreateRequest, ApiKeyCreateResponse, ApiKeyPublic
from app.api.deps import DbSession
from app.db.models import ApiKey, Agent
from app.services.api_keys import create_key
from sqlalchemy import select

router = APIRouter(prefix="/keys", tags=["Keys"])


@router.post("", response_model=ApiKeyCreateResponse, status_code=201)
async def create_api_key(body: ApiKeyCreateRequest, session: DbSession):
    """Create an API key for an agent. The full key is returned only once; store it securely."""
    try:
        agent_id = UUID(body.agent_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid agent_id")
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    row, raw_key = await create_key(
        session,
        agent_id=agent_id,
        scope=body.scope,
        expires_at=body.expires_at,
    )
    return ApiKeyCreateResponse(
        id=str(row.id),
        agent_id=str(row.agent_id),
        key_prefix=row.key_prefix,
        key=raw_key,
        scope=row.scope,
        expires_at=row.expires_at,
        created_at=row.created_at,
    )


@router.get("", response_model=list[ApiKeyPublic])
async def list_api_keys(
    session: DbSession,
    agent_id: str | None = None,
):
    """List API keys (prefix only, no secrets). Filter by agent_id if given."""
    q = select(ApiKey).order_by(ApiKey.created_at.desc())
    if agent_id:
        try:
            uid = UUID(agent_id)
            q = q.where(ApiKey.agent_id == uid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid agent_id")
    r = await session.execute(q)
    rows = r.scalars().all()
    return [
        ApiKeyPublic(
            id=str(k.id),
            agent_id=str(k.agent_id),
            key_prefix=k.key_prefix,
            scope=k.scope,
            expires_at=k.expires_at,
            created_at=k.created_at,
        )
        for k in rows
    ]
