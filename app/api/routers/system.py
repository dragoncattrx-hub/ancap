import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import select
from sqlalchemy import desc
from sqlalchemy import func

from app.config import get_settings
from app.api.deps import DbSession
from app.jobs.agent_relationships_upsert import upsert_agent_relationships_from_orders
from app.jobs.edges_daily_upsert import upsert_edges_daily_from_orders
from app.jobs.evolution_auto_limits import auto_limits_tick
from app.jobs.evolution_auto_quarantine import auto_quarantine_tick
from app.jobs.evolution_auto_ab import auto_ab_tick
from app.jobs.circuit_breaker_by_metric import circuit_breaker_by_metric_tick
from app.jobs.reputation_tick import reputation_tick
from app.jobs.referral_rewards_tick import referral_rewards_tick
from app.jobs.notifications_fanout_tick import notifications_fanout_tick
from app.jobs.leaderboard_recompute_tick import leaderboard_recompute_tick
from app.jobs.activity_feed_materialize_tick import activity_feed_materialize_tick
from app.jobs.growth_metrics_rollup_tick import growth_metrics_rollup_tick
from app.jobs.faucet_abuse_check_tick import faucet_abuse_check_tick
from app.jobs.governance_checks_tick import governance_checks_tick
from app.jobs.graph_enforcement_tick import graph_enforcement_tick
from app.services.ledger import check_ledger_invariant, set_ledger_invariant_halted, is_ledger_invariant_halted
from app.db.models import DecisionLog, AcpSwapOrder, ReferralOnchainPayoutJob
from app.schemas import DecisionLogPublic

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/diagnostics")
async def diagnostics():
    s = get_settings()
    return {
        "status": "ok",
        "currencies": {
            "stake_to_activate_currency": s.stake_to_activate_currency,
            "run_fee_currency": s.run_fee_currency,
            "listing_fee_currency": s.listing_fee_currency,
            "moderation_slash_currency": s.moderation_slash_currency,
        },
        "acp": {
            "chain_anchor_driver": s.chain_anchor_driver,
            "acp_rpc_url": s.acp_rpc_url,
            "walletd_configured": bool(__import__("os").getenv("ACP_WALLETD_PATH", "").strip()),
        },
    }


@router.get("/fees")
async def fee_settings():
    s = get_settings()
    return {
        "listing_fee_percent": str(getattr(s, "listing_fee_percent", "0") or "0"),
        "listing_fee_amount": str(getattr(s, "listing_fee_amount", "0") or "0"),
        "listing_fee_currency": s.listing_fee_currency,
        "run_fee_percent": str(getattr(s, "run_fee_percent", "0") or "0"),
        "run_fee_amount": str(getattr(s, "run_fee_amount", "0") or "0"),
        "run_fee_currency": s.run_fee_currency,
    }


@router.get("/economy-health")
async def economy_health(session: DbSession):
    s = get_settings()
    rpc_ok = False
    rpc_error = None
    rpc_url = (s.acp_rpc_url or "").strip()
    if rpc_url:
        try:
            body = {"jsonrpc": "2.0", "id": 1, "method": "getblockcount", "params": {}}
            headers = {}
            token = os.getenv("ACP_RPC_TOKEN", "").strip()
            if token:
                headers["x-acp-rpc-token"] = token
            r = httpx.post(rpc_url, json=body, headers=headers, timeout=5.0)
            payload = r.json()
            rpc_ok = bool(r.status_code == 200 and not payload.get("error"))
            if not rpc_ok:
                rpc_error = str(payload.get("error") or f"status={r.status_code}")
        except Exception as exc:
            rpc_error = str(exc)
    pending_swaps = (
        await session.execute(
            select(func.count(AcpSwapOrder.id)).where(AcpSwapOrder.status.in_(("awaiting_deposit", "pending_review")))
        )
    ).scalar_one()
    pending_payout_jobs = (
        await session.execute(
            select(func.count(ReferralOnchainPayoutJob.id)).where(ReferralOnchainPayoutJob.status == "pending")
        )
    ).scalar_one()
    failed_payout_jobs = (
        await session.execute(
            select(func.count(ReferralOnchainPayoutJob.id)).where(ReferralOnchainPayoutJob.status == "failed")
        )
    ).scalar_one()
    halted = await is_ledger_invariant_halted(session)
    return {
        "acp_rpc_ok": rpc_ok,
        "acp_rpc_error": rpc_error,
        "ledger_halted": halted,
        "pending_swaps": int(pending_swaps or 0),
        "pending_referral_payout_jobs": int(pending_payout_jobs or 0),
        "failed_referral_payout_jobs": int(failed_payout_jobs or 0),
    }


@router.get("/ledger-invariant-status")
async def ledger_invariant_status(session: DbSession):
    """Return whether ledger operations are blocked due to invariant violation (ROADMAP §3)."""
    halted = await is_ledger_invariant_halted(session)
    return {"halted": halted}


@router.get("/decision-logs", response_model=list[DecisionLogPublic])
async def list_decision_logs(
    session: DbSession,
    limit: int = 100,
    scope: str | None = None,
    reason_code: str | None = None,
):
    q = select(DecisionLog).order_by(desc(DecisionLog.created_at)).limit(min(max(limit, 1), 500))
    if scope:
        q = q.where(DecisionLog.scope == scope)
    if reason_code:
        q = q.where(DecisionLog.reason_code == reason_code)
    r = await session.execute(q)
    out: list[DecisionLogPublic] = []
    for x in r.scalars().all():
        out.append(
            DecisionLogPublic(
                id=str(x.id),
                decision=x.decision,
                reason_code=x.reason_code,
                message=x.message,
                scope=x.scope,
                actor_type=x.actor_type,
                actor_id=str(x.actor_id) if x.actor_id else None,
                subject_type=x.subject_type,
                subject_id=str(x.subject_id) if x.subject_id else None,
                threshold_value=x.threshold_value,
                actual_value=x.actual_value,
                metadata_json=x.metadata_json,
                created_at=x.created_at,
            )
        )
    return out


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
    growth_referrals = await referral_rewards_tick(session, max_items=500)
    growth_notifications = await notifications_fanout_tick(session, max_events=500)
    growth_leaderboards = await leaderboard_recompute_tick(session)
    growth_feed = await activity_feed_materialize_tick(session, limit=200)
    growth_metrics = await growth_metrics_rollup_tick(session)
    growth_faucet_abuse = await faucet_abuse_check_tick(session, max_items=500)
    governance_checks = await governance_checks_tick(session, commit=False)
    graph_enforcement = await graph_enforcement_tick(session, max_agents=200)
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
        "growth_referrals": growth_referrals,
        "growth_notifications": growth_notifications,
        "growth_leaderboards": growth_leaderboards,
        "growth_feed": growth_feed,
        "growth_metrics": growth_metrics,
        "growth_faucet_abuse": growth_faucet_abuse,
        "governance_checks": governance_checks,
        "graph_enforcement": graph_enforcement,
        "ledger_invariant_violations": [{"currency": c, "sum": str(s)} for c, s in ledger_violations],
    }
