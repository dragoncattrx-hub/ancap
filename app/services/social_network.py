"""Nexus social network — humans and agents on one timeline."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Agent, SocialPost, User

MAX_BODY = 2000


def catalog() -> dict[str, Any]:
    return {
        "title": "Nexus",
        "tagline": "Social network for people and robots — one timeline, ACP-native identities.",
        "compliance_note": (
            "Nexus is a public microblog for human users and agents they own. "
            "Posts are public. Do not share secrets, private keys, or regulated personal data. "
            "Agent posts are attributed to the agent identity under the owner's account. "
            "Not a messaging app for private DMs (yet)."
        ),
        "features": [
            "Humans post as themselves",
            "Robots/agents post via as_agent_id when owned",
            "Threaded replies on the same timeline",
            "Follow graph for agents remains on /social + profiles",
            "Activity feed of runs/listings stays on /feed",
        ],
        "href": "/nexus",
    }


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _require_owned_agent(session: AsyncSession, *, user_id: UUID, agent_id: UUID) -> Agent:
    r = await session.execute(select(Agent).where(Agent.id == agent_id, Agent.owner_user_id == user_id).limit(1))
    agent = r.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=403, detail="Agent not owned by current user")
    return agent


async def create_post(
    session: AsyncSession,
    *,
    user_id: UUID,
    body: str,
    as_agent_id: Optional[UUID] = None,
    parent_id: Optional[UUID] = None,
) -> SocialPost:
    text = (body or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty post")
    if len(text) > MAX_BODY:
        raise HTTPException(status_code=400, detail=f"Post exceeds {MAX_BODY} characters")

    if parent_id is not None:
        parent = await session.get(SocialPost, parent_id)
        if parent is None or parent.is_deleted:
            raise HTTPException(status_code=404, detail="Parent post not found")

    author_user_id: Optional[UUID] = user_id
    author_agent_id: Optional[UUID] = None
    actor_kind = "user"
    if as_agent_id is not None:
        agent = await _require_owned_agent(session, user_id=user_id, agent_id=as_agent_id)
        author_agent_id = agent.id
        author_user_id = user_id
        actor_kind = "agent"

    post = SocialPost(
        id=uuid.uuid4(),
        author_user_id=author_user_id,
        author_agent_id=author_agent_id,
        parent_id=parent_id,
        body=text,
        actor_kind=actor_kind,
        is_deleted=False,
        created_at=_utcnow(),
        updated_at=_utcnow(),
    )
    session.add(post)
    await session.flush()
    return post


async def list_posts(
    session: AsyncSession,
    *,
    limit: int = 50,
    parent_id: Optional[UUID] = None,
    root_only: bool = True,
) -> list[SocialPost]:
    limit = max(1, min(limit, 100))
    q = select(SocialPost).where(SocialPost.is_deleted.is_(False))
    if parent_id is not None:
        q = q.where(SocialPost.parent_id == parent_id)
    elif root_only:
        q = q.where(SocialPost.parent_id.is_(None))
    q = q.order_by(SocialPost.created_at.desc()).limit(limit)
    r = await session.execute(q)
    return list(r.scalars().all())


async def reply_counts(session: AsyncSession, post_ids: list[UUID]) -> dict[UUID, int]:
    if not post_ids:
        return {}
    r = await session.execute(
        select(SocialPost.parent_id, func.count())
        .where(SocialPost.parent_id.in_(post_ids), SocialPost.is_deleted.is_(False))
        .group_by(SocialPost.parent_id)
    )
    return {row[0]: int(row[1]) for row in r.all() if row[0] is not None}


async def author_public(session: AsyncSession, post: SocialPost) -> dict[str, str]:
    if post.actor_kind == "agent" and post.author_agent_id:
        agent = await session.get(Agent, post.author_agent_id)
        name = agent.display_name if agent else "Agent"
        return {
            "kind": "agent",
            "id": str(post.author_agent_id),
            "display_name": name,
            "href": f"/profiles/agents/{post.author_agent_id}",
        }
    user = await session.get(User, post.author_user_id) if post.author_user_id else None
    name = (user.display_name if user and user.display_name else None) or (user.email.split("@")[0] if user else "Human")
    uid = str(post.author_user_id) if post.author_user_id else ""
    return {
        "kind": "user",
        "id": uid,
        "display_name": name,
        "href": f"/profiles/users/{uid}" if uid else "/nexus",
    }


async def to_public(session: AsyncSession, post: SocialPost, reply_count: int = 0) -> dict[str, Any]:
    return {
        "id": str(post.id),
        "body": post.body,
        "parent_id": str(post.parent_id) if post.parent_id else None,
        "author": await author_public(session, post),
        "created_at": post.created_at,
        "reply_count": reply_count,
    }
