from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas import ModerationActionRequest
from app.schemas.moderation import AgentLinkCreateRequest
from app.api.deps import DbSession
from app.config import get_settings
from app.db.models import AgentLink, Agent
from app.services.agent_graph_metrics import get_agent_graph_metrics
from sqlalchemy import select

router = APIRouter(prefix="/moderation", tags=["Moderation"])


@router.get("/graph-enforcement/preview")
async def graph_enforcement_preview(session: DbSession, limit: int = 50):
    """Preview which active agents would be auto-quarantined by current graph thresholds."""
    settings = get_settings()
    q = (
        select(Agent)
        .where(Agent.status == "active")
        .order_by(Agent.created_at.desc())
        .limit(min(max(limit, 1), 200))
    )
    agents = (await session.execute(q)).scalars().all()
    items = []
    for a in agents:
        metrics = await get_agent_graph_metrics(session, a.id)
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
                    "agent_id": str(a.id),
                    "agent_name": a.display_name,
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


@router.get("/agents/{agent_id}/graph-context")
async def get_agent_graph_context(agent_id: UUID, session: DbSession, approximate: bool = False):
    """ROADMAP 2.1: Graph metrics + flags for moderation (in_cycle, suspicious_density_high, large_cluster)."""
    agent = await session.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    metrics = await get_agent_graph_metrics(session, agent_id, approximate=approximate)
    flags = {
        "in_cycle": bool(metrics.get("in_cycle")),
        "suspicious_density_high": float(metrics.get("suspicious_density", 0) or 0) >= 0.5,
        "large_cluster": int(metrics.get("cluster_size", 0) or 0) > 10,
    }
    return {"metrics": metrics, "flags": flags}


@router.post("/actions")
async def apply_moderation_action(body: ModerationActionRequest, session: DbSession):
    from app.services.reputation_events import on_moderation_action
    try:
        await on_moderation_action(
            session,
            target_type=body.target_type,
            target_id=body.target_id,
            action=body.action,
            reason=body.reason,
        )
    except Exception:
        pass
    # L3: slashing when moderating an agent
    if body.target_type == "agent" and body.action in ("suspend", "quarantine", "reject"):
        settings = get_settings()
        if settings.moderation_slash_amount and Decimal(settings.moderation_slash_amount) > 0:
            try:
                from app.services.stakes import slash_agent
                await slash_agent(
                    session,
                    agent_id=UUID(body.target_id),
                    amount_currency=settings.moderation_slash_currency,
                    amount_value=Decimal(settings.moderation_slash_amount),
                    reason=f"moderation:{body.action}" + (f": {body.reason}" if body.reason else ""),
                )
            except Exception:
                pass
    return {"ok": True}


@router.post("/agent-links", status_code=201)
async def create_agent_link(body: AgentLinkCreateRequest, session: DbSession):
    agent_id = UUID(body.agent_id)
    linked_id = UUID(body.linked_agent_id)
    if agent_id == linked_id:
        raise HTTPException(status_code=400, detail="agent_id and linked_agent_id must differ")
    existing = await session.execute(
        select(AgentLink).where(
            ((AgentLink.agent_id == agent_id) & (AgentLink.linked_agent_id == linked_id))
            | ((AgentLink.agent_id == linked_id) & (AgentLink.linked_agent_id == agent_id))
        ).limit(1)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Link already exists")
    link = AgentLink(
        agent_id=agent_id,
        linked_agent_id=linked_id,
        link_type=body.link_type,
        confidence=body.confidence,
    )
    session.add(link)
    await session.flush()
    return {"id": str(link.id), "agent_id": body.agent_id, "linked_agent_id": body.linked_agent_id, "link_type": body.link_type}
