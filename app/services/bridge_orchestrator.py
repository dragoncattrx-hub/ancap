"""FSM orchestrator hooks (chain signing wired in a follow-up)."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation, BridgeStateTransition


async def append_transition(
    session: AsyncSession,
    op: BridgeOperation,
    to_status: str,
    *,
    metadata: dict | None = None,
) -> None:
    prev = op.status
    op.status = to_status
    op.version = (op.version or 0) + 1
    session.add(
        BridgeStateTransition(
            operation_id=op.id,
            from_status=prev,
            to_status=to_status,
            metadata_json=metadata or {},
        )
    )
    session.add(
        BridgeAuditEvent(
            operation_id=op.id,
            event_type="state_transition",
            payload_json={"from": prev, "to": to_status, **(metadata or {})},
        )
    )


async def tick_orchestrator(session: AsyncSession) -> dict:
    """Placeholder for future mint/burn worker (chain txs not submitted here)."""
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True}
    return {"ok": True, "dry_run": settings.bridge_dry_run}
