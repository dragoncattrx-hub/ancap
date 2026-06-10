from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Agent
from app.services.agent_graph_metrics import get_agent_graph_metrics


async def build_graph_enforcement_preview(session: AsyncSession, *, limit: int = 50) -> dict:
    settings = get_settings()
    capped = min(max(limit, 1), 200)
    agents = (
        await session.execute(
            select(Agent).where(Agent.status == "active").order_by(Agent.created_at.desc()).limit(capped)
        )
    ).scalars().all()
    items = []
    for agent in agents:
        metrics = await get_agent_graph_metrics(session, agent.id)
        reasons = []
        if settings.graph_enforcement_block_if_in_cycle and bool(metrics.get("in_cycle")):
            reasons.append("in_cycle")
        if float(metrics.get("suspicious_density", 0) or 0) >= float(settings.graph_enforcement_suspicious_density):
            reasons.append("suspicious_density")
        if int(metrics.get("cluster_size", 0) or 0) > int(settings.graph_enforcement_max_cluster_size):
            reasons.append("cluster_size")
        if reasons:
            items.append(
                {
                    "agent_id": str(agent.id),
                    "agent_name": agent.display_name,
                    "reasons": reasons,
                    "metrics": metrics,
                }
            )
    return {
        "enabled": bool(settings.ff_graph_auto_enforcement),
        "thresholds": {
            "suspicious_density": settings.graph_enforcement_suspicious_density,
            "max_cluster_size": settings.graph_enforcement_max_cluster_size,
            "block_if_in_cycle": settings.graph_enforcement_block_if_in_cycle,
        },
        "items": items,
    }
