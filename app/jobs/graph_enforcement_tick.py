from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Agent, AgentStatusEnum
from app.services.agent_graph_metrics import get_agent_graph_metrics


async def graph_enforcement_tick(session: AsyncSession, *, max_agents: int = 200) -> dict:
    """
    Automatic graph policy enforcement (Wave 2).
    Quarantines active agents when graph risk thresholds are exceeded.
    """
    s = get_settings()
    if not s.ff_graph_auto_enforcement:
        return {"enabled": False, "evaluated": 0, "quarantined": 0}

    q = (
        select(Agent)
        .where(Agent.status == AgentStatusEnum.active)
        .order_by(Agent.created_at.desc())
        .limit(max_agents)
    )
    rows = (await session.execute(q)).scalars().all()
    evaluated = 0
    quarantined = 0
    reasons: dict[str, int] = {"in_cycle": 0, "suspicious_density": 0, "cluster_size": 0}

    for agent in rows:
        evaluated += 1
        metrics = await get_agent_graph_metrics(session, agent.id)
        hit_reasons: list[str] = []

        if s.graph_enforcement_block_if_in_cycle and bool(metrics.get("in_cycle")):
            hit_reasons.append("in_cycle")
        if float(metrics.get("suspicious_density", 0) or 0) >= float(s.graph_enforcement_suspicious_density):
            hit_reasons.append("suspicious_density")
        if int(metrics.get("cluster_size", 0) or 0) > int(s.graph_enforcement_max_cluster_size):
            hit_reasons.append("cluster_size")

        if not hit_reasons:
            continue

        for r in hit_reasons:
            reasons[r] = reasons.get(r, 0) + 1
        agent.status = AgentStatusEnum.quarantined
        quarantined += 1
        session.add(agent)

    await session.flush()
    return {
        "enabled": True,
        "evaluated": evaluated,
        "quarantined": quarantined,
        "reason_hits": reasons,
        "thresholds": {
            "suspicious_density": s.graph_enforcement_suspicious_density,
            "max_cluster_size": s.graph_enforcement_max_cluster_size,
            "block_if_in_cycle": s.graph_enforcement_block_if_in_cycle,
        },
    }

