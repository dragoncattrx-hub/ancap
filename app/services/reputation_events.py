"""Reputation 2.0: emit events and upsert edges. Domain hooks — call from routers/jobs."""
from datetime import date, datetime
from uuid import UUID

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    ReputationEvent,
    ReputationEventTypeEnum,
    RelationshipEdgeDaily,
    EdgeTypeEnum,
)


async def emit_reputation_event(
    session: AsyncSession,
    *,
    subject_type: str,
    subject_id: UUID,
    actor_type: str,
    actor_id: UUID | None,
    event_type: str | ReputationEventTypeEnum,
    value: float,
    meta: dict | None = None,
    created_at: datetime | None = None,
) -> None:
    """Append one reputation event. No commit — caller commits. MVP value norms: order_fulfilled 1.0, run_completed 0.3/-0.3, evaluation_scored 0..1, moderation -0.2..-1.0."""
    if isinstance(event_type, ReputationEventTypeEnum):
        event_type = event_type.value
    session.add(
        ReputationEvent(
            subject_type=subject_type,
            subject_id=subject_id,
            actor_type=actor_type,
            actor_id=actor_id,
            event_type=event_type,
            value=value,
            meta=meta or {},
            created_at=created_at or datetime.utcnow(),
        )
    )


async def upsert_edge_daily(
    session: AsyncSession,
    *,
    day: date,
    src_type: str,
    src_id: UUID,
    dst_type: str,
    dst_id: UUID,
    edge_type: str | EdgeTypeEnum,
    count_delta: int = 1,
    amount_delta: float = 0,
    unique_ref_id: UUID | None = None,
    meta: dict | None = None,
) -> None:
    """Upsert one row in relationship_edges_daily. Key: (day, src, dst, edge_type)."""
    if isinstance(edge_type, EdgeTypeEnum):
        edge_type = edge_type.value
    # PostgreSQL: INSERT ... ON CONFLICT (day, src_type, src_id, dst_type, dst_id, edge_type)
    # DO UPDATE SET count = relationship_edges_daily.count + EXCLUDED.count, ...
    stmt = insert(RelationshipEdgeDaily).values(
        day=day,
        src_type=src_type,
        src_id=src_id,
        dst_type=dst_type,
        dst_id=dst_id,
        edge_type=edge_type,
        count=count_delta,
        amount_sum=amount_delta,
        unique_refs=1 if unique_ref_id else 0,
        meta=meta or {},
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["day", "src_type", "src_id", "dst_type", "dst_id", "edge_type"],
        set_={
            "count": RelationshipEdgeDaily.count + stmt.excluded.count,
            "amount_sum": (RelationshipEdgeDaily.amount_sum or 0) + stmt.excluded.amount_sum,
            "unique_refs": RelationshipEdgeDaily.unique_refs + stmt.excluded.unique_refs,
        },
    )
    await session.execute(stmt)


# --- Domain hooks (MVP value norms: stable score) ---

def _uuid(s: str | UUID) -> UUID:
    return s if isinstance(s, UUID) else UUID(s)


async def on_order_fulfilled(
    session: AsyncSession,
    *,
    order_id: UUID,
    buyer_id: UUID,
    seller_agent_id: UUID,
    amount_value: str | float,
    amount_currency: str | None,
    created_at: datetime | None = None,
) -> None:
    """Seller gets +1.0 (marketplace quality). Buyer gets nothing in MVP to avoid self-boost."""
    await emit_reputation_event(
        session,
        subject_type="agent",
        subject_id=_uuid(seller_agent_id),
        actor_type="agent",
        actor_id=_uuid(buyer_id),
        event_type=ReputationEventTypeEnum.order_fulfilled,
        value=1.0,
        meta={
            "order_id": str(order_id),
            "amount": float(amount_value or 0),
            "currency": amount_currency,
            "buyer_id": str(buyer_id),
            "seller_id": str(seller_agent_id),
        },
        created_at=created_at,
    )


async def on_run_completed(
    session: AsyncSession,
    *,
    run_id: UUID,
    strategy_version_id: UUID,
    ok: bool,
    pool_id: UUID | None = None,
    created_at: datetime | None = None,
) -> None:
    """+0.3 success / -0.3 failure. Subject = strategy_version."""
    await emit_reputation_event(
        session,
        subject_type="strategy_version",
        subject_id=_uuid(strategy_version_id),
        actor_type="system",
        actor_id=None,
        event_type=ReputationEventTypeEnum.run_completed,
        value=0.3 if ok else -0.3,
        meta={"run_id": str(run_id), "pool_id": str(pool_id) if pool_id else None, "ok": ok},
        created_at=created_at,
    )


def normalize_score_0_1(score: float, kind: str = "0_100") -> float:
    """Normalize to 0..1 for evaluation_scored. kind: 0_1 (clamp), 0_100 (score/100), -1_1 ((score+1)/2)."""
    if kind == "0_1":
        return max(0.0, min(1.0, score))
    if kind == "0_100":
        return max(0.0, min(1.0, score / 100.0))
    if kind == "-1_1":
        return max(0.0, min(1.0, (score + 1.0) / 2.0))
    return max(0.0, min(1.0, score))


async def on_evaluation_scored(
    session: AsyncSession,
    *,
    strategy_version_id: UUID,
    score: float,
    evaluation_id: UUID | None = None,
    created_at: datetime | None = None,
) -> None:
    """Evaluation score as reputation signal. Our Evaluation.score is already 0..1."""
    s01 = normalize_score_0_1(score, kind="0_1")
    await emit_reputation_event(
        session,
        subject_type="strategy_version",
        subject_id=_uuid(strategy_version_id),
        actor_type="system",
        actor_id=None,
        event_type=ReputationEventTypeEnum.evaluation_scored,
        value=s01,
        meta={"evaluation_id": str(evaluation_id) if evaluation_id else None, "raw_score": score, "normalized": s01},
        created_at=created_at,
    )


# severity -> value: minor -0.2, major -0.8, fraud -1.0
MODERATION_VALUE = {"minor": -0.2, "major": -0.8, "fraud": -1.0}


async def on_moderation_action(
    session: AsyncSession,
    *,
    target_type: str,
    target_id: str | UUID,
    action: str,
    reason: str | None = None,
    severity: str | None = None,
    created_at: datetime | None = None,
) -> None:
    """Emit moderation_penalty. action mapped to severity: halt/suspend/quarantine->major, reject->fraud."""
    if action in ("unhalt", "unsuspend", "unquarantine"):
        return  # clear, no penalty event
    sev = severity or ("fraud" if action == "reject" else "major" if action in ("halt", "suspend", "quarantine") else "minor")
    value = MODERATION_VALUE.get(sev, -0.5)
    await emit_reputation_event(
        session,
        subject_type=target_type,
        subject_id=_uuid(target_id),
        actor_type="system",
        actor_id=None,
        event_type=ReputationEventTypeEnum.moderation_penalty,
        value=value,
        meta={"action": action, "reason": reason, "severity": sev},
        created_at=created_at,
    )
