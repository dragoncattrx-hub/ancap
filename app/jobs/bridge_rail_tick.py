"""Periodic tick: ACP/BSC checkpoints, reconciliation, orchestrator noop/audit."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.bridge_acp_watcher import tick_acp_checkpoint
from app.services.bridge_bsc_watcher import tick_bsc_checkpoint
from app.services.bridge_orchestrator import tick_orchestrator
from app.services.bridge_reconciliation import run_reconciliation


async def bridge_rail_tick(session: AsyncSession) -> dict:
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True, "reason": "bridge_rail_disabled"}

    acp = await tick_acp_checkpoint(session)
    bsc = await tick_bsc_checkpoint(session)
    orch = await tick_orchestrator(session)
    recon = await run_reconciliation(session)
    return {"acp": acp, "bsc": bsc, "orchestrator": orch, "reconciliation": recon}
