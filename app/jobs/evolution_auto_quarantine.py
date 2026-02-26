"""L3: Self-evolution — auto-quarantine agents by low reputation or graph flags."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TrustScore, Agent, AgentStatusEnum


async def auto_quarantine_tick(session: AsyncSession, *, window: str = "90d", threshold: float = 0.2) -> int:
    """
    Set agent status to quarantined when trust_score below threshold.
    Returns number of agents quarantined this tick.
    """
    r = await session.execute(
        select(TrustScore).where(TrustScore.window == window, TrustScore.trust_score < threshold)
    )
    low_trust = r.scalars().all()
    quarantined = 0
    for ts in low_trust:
        if ts.subject_type != "agent":
            continue
        agent = await session.get(Agent, ts.subject_id)
        if not agent or agent.status == AgentStatusEnum.quarantined:
            continue
        agent.status = AgentStatusEnum.quarantined
        quarantined += 1
    return quarantined
