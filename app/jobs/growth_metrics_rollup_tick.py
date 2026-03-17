from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.growth_metrics import rollup_daily_metrics


async def growth_metrics_rollup_tick(session: AsyncSession) -> dict:
    d = datetime.now(timezone.utc).date()
    return await rollup_daily_metrics(session, for_date=d)

