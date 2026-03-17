from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.leaderboards import recompute_leaderboard_snapshots


async def leaderboard_recompute_tick(session: AsyncSession) -> dict:
    d = datetime.now(timezone.utc).date()
    return await recompute_leaderboard_snapshots(session, snapshot_date=d, window="all")

