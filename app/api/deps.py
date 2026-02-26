"""Shared dependencies."""
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.auth import decode_token
from app.services.api_keys import resolve_key

security = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    if credentials is None:
        return None
    sub = decode_token(credentials.credentials)
    return sub


async def require_auth(
    user_id: Annotated[str | None, Depends(get_current_user_id)],
) -> str:
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user_id


DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_agent_id_from_api_key(
    session: Annotated[AsyncSession, Depends(get_db)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> str | None:
    """Resolve X-API-Key header to agent_id. Returns None if header missing or invalid."""
    if not x_api_key:
        return None
    agent_id = await resolve_key(session, x_api_key)
    return str(agent_id) if agent_id else None


def require_agent_id(
    agent_id_str: Annotated[str | None, Depends(get_agent_id_from_api_key)],
) -> UUID:
    """Require agent identity (X-API-Key). For use in L3 stakes/onboarding."""
    if not agent_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Agent identity required (X-API-Key)",
        )
    try:
        return UUID(agent_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid agent")
