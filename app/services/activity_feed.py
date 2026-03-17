from __future__ import annotations

from datetime import timezone
from uuid import UUID

from sqlalchemy import select, and_, or_, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Run, RunStateEnum, StrategyCopy, PublicActivityFeedEvent
from app.jobs.watermark import TsIdWatermark, get_ts_id_watermark, set_ts_id_watermark


RUNS_WM_KEY = "growth_feed_runs_v1"
COPIES_WM_KEY = "growth_feed_strategy_copies_v1"


async def materialize_public_feed(session: AsyncSession, *, limit: int = 200) -> dict:
    out: dict = {"runs": 0, "strategy_copies": 0}

    # Runs (only succeeded; simple visibility rule: exclude if actor missing)
    wm = await get_ts_id_watermark(session, RUNS_WM_KEY)
    q = select(Run).where(Run.state == RunStateEnum.succeeded).order_by(asc(Run.created_at), asc(Run.id)).limit(limit)
    if wm:
        q = q.where(or_(Run.created_at > wm.ts, and_(Run.created_at == wm.ts, Run.id > UUID(wm.id))))
    r = await session.execute(q)
    rows = list(r.scalars().all())
    for run in rows:
        session.add(
            PublicActivityFeedEvent(
                actor_agent_id=None,
                actor_user_id=None,
                event_type="run_succeeded",
                ref_type="run",
                ref_id=run.id,
                visibility="public",
                score=1,
                payload_json={"run_id": str(run.id), "strategy_version_id": str(run.strategy_version_id)},
            )
        )
        out["runs"] += 1
    if rows:
        last = rows[-1]
        ts = last.created_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        await set_ts_id_watermark(session, RUNS_WM_KEY, TsIdWatermark(ts=ts, id=str(last.id)))

    # Strategy copies
    wm2 = await get_ts_id_watermark(session, COPIES_WM_KEY)
    q2 = select(StrategyCopy).order_by(asc(StrategyCopy.created_at), asc(StrategyCopy.id)).limit(limit)
    if wm2:
        q2 = q2.where(or_(StrategyCopy.created_at > wm2.ts, and_(StrategyCopy.created_at == wm2.ts, StrategyCopy.id > UUID(wm2.id))))
    r2 = await session.execute(q2)
    copies = list(r2.scalars().all())
    for sc in copies:
        session.add(
            PublicActivityFeedEvent(
                actor_agent_id=sc.copier_agent_id,
                actor_user_id=sc.copier_user_id,
                event_type="strategy_copied",
                ref_type="strategy",
                ref_id=sc.copied_strategy_id,
                visibility="public",
                score=2,
                payload_json={
                    "source_strategy_id": str(sc.source_strategy_id),
                    "copied_strategy_id": str(sc.copied_strategy_id),
                },
            )
        )
        out["strategy_copies"] += 1
    if copies:
        last2 = copies[-1]
        ts = last2.created_at
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        await set_ts_id_watermark(session, COPIES_WM_KEY, TsIdWatermark(ts=ts, id=str(last2.id)))

    return out

