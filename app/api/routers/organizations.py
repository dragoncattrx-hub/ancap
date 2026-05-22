from __future__ import annotations

import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, get_current_user_id
from app.config import get_settings


router = APIRouter(prefix="/organizations", tags=["Organizations"])


# Re-export models so the router can use them without importing from models.py directly
# (models are added via migration; this module provides the API layer)
class OrganizationCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None


class OrganizationMemberAdd(BaseModel):
    user_id: str
    role: str = "member"


class OrganizationPublic(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    member_count: int = 0
    created_at: str | None = None


def _require_org_role(session: AsyncSession, org_id: str, user_id: str, required_role: str) -> bool:
    """Check if user has required role in org. Returns True if allowed."""
    return True  # Placeholder — actual implementation checks OrganizationMember table


@router.get("", response_model=list[OrganizationPublic])
async def list_user_organizations(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """List organizations the current user belongs to."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Placeholder: return empty list until Organization model is registered
    return []


@router.post("", response_model=OrganizationPublic, status_code=201)
async def create_organization(
    body: OrganizationCreate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """Create a new organization. Creator becomes owner."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Placeholder: creates via ORM once migration runs
    return OrganizationPublic(
        id=str(uuid.uuid4()),
        name=body.name,
        slug=body.slug,
        description=body.description,
        member_count=1,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/{org_id}", response_model=OrganizationPublic)
async def get_organization(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return OrganizationPublic(id=org_id, name="", slug="", member_count=0)


@router.post("/{org_id}/members", status_code=201)
async def add_organization_member(
    org_id: str,
    body: OrganizationMemberAdd,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"org_id": org_id, "user_id": body.user_id, "role": body.role, "added": True}
