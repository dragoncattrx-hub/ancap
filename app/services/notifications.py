from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, update, desc
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import NotificationEvent


async def create_notification(
    session: AsyncSession,
    *,
    recipient_user_id: UUID | None,
    recipient_agent_id: UUID | None,
    type: str,
    payload: dict,
    priority: str = "normal",
    dedupe_key: str | None = None,
) -> NotificationEvent:
    if recipient_user_id is None and recipient_agent_id is None:
        raise HTTPException(status_code=400, detail="recipient_user_id or recipient_agent_id required")
    if dedupe_key:
        stmt = (
            insert(NotificationEvent)
            .values(
                recipient_user_id=recipient_user_id,
                recipient_agent_id=recipient_agent_id,
                type=type,
                priority=priority,
                payload_json=payload,
                dedupe_key=dedupe_key,
                is_read=False,
            )
            .on_conflict_do_nothing(index_elements=["dedupe_key"])
            .returning(NotificationEvent.id)
        )
        r = await session.execute(stmt)
        new_id = r.scalar_one_or_none()
        if new_id:
            rr = await session.execute(select(NotificationEvent).where(NotificationEvent.id == new_id))
            return rr.scalar_one()
        # already exists
        rr = await session.execute(select(NotificationEvent).where(NotificationEvent.dedupe_key == dedupe_key))
        return rr.scalar_one()

    ev = NotificationEvent(
        recipient_user_id=recipient_user_id,
        recipient_agent_id=recipient_agent_id,
        type=type,
        priority=priority,
        payload_json=payload,
        is_read=False,
        dedupe_key=None,
    )
    session.add(ev)
    await session.flush()
    return ev


async def list_notifications(
    session: AsyncSession,
    *,
    recipient_user_id: UUID | None,
    recipient_agent_id: UUID | None,
    limit: int = 50,
) -> list[NotificationEvent]:
    q = select(NotificationEvent).order_by(desc(NotificationEvent.created_at)).limit(limit)
    if recipient_user_id is not None:
        q = q.where(NotificationEvent.recipient_user_id == recipient_user_id)
    elif recipient_agent_id is not None:
        q = q.where(NotificationEvent.recipient_agent_id == recipient_agent_id)
    else:
        raise HTTPException(status_code=400, detail="recipient_user_id or recipient_agent_id required")
    r = await session.execute(q)
    return list(r.scalars().all())


async def mark_notification_read(session: AsyncSession, *, notification_id: UUID) -> None:
    await session.execute(
        update(NotificationEvent).where(NotificationEvent.id == notification_id).values(is_read=True, read_at=datetime.utcnow())
    )

