"""Reputation 2.0 tick: batch recompute trust_score + reputation_snapshots for recently active subjects."""
from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ReputationEvent
from app.jobs.reputation_recompute import recompute_for_subject


async def reputation_tick(
    session: AsyncSession,
    max_subjects: int = 50,
    since_days: int = 7,
    commit: bool = False,
) -> dict:
    """
    Find subjects (subject_type, subject_id) with reputation_events in the last since_days,
    ordered by most recent event; recompute trust_score and reputation_snapshot for each.
    Returns { "recomputed": int }.
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=since_days)
    # Subjects with events in window, ordered by latest event (most recently active first)
    subq = (
        select(
            ReputationEvent.subject_type,
            ReputationEvent.subject_id,
            func.max(ReputationEvent.created_at).label("last_ev"),
        )
        .where(ReputationEvent.created_at >= since)
        .group_by(ReputationEvent.subject_type, ReputationEvent.subject_id)
        .order_by(func.max(ReputationEvent.created_at).desc())
        .limit(max_subjects)
    )
    r = await session.execute(subq)
    rows = r.all()
    recomputed = 0
    for subject_type, subject_id, _ in rows:
        try:
            sid = subject_id if isinstance(subject_id, UUID) else UUID(str(subject_id))
            await recompute_for_subject(
                session,
                subject_type,
                sid,
                now=now,
                commit=False,
            )
            recomputed += 1
        except Exception:
            continue
    if commit:
        await session.commit()
    return {"recomputed": recomputed}
