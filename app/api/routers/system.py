import os
import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
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
from app.jobs.bridge_rail_tick import bridge_rail_tick
from app.jobs.graph_enforcement_tick import graph_enforcement_tick
from app.jobs.staking_rewards_tick import staking_rewards_tick
from app.jobs.mobile_acp_indexer_tick import mobile_acp_indexer_tick
from app.services.ledger import check_ledger_invariant, set_ledger_invariant_halted, is_ledger_invariant_halted
from app.api.deps import require_auth
from app.services.cache import redis_ping
from app.db.models import DecisionLog, AcpSwapOrder, ReferralOnchainPayoutJob
from app.schemas import DecisionLogPublic

router = APIRouter(prefix="/system", tags=["System"])
_internal_router = APIRouter(prefix="/internal/ops", tags=["Internal Ops"])


def _require_platform_admin(user_id: str | None) -> None:
    """Raise 403 if the caller is not a platform admin."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    settings = get_settings()
    if user_id not in settings.platform_admin_user_ids_allowlist:
        raise HTTPException(status_code=403, detail="Platform admin access required")


@router.get("/health")
async def health():
    """Lightweight liveness probe. No external I/O."""
    return {"status": "ok"}


@router.get("/ready")
async def readiness(session: DbSession):
    """Readiness probe: DB + Redis. No external HTTP calls."""
    checks: dict[str, bool] = {}
    try:
        await session.execute(select(func.count()).select_from(DecisionLog))
        checks["database"] = True
    except Exception:
        checks["database"] = False
    redis_ok, _ = await redis_ping()
    checks["redis"] = redis_ok
    status = "ready" if checks.get("database", False) else "not_ready"
    return {"status": status, "checks": checks}


@router.get("/health/full")
async def health_full(session: DbSession):
    s = get_settings()
    checks: dict[str, dict[str, object]] = {}

    try:
        await session.execute(select(func.count()).select_from(DecisionLog))
        checks["database"] = {"ok": True}
    except Exception as exc:
        checks["database"] = {"ok": False, "error": str(exc)}

    redis_ok, redis_error = await redis_ping()
    checks["redis"] = {"ok": redis_ok, "configured": bool(s.redis_url), "error": redis_error}

    llm_configured = False
    if (s.llm_provider or "").lower() == "teneta_claude":
        llm_configured = bool(s.anthropic_api_key and s.anthropic_base_url)
    elif (s.llm_provider or "").lower() == "openai":
        llm_configured = bool(s.openai_api_key)
    elif (s.llm_provider or "").lower() == "ollama":
        llm_configured = bool(s.ollama_base_url)
    # Probe LLM provider with a lightweight call
    llm_probe_status = "unknown"
    llm_probe_error: str | None = None
    if llm_configured and not (s.llm_provider or "").startswith("disabled"):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                headers = {"x-api-key": s.anthropic_api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
                payload = {"model": s.llm_model, "max_tokens": 1, "messages": [{"role": "user", "content": "ping"}]}
                r = await client.post(f"{s.anthropic_base_url}/v1/messages", headers=headers, json=payload)
                if r.status_code == 200:
                    llm_probe_status = "ok"
                else:
                    llm_probe_status = "degraded"
                    llm_probe_error = f"HTTP {r.status_code}"
        except Exception as exc:
            llm_probe_status = "degraded"
            llm_probe_error = str(exc)[:120]

    checks["llm"] = {
        "ok": llm_probe_status == "ok" or llm_configured or s.llm_fallback_to_template,
        "provider": s.llm_provider,
        "model": s.llm_model,
        "configured": llm_configured,
        "fallback_enabled": s.llm_fallback_to_template,
        "probe_status": llm_probe_status,
        "probe_error": llm_probe_error,
    }

    checks["mail"] = {
        "ok": (not s.mail_enabled) or bool(s.smtp_host and s.smtp_from_email),
        "enabled": s.mail_enabled,
        "configured": bool(s.smtp_host and s.smtp_from_email),
    }
    checks["bridge"] = {
        "ok": not s.bridge_rail_paused,
        "enabled": s.bridge_rail_enabled,
        "paused": s.bridge_rail_paused,
        "dry_run": s.bridge_dry_run,
    }

    status = "ok" if all(bool(item.get("ok")) for item in checks.values()) else "degraded"
    return {"status": status, "checks": checks}


@_internal_router.get("/diagnostics")
async def ops_diagnostics(user_id: str | None = None):
    """Operational diagnostics. Admin auth required."""
    _require_platform_admin(user_id)
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
            "walletd_configured": bool(os.getenv("ACP_WALLETD_PATH", "").strip()),
        },
    }


@_internal_router.get("/deep-health")
async def deep_health(session: DbSession, user_id: str = Depends(require_auth)):
    """Full system health with external probes (LLM, bridge). Auth required; admin-only in production."""
    _require_platform_admin(user_id)
    s = get_settings()
    checks: dict[str, dict[str, object]] = {}

    try:
        await session.execute(select(func.count()).select_from(DecisionLog))
        checks["database"] = {"ok": True}
    except Exception as exc:
        checks["database"] = {"ok": False, "error": str(exc)}

    redis_ok, redis_error = await redis_ping()
    checks["redis"] = {"ok": redis_ok, "configured": bool(s.redis_url), "error": redis_error}

    llm_configured = False
    if (s.llm_provider or "").lower() == "teneta_claude":
        llm_configured = bool(s.anthropic_api_key and s.anthropic_base_url)
    elif (s.llm_provider or "").lower() == "openai":
        llm_configured = bool(s.openai_api_key)
    elif (s.llm_provider or "").lower() == "ollama":
        llm_configured = bool(s.ollama_base_url)

    llm_probe_status = "unknown"
    llm_probe_error: str | None = None
    if llm_configured and not (s.llm_provider or "").startswith("disabled"):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    "x-api-key": s.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                }
                payload = {"model": s.llm_model, "max_tokens": 1, "messages": [{"role": "user", "content": "ping"}]}
                r = await client.post(f"{s.anthropic_base_url}/v1/messages", headers=headers, json=payload)
                llm_probe_status = "ok" if r.status_code == 200 else "degraded"
                if r.status_code != 200:
                    llm_probe_error = f"HTTP {r.status_code}"
        except Exception as exc:
            llm_probe_status = "degraded"
            llm_probe_error = str(exc)[:120]

    checks["llm"] = {
        "ok": llm_probe_status == "ok" or llm_configured or s.llm_fallback_to_template,
        "provider": s.llm_provider,
        "model": s.llm_model,
        "configured": llm_configured,
        "fallback_enabled": s.llm_fallback_to_template,
        "probe_status": llm_probe_status,
        "probe_error": llm_probe_error,
    }
    checks["mail"] = {
        "ok": (not s.mail_enabled) or bool(s.smtp_host and s.smtp_from_email),
        "enabled": s.mail_enabled,
        "configured": bool(s.smtp_host and s.smtp_from_email),
    }
    checks["bridge"] = {
        "ok": not s.bridge_rail_paused,
        "enabled": s.bridge_rail_enabled,
        "paused": s.bridge_rail_paused,
        "dry_run": s.bridge_dry_run,
    }

    overall = "ok" if all(bool(item.get("ok")) for item in checks.values()) else "degraded"
    return {"status": overall, "checks": checks}


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


@router.get("/staking-economics")
async def staking_economics():
    s = get_settings()
    return {
        "enabled": s.staking_rewards_enabled,
        "currency": s.staking_rewards_currency,
        "fees_share_percent": str(s.staking_rewards_fees_share_percent),
        "slash_share_percent": str(s.staking_rewards_slash_share_percent),
        "bootstrap_emission_daily": str(s.staking_rewards_bootstrap_daily_emission),
        "bootstrap_emission_cap_total": str(s.staking_rewards_bootstrap_emission_cap_total),
        "apy_floor_percent": str(s.staking_rewards_apy_floor_percent),
        "apy_ceiling_percent": str(s.staking_rewards_apy_ceiling_percent),
        "min_stake_for_rewards": str(s.staking_rewards_min_stake_for_rewards),
    }


@_internal_router.get("/economy-health")
async def ops_economy_health(session: DbSession, user_id: str = Depends(require_auth)):
    """Bridge swap queue + referral payout job health. Auth required."""
    s = get_settings()
    rpc_ok = False
    rpc_error: str | None = None
    rpc_url = (s.acp_rpc_url or "").strip()
    if rpc_url:
        try:
            body = {"jsonrpc": "2.0", "id": 1, "method": "getblockcount", "params": {}}
            headers = {}
            token = os.getenv("ACP_RPC_TOKEN", "").strip()
            if token:
                headers["x-acp-rpc-token"] = token
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.post(rpc_url, json=body, headers=headers)
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


@_internal_router.get("/ledger-invariant-status")
async def ops_ledger_invariant_status(session: DbSession, user_id: str = Depends(require_auth)):
    """Ledger invariant halt status. Auth required."""
    halted = await is_ledger_invariant_halted(session)
    return {"halted": halted}


@_internal_router.get("/decision-logs", response_model=list[DecisionLogPublic])
async def ops_list_decision_logs(
    session: DbSession,
    user_id: str = Depends(require_auth),
    limit: int = 100,
    scope: str | None = None,
    reason_code: str | None = None,
):
    """Decision logs. Auth required."""
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


async def _run_all_jobs(session: DbSession) -> dict:
    """Execute all scheduled jobs. Called by both sync and async tick endpoints."""
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
    staking_rewards = await staking_rewards_tick(session)
    ledger_violations = await check_ledger_invariant(session)
    await set_ledger_invariant_halted(session, halted=len(ledger_violations) > 0)
    bridge_rail = await bridge_rail_tick(session)
    mobile_indexer = await mobile_acp_indexer_tick(session)
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
        "staking_rewards": staking_rewards,
        "ledger_invariant_violations": [{"currency": c, "sum": str(s)} for c, s in ledger_violations],
        "bridge_rail": bridge_rail,
        "mobile_indexer": mobile_indexer,
    }


@router.post("/jobs/tick/async")
async def jobs_tick_async(
    request: Request,
    background_tasks: BackgroundTasks,
    session: DbSession,
):
    """
    Async job tick: enqueues all jobs as a background task and returns immediately.
    Use this for normal scheduled runs (e.g., cron every 5 min).
    Protected by optional CRON_SECRET (X-Cron-Secret header).
    """
    settings = get_settings()
    if settings.cron_secret:
        provided_secret = request.headers.get("X-Cron-Secret")
        if provided_secret != settings.cron_secret:
            raise HTTPException(status_code=403, detail="Invalid or missing cron secret")

    async def _bg_wrapper():
        from app.api.deps import AsyncSessionLocal
        async with AsyncSessionLocal() as bg_session:
            return await _run_all_jobs(bg_session)

    background_tasks.add_task(_bg_wrapper)
    return {"status": "queued", "message": "All jobs are running in the background"}


@router.post("/jobs/tick")
async def jobs_tick(request: Request, session: DbSession):
    """
    Synchronous job tick: runs all jobs in the request path.
    Use only for manual emergency triggers (ops console).
    Prefer /jobs/tick/async for scheduling.
    Protected by optional CRON_SECRET (X-Cron-Secret header).
    """
    settings = get_settings()
    if settings.cron_secret:
        provided_secret = request.headers.get("X-Cron-Secret")
        if provided_secret != settings.cron_secret:
            raise HTTPException(status_code=403, detail="Invalid or missing cron secret")
    return await _run_all_jobs(session)
