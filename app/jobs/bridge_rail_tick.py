"""Periodic tick: ACP/BSC checkpoints, reconciliation, orchestrator noop/audit."""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.bridge_acp_watcher import tick_acp_checkpoint
from app.services.bridge_bsc_watcher import tick_bsc_checkpoint
from app.services.bridge_orchestrator import tick_orchestrator
from app.services.bridge_reconciliation import run_reconciliation

logger = logging.getLogger(__name__)


async def _safe_step(name: str, fn, session: AsyncSession) -> dict:
    try:
        return await fn(session)
    except Exception as exc:
        logger.exception("bridge rail step failed: %s", name)
        return {"ok": False, "error": str(exc), "step": name}


async def bridge_rail_tick(session: AsyncSession) -> dict:
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True, "reason": "bridge_rail_disabled"}

    acp = await _safe_step("acp", tick_acp_checkpoint, session)
    bsc = await _safe_step("bsc", tick_bsc_checkpoint, session)
    orch = await _safe_step("orchestrator", tick_orchestrator, session)
    recon = await _safe_step("reconciliation", run_reconciliation, session)
    return {"acp": acp, "bsc": bsc, "orchestrator": orch, "reconciliation": recon}
