from __future__ import annotations

from datetime import date

from sqlalchemy import select, func, desc
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import StrategyFollow, AgentFollow, LeaderboardSnapshot


async def recompute_leaderboard_snapshots(session: AsyncSession, *, snapshot_date: date, window: str = "all") -> dict:
    out: dict = {"strategy_followers": 0, "agent_followers": 0}

    # Strategy followers
    r = await session.execute(
        select(StrategyFollow.strategy_id, func.count().label("cnt"))
        .where(StrategyFollow.is_active.is_(True))
        .group_by(StrategyFollow.strategy_id)
        .order_by(desc("cnt"))
        .limit(100)
    )
    rows = r.all()
    for rank, (strategy_id, cnt) in enumerate(rows, start=1):
        stmt = (
            insert(LeaderboardSnapshot)
            .values(
                board_type="strategy_followers",
                subject_type="strategy",
                subject_id=strategy_id,
                window=window,
                rank=rank,
                score=float(cnt),
                components_json={"followers": int(cnt)},
                snapshot_date=snapshot_date,
            )
            .on_conflict_do_update(
                index_elements=["board_type", "subject_type", "subject_id", "window", "snapshot_date"],
                set_={"rank": rank, "score": float(cnt), "components_json": {"followers": int(cnt)}},
            )
        )
        await session.execute(stmt)
        out["strategy_followers"] += 1

    # Agent followers
    r2 = await session.execute(
        select(AgentFollow.target_agent_id, func.count().label("cnt"))
        .where(AgentFollow.is_active.is_(True))
        .group_by(AgentFollow.target_agent_id)
        .order_by(desc("cnt"))
        .limit(100)
    )
    rows2 = r2.all()
    for rank, (agent_id, cnt) in enumerate(rows2, start=1):
        stmt = (
            insert(LeaderboardSnapshot)
            .values(
                board_type="agent_followers",
                subject_type="agent",
                subject_id=str(agent_id),
                window=window,
                rank=rank,
                score=float(cnt),
                components_json={"followers": int(cnt)},
                snapshot_date=snapshot_date,
            )
            .on_conflict_do_update(
                index_elements=["board_type", "subject_type", "subject_id", "window", "snapshot_date"],
                set_={"rank": rank, "score": float(cnt), "components_json": {"followers": int(cnt)}},
            )
        )
        await session.execute(stmt)
        out["agent_followers"] += 1

    return out

