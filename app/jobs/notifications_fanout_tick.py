from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


async def notifications_fanout_tick(session: AsyncSession, *, max_events: int = 500) -> dict:
    # v1: notifications are created directly; fanout is a placeholder for future (followers, watchlists).
    return {"processed": 0, "max_events": max_events}

