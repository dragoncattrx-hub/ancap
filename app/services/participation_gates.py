from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ReputationSnapshot, Stake, StakeStatusEnum, TrustScore
from app.services.agent_graph_metrics import get_agent_graph_metrics


@dataclass
class GateDecision:
    ok: bool
    tier: int
    reason_code: str | None = None
    detail: str | None = None
    metrics: dict | None = None


MIN_STAKE_TIER_1 = Decimal("25")
MIN_STAKE_TIER_2 = Decimal("100")
MIN_TRUST_TIER_1 = 0.25
MIN_TRUST_TIER_2 = 0.45
MIN_REPUTATION_TIER_1 = 20.0
MIN_REPUTATION_TIER_2 = 45.0
MAX_RECIPROCITY = 0.85
MAX_SUSPICIOUS_DENSITY = 0.45


async def _active_stake_acp(session: AsyncSession, agent_id: UUID) -> Decimal:
    q = select(func.coalesce(func.sum(Stake.amount_value), 0)).where(
        Stake.agent_id == agent_id,
        Stake.status == StakeStatusEnum.active,
        Stake.amount_currency == "ACP",
    )
    r = await session.execute(q)
    return Decimal(r.scalar() or 0)


async def _trust_score(session: AsyncSession, agent_id: UUID) -> float:
    q = (
        select(TrustScore)
        .where(
            TrustScore.subject_type == "agent",
            TrustScore.subject_id == agent_id,
            TrustScore.window == "90d",
            TrustScore.algo_version == "trust2-v1",
        )
        .order_by(desc(TrustScore.computed_at))
        .limit(1)
    )
    r = await session.execute(q)
    row = r.scalar_one_or_none()
    return float(row.trust_score) if row and row.trust_score is not None else 0.0


async def _reputation_score(session: AsyncSession, agent_id: UUID) -> float:
    q = (
        select(ReputationSnapshot)
        .where(
            ReputationSnapshot.subject_type == "agent",
            ReputationSnapshot.subject_id == agent_id,
            ReputationSnapshot.window == "90d",
            ReputationSnapshot.algo_version == "rep2-v1",
        )
        .order_by(desc(ReputationSnapshot.computed_at))
        .limit(1)
    )
    r = await session.execute(q)
    row = r.scalar_one_or_none()
    return float(row.score) if row and row.score is not None else 0.0


def _tier_for(stake_acp: Decimal, trust: float, rep: float) -> int:
    if stake_acp >= MIN_STAKE_TIER_2 and trust >= MIN_TRUST_TIER_2 and rep >= MIN_REPUTATION_TIER_2:
        return 2
    if stake_acp >= MIN_STAKE_TIER_1 and trust >= MIN_TRUST_TIER_1 and rep >= MIN_REPUTATION_TIER_1:
        return 1
    return 0


async def evaluate_agent_gate(session: AsyncSession, agent_id: UUID) -> GateDecision:
    # Test-only escape hatch. Defaults to enabled in production via Settings.
    # Imported lazily so this module stays cheap to load and the flag can be
    # flipped via env var (PARTICIPATION_GATES_ENABLED=false) without restarting
    # any module-level cache.
    from app.config import get_settings

    if not get_settings().participation_gates_enabled:
        return GateDecision(True, 2, metrics={"tier": 2, "gates_enabled": False})

    stake_acp = await _active_stake_acp(session, agent_id)
    trust = await _trust_score(session, agent_id)
    rep = await _reputation_score(session, agent_id)
    graph = await get_agent_graph_metrics(session, agent_id)
    tier = _tier_for(stake_acp, trust, rep)
    metrics = {
        "tier": tier,
        "stake_acp": str(stake_acp),
        "trust_score": round(trust, 4),
        "reputation_score": round(rep, 4),
        "reciprocity_score": graph.get("reciprocity_score", 0.0),
        "suspicious_density": graph.get("suspicious_density", 0.0),
        "in_cycle": bool(graph.get("in_cycle", False)),
    }

    if graph.get("in_cycle"):
        return GateDecision(False, tier, "GATE_CYCLE_BLOCK", "Agent is in cycle graph pattern", metrics)
    if float(graph.get("reciprocity_score", 0.0) or 0.0) >= MAX_RECIPROCITY:
        return GateDecision(False, tier, "GATE_RECIPROCITY_HIGH", "Reciprocity score exceeds limit", metrics)
    if float(graph.get("suspicious_density", 0.0) or 0.0) >= MAX_SUSPICIOUS_DENSITY:
        return GateDecision(False, tier, "GATE_SUSPICIOUS_DENSITY_HIGH", "Suspicious density exceeds limit", metrics)
    if tier < 1:
        return GateDecision(False, tier, "GATE_TIER_TOO_LOW", "Tier 1 required (stake/trust/reputation)", metrics)
    return GateDecision(True, tier, metrics=metrics)
