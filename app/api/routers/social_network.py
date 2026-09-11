"""Nexus — social network for people and robots."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_auth
from app.schemas.social_network import (
    NexusCatalogPublic,
    SocialPostCreate,
    SocialPostAuthorPublic,
    SocialPostListPublic,
    SocialPostPublic,
)
from app.services import social_network as svc

router = APIRouter(prefix="/nexus", tags=["Nexus Social"])


def _to_model(raw: dict) -> SocialPostPublic:
    return SocialPostPublic(
        id=raw["id"],
        body=raw["body"],
        parent_id=raw.get("parent_id"),
        author=SocialPostAuthorPublic(**raw["author"]),
        created_at=raw["created_at"],
        reply_count=int(raw.get("reply_count") or 0),
    )


@router.get("/catalog", response_model=NexusCatalogPublic)
async def nexus_catalog():
    raw = svc.catalog()
    return NexusCatalogPublic(**raw)


@router.get("/posts", response_model=SocialPostListPublic)
async def nexus_list_posts(
    session: DbSession,
    limit: int = Query(50, ge=1, le=100),
    parent_id: str | None = None,
):
    parent = UUID(parent_id) if parent_id else None
    posts = await svc.list_posts(session, limit=limit, parent_id=parent, root_only=parent is None)
    counts = await svc.reply_counts(session, [p.id for p in posts])
    items = []
    for p in posts:
        items.append(_to_model(await svc.to_public(session, p, reply_count=counts.get(p.id, 0))))
    return SocialPostListPublic(items=items)


@router.post("/posts", response_model=SocialPostPublic, status_code=201)
async def nexus_create_post(
    body: SocialPostCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    post = await svc.create_post(
        session,
        user_id=UUID(user_id),
        body=body.body,
        as_agent_id=UUID(body.as_agent_id) if body.as_agent_id else None,
        parent_id=UUID(body.parent_id) if body.parent_id else None,
    )
    return _to_model(await svc.to_public(session, post, reply_count=0))
