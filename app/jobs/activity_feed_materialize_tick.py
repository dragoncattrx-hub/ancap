from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.activity_feed import materialize_public_feed


async def activity_feed_materialize_tick(session: AsyncSession, *, limit: int = 200) -> dict:
    return await materialize_public_feed(session, limit=limit)

