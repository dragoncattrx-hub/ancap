from fastapi import APIRouter, Request, HTTPException

from app.config import get_settings
from app.api.deps import DbSession
from app.jobs.agent_relationships_upsert import upsert_agent_relationships_from_orders
from app.jobs.edges_daily_upsert import upsert_edges_daily_from_orders
from app.jobs.evolution_auto_limits import auto_limits_tick
from app.jobs.evolution_auto_quarantine import auto_quarantine_tick
from app.jobs.evolution_auto_ab import auto_ab_tick
from app.jobs.circuit_breaker_by_metric import circuit_breaker_by_metric_tick
from app.jobs.reputation_tick import reputation_tick
from app.services.ledger import check_ledger_invariant, set_ledger_invariant_halted, is_ledger_invariant_halted

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/ledger-invariant-status")
async def ledger_invariant_status(session: DbSession):
    """Return whether ledger operations are blocked due to invariant violation (ROADMAP §3)."""
    halted = await is_ledger_invariant_halted(session)
    return {"halted": halted}


@router.post("/jobs/tick")
async def jobs_tick(request: Request, session: DbSession):
    """
    Sprint-2 + L3 job tick: edges_daily, agent_relationships, auto_limits, auto_quarantine, auto_ab.
    Call periodically (e.g. every 1–5 min). Protected by optional CRON_SECRET (X-Cron-Secret header).
    """
    # Security: check cron secret if configured
    settings = get_settings()
    if settings.cron_secret:
        provided_secret = request.headers.get("X-Cron-Secret")
        if provided_secret != settings.cron_secret:
            raise HTTPException(status_code=403, detail="Invalid or missing cron secret")
    
    processed = await upsert_edges_daily_from_orders(session, batch_size=2000, commit=False)
    agent_rel_processed = await upsert_agent_relationships_from_orders(session, batch_size=2000, commit=False)
    limits_updated = await auto_limits_tick(session, max_updates=100)
    quarantine_count = await auto_quarantine_tick(session, threshold=0.2)
    ab_result = await auto_ab_tick(session, min_sample_size=5, promote_percentile=0.9)
    cb_result = await circuit_breaker_by_metric_tick(session, commit=False)
    rep_result = await reputation_tick(session, max_subjects=50, since_days=7, commit=False)
    ledger_violations = await check_ledger_invariant(session)
    await set_ledger_invariant_halted(session, halted=len(ledger_violations) > 0)
    return {
        "ok": True,
        "edges_daily_orders_processed": processed,
        "agent_relationships_orders_processed": agent_rel_processed,
        "auto_limits_updated": limits_updated,
        "auto_quarantine_count": quarantine_count,
        "auto_ab": ab_result,
        "circuit_breaker_by_metric": cb_result,
        "reputation_recomputed": rep_result["recomputed"],
        "ledger_invariant_violations": [{"currency": c, "sum": str(s)} for c, s in ledger_violations],
    }
