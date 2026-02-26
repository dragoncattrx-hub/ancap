import hashlib
import json
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException

from app.schemas import RunRequest, RunReplayRequest, RunPublic, RunState, Pagination
from app.api.deps import DbSession
from app.db.models import (
    Run, RunLog, RunStep, RunStepScore, MetricRecord, RunStateEnum,
    StrategyVersion, Strategy, Vertical, VerticalSpec,
    RiskPolicy, CircuitBreaker,
    TrustScore, ReputationSnapshot,
)
from sqlalchemy import select
from sqlalchemy import desc

from app.engine.interpreter import run_workflow
from app.engine.actions.base_vertical import BASE_VERTICAL_ACTIONS
from app.services.risk import merge_policy, make_risk_callback, get_effective_limits, get_reputation_gate, get_graph_gate, get_step_scorers
from app.services.step_quality import compute_step_quality, get_step_quality
from app.services.evaluation import update_evaluation_for_version
from app.services.reputation_events import on_run_completed, on_evaluation_scored
from app.services.agent_graph_metrics import get_agent_graph_metrics
from app.services.stakes import require_activated_if_stake_required
from app.db.models import Evaluation

router = APIRouter(prefix="/runs", tags=["Runs"])


async def _run_workflow_and_persist(
    session,
    run: Run,
    workflow_json: dict,
    params: dict | None,
    pool_id: UUID,
    limits: dict,
    dry_run: bool,
    version_id: UUID,
    allowed_actions: frozenset,
    risk_callback,
    start_step_index: int = 0,
    initial_context: dict | None = None,
    step_scorers: list[str] | None = None,
) -> RunPublic:
    """Execute workflow (optionally from start_step_index with initial_context), persist steps/logs/metrics, post-process; return RunPublic. step_scorers: e.g. 'quality' uses compute_step_quality, others get placeholder 0.5."""
    context_after_by_index: dict[int, dict] = {}

    def _capture_context(i: int, ctx: dict) -> None:
        context_after_by_index[i] = ctx

    exec_result = run_workflow(
        workflow_json=workflow_json,
        params=params,
        run_id=str(run.id),
        pool_id=str(pool_id),
        limits=limits,
        dry_run=dry_run,
        allowed_actions=allowed_actions,
        risk_callback=risk_callback,
        start_step_index=start_step_index,
        initial_context=initial_context,
        context_after_step_callback=_capture_context,
    )

    run.state = RunStateEnum(exec_result.state)
    run.ended_at = datetime.utcnow()
    run.failure_reason = exec_result.failure_reason
    run.inputs_hash = exec_result.inputs_hash
    run.workflow_hash = exec_result.workflow_hash
    run.outputs_hash = exec_result.outputs_hash
    run.env_hash = hashlib.sha256(
        json.dumps({"pool_id": str(pool_id), "limits": limits}, sort_keys=True).encode()
    ).hexdigest()
    run.proof_json = None
    await session.flush()

    session.add(RunLog(run_id=run.id, level="info", message="Run started"))
    for sl in exec_result.step_logs:
        session.add(RunLog(
            run_id=run.id,
            level="info",
            message=f"step {sl.step_id} {sl.action} {sl.event} duration_ms={sl.duration_ms}",
        ))
    step_objs: list[tuple[RunStep, int | None, str, str, str, dict | None]] = []
    for i, sl in enumerate(exec_result.step_logs):
        state = "succeeded" if sl.event == "step_succeeded" else "failed" if sl.event == "step_failed" else "skipped"
        result_summary = sl.args_summary if sl.args_summary else None
        payload = {"step_id": sl.step_id, "action": sl.action, "result_summary": result_summary}
        artifact_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest() if (sl.step_id or sl.action) else None
        score_value = 1.0 if state == "succeeded" else 0.0 if state == "failed" else 0.5
        wf_step_index = start_step_index + i
        rs = RunStep(
            run_id=run.id,
            step_index=i,
            step_id=sl.step_id,
            parent_step_index=i - 1 if i > 0 else None,
            action=sl.action,
            state=state,
            duration_ms=sl.duration_ms or None,
            result_summary=result_summary,
            artifact_hash=artifact_hash,
            score_value=score_value,
            score_type="outcome",
            context_after=context_after_by_index.get(wf_step_index),
        )
        session.add(rs)
        step_objs.append((rs, sl.duration_ms, state, sl.step_id or "", sl.action or "", result_summary))
    await session.flush()
    # ROADMAP §5: alternative score_type (latency + optional quality etc.) in run_step_scores
    from app.config import get_settings
    settings = get_settings()
    for rs, duration_ms, state, step_id, action, result_summary in step_objs:
        latency_val = max(0.0, 1.0 - ((duration_ms or 0) / 10000.0))
        session.add(RunStepScore(run_step_id=rs.id, score_type="latency", score_value=latency_val))
        for sc in step_scorers or []:
            if sc == "quality":
                q_val = await get_step_quality(
                    step_id, action, state, duration_ms, result_summary,
                    scorer_url=settings.quality_scorer_url or "",
                    timeout_seconds=settings.quality_scorer_timeout_seconds,
                )
                session.add(RunStepScore(run_step_id=rs.id, score_type=sc, score_value=q_val))
            else:
                session.add(RunStepScore(run_step_id=rs.id, score_type=sc, score_value=0.5))
    if exec_result.failure_reason:
        session.add(RunLog(run_id=run.id, level="error", message=exec_result.failure_reason))
    for name, value in exec_result.metrics.items():
        session.add(MetricRecord(run_id=run.id, name=name, value=value))
    await session.flush()

    if run.state == RunStateEnum.succeeded:
        await update_evaluation_for_version(session, version_id)
        from app.config import get_settings
        from decimal import Decimal
        from app.services.ledger import get_or_create_account, append_event
        from app.db.models import LedgerEventTypeEnum
        from app.constants import PLATFORM_ACCOUNT_OWNER_ID
        settings = get_settings()
        if settings.run_fee_amount and Decimal(settings.run_fee_amount) > 0:
            try:
                pool_acc = await get_or_create_account(session, "pool_treasury", pool_id)
                platform_acc = await get_or_create_account(session, "system", PLATFORM_ACCOUNT_OWNER_ID)
                fee_value = Decimal(settings.run_fee_amount)
                await append_event(
                    session,
                    LedgerEventTypeEnum.fee,
                    settings.run_fee_currency,
                    fee_value,
                    src_account_id=pool_acc.id,
                    dst_account_id=platform_acc.id,
                    metadata={"type": "run_fee", "run_id": str(run.id), "pool_id": str(pool_id)},
                )
            except Exception:
                pass

    try:
        await on_run_completed(
            session,
            run_id=run.id,
            strategy_version_id=version_id,
            ok=(run.state == RunStateEnum.succeeded),
            pool_id=pool_id,
            created_at=run.ended_at or run.started_at,
        )
        if run.state == RunStateEnum.succeeded:
            ev_q = select(Evaluation).where(Evaluation.strategy_version_id == version_id)
            ev_r = await session.execute(ev_q)
            ev = ev_r.scalar_one_or_none()
            if ev:
                await on_evaluation_scored(
                    session,
                    strategy_version_id=version_id,
                    score=float(ev.score),
                    evaluation_id=ev.id,
                    created_at=ev.updated_at,
                )
    except Exception:
        pass

    await session.refresh(run)
    return RunPublic(
        id=str(run.id),
        strategy_version_id=str(run.strategy_version_id),
        pool_id=str(run.pool_id),
        parent_run_id=str(run.parent_run_id) if run.parent_run_id else None,
        state=RunState(run.state.value),
        started_at=run.started_at,
        ended_at=run.ended_at,
        failure_reason=run.failure_reason,
        inputs_hash=run.inputs_hash,
        workflow_hash=run.workflow_hash,
        outputs_hash=run.outputs_hash,
        env_hash=run.env_hash,
        run_mode=run.run_mode,
        created_at=run.created_at,
    )


_GLOBAL_SCOPE_ID = UUID("00000000-0000-0000-0000-000000000000")


async def _resolve_policy(session, pool_id: UUID, vertical_id: UUID, strategy_id: UUID) -> dict:
    layers = []
    for scope_type, scope_id in [
        ("global", _GLOBAL_SCOPE_ID),
        ("pool", pool_id),
        ("vertical", vertical_id),
        ("strategy", strategy_id),
    ]:
        q = select(RiskPolicy).where(
            RiskPolicy.scope_type == scope_type,
            RiskPolicy.scope_id == scope_id,
        ).limit(1)
        r = await session.execute(q)
        pol = r.scalar_one_or_none()
        if pol and pol.policy_json:
            layers.append(pol.policy_json)
    return merge_policy(layers)


@router.post("", response_model=RunPublic, status_code=201)
async def request_run(body: RunRequest, session: DbSession):
    version_id = UUID(body.strategy_version_id)
    pool_id = UUID(body.pool_id)

    # Circuit breaker: pool halted -> 409
    cb_q = select(CircuitBreaker).where(
        CircuitBreaker.scope_type == "pool",
        CircuitBreaker.scope_id == pool_id,
    ).limit(1)
    cb_r = await session.execute(cb_q)
    cb = cb_r.scalar_one_or_none()
    if cb and getattr(cb, "state", None) == "halted":
        raise HTTPException(status_code=409, detail="Pool is halted (circuit breaker)")

    # Load strategy version + workflow
    ver = await session.get(StrategyVersion, version_id)
    if not ver:
        raise HTTPException(status_code=404, detail="Strategy version not found")
    workflow_json = ver.workflow_json or {}
    if not workflow_json.get("steps"):
        raise HTTPException(status_code=400, detail="Workflow has no steps")

    strat = await session.get(Strategy, ver.strategy_id)
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")
    if strat.owner_agent_id:
        await require_activated_if_stake_required(session, strat.owner_agent_id)
    vert = await session.get(Vertical, strat.vertical_id)
    if not vert:
        raise HTTPException(status_code=404, detail="Vertical not found")

    # Allowed actions from vertical spec (BaseVertical or custom)
    spec_q = select(VerticalSpec).where(VerticalSpec.vertical_id == vert.id).order_by(VerticalSpec.created_at.desc()).limit(1)
    spec_r = await session.execute(spec_q)
    vspec = spec_r.scalar_one_or_none()
    allowed_actions = BASE_VERTICAL_ACTIONS
    if vspec and vspec.spec_json and vspec.spec_json.get("allowed_actions"):
        allowed_actions = frozenset(a.get("name") for a in vspec.spec_json["allowed_actions"] if a.get("name"))

    policy = await _resolve_policy(session, pool_id, strat.vertical_id, strat.id)
    # Reputation gate (ROADMAP 2.2): min_trust_score / min_reputation_score for strategy owner
    gate = get_reputation_gate(policy)
    if gate and strat.owner_agent_id:
        window = gate.get("reputation_window") or "90d"
        if gate.get("min_trust_score") is not None:
            tq = (
                select(TrustScore)
                .where(
                    TrustScore.subject_type == "agent",
                    TrustScore.subject_id == strat.owner_agent_id,
                    TrustScore.window == window,
                    TrustScore.algo_version == "trust2-v1",
                )
                .order_by(desc(TrustScore.computed_at))
                .limit(1)
            )
            tr = await session.execute(tq)
            trust_row = tr.scalar_one_or_none()
            trust_val = float(trust_row.trust_score) if trust_row and trust_row.trust_score is not None else 0.0
            if trust_val < gate["min_trust_score"]:
                raise HTTPException(
                    status_code=403,
                    detail=f"Reputation gate: strategy owner trust_score {trust_val:.2f} below min_trust_score {gate['min_trust_score']}",
                )
        if gate.get("min_reputation_score") is not None:
            sq = (
                select(ReputationSnapshot)
                .where(
                    ReputationSnapshot.subject_type == "agent",
                    ReputationSnapshot.subject_id == strat.owner_agent_id,
                    ReputationSnapshot.window == window,
                    ReputationSnapshot.algo_version == "rep2-v1",
                )
                .order_by(desc(ReputationSnapshot.computed_at))
                .limit(1)
            )
            sr = await session.execute(sq)
            snap_row = sr.scalar_one_or_none()
            score_val = float(snap_row.score) if snap_row and snap_row.score is not None else 0.0
            if score_val < gate["min_reputation_score"]:
                raise HTTPException(
                    status_code=403,
                    detail=f"Reputation gate: strategy owner reputation score {score_val:.1f} below min_reputation_score {gate['min_reputation_score']}",
                )
    # Graph gate (ROADMAP 2.1): max_reciprocity_score, max_suspicious_density — block if owner's metric >= cap
    graph_gate = get_graph_gate(policy)
    if graph_gate and strat.owner_agent_id:
        metrics = await get_agent_graph_metrics(session, strat.owner_agent_id)
        if graph_gate.get("max_reciprocity_score") is not None:
            rec = metrics.get("reciprocity_score", 0.0)
            cap = graph_gate["max_reciprocity_score"]
            if rec >= cap:
                raise HTTPException(
                    status_code=403,
                    detail=f"Graph gate: strategy owner reciprocity_score {rec:.2f} >= max_reciprocity_score {cap}",
                )
        if graph_gate.get("max_suspicious_density") is not None:
            sus = metrics.get("suspicious_density", 0.0)
            cap = graph_gate["max_suspicious_density"]
            if sus >= cap:
                raise HTTPException(
                    status_code=403,
                    detail=f"Graph gate: strategy owner suspicious_density {sus:.2f} >= max_suspicious_density {cap}",
                )
        if graph_gate.get("max_cluster_size") is not None:
            size = metrics.get("cluster_size", 0)
            cap = graph_gate["max_cluster_size"]
            if size > cap:
                raise HTTPException(
                    status_code=403,
                    detail=f"Graph gate: strategy owner cluster_size {size} > max_cluster_size {cap}",
                )
        if graph_gate.get("block_if_in_cycle") and metrics.get("in_cycle"):
            raise HTTPException(
                status_code=403,
                detail="Graph gate: strategy owner is in a directed cycle (block_if_in_cycle)",
            )
    limits = get_effective_limits(policy, body.limits)
    risk_callback = make_risk_callback(policy)
    step_scorers = get_step_scorers(policy)
    run_mode = getattr(body.run_mode, "value", body.run_mode) if hasattr(body.run_mode, "value") else (body.run_mode or "mock")
    effective_dry_run = body.dry_run or (run_mode == "backtest")

    parent_run_id = None
    if body.parent_run_id:
        try:
            parent_run_id = UUID(body.parent_run_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid parent_run_id")
    run = Run(
        strategy_version_id=version_id,
        pool_id=pool_id,
        parent_run_id=parent_run_id,
        state=RunStateEnum.queued,
        params=body.params,
        limits=body.limits,
        dry_run=body.dry_run,
        run_mode=run_mode,
    )
    session.add(run)
    await session.flush()
    run.started_at = datetime.utcnow()
    run.state = RunStateEnum.running
    await session.flush()

    return await _run_workflow_and_persist(
        session,
        run,
        workflow_json,
        body.params,
        pool_id,
        limits,
        effective_dry_run,
        version_id,
        allowed_actions,
        risk_callback,
        start_step_index=0,
        initial_context=None,
        step_scorers=step_scorers,
    )


@router.post("/replay", response_model=RunPublic, status_code=201)
async def replay_run(body: RunReplayRequest, session: DbSession):
    """ROADMAP §5: Create a new run with same inputs as the given run. from_step_index=0 or omit: full replay; from_step_index>0: replay from that step using stored context_after of step (from_step_index-1)."""
    run_id = UUID(body.run_id)
    parent = await session.get(Run, run_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Run not found")

    from_step_index = body.from_step_index if body.from_step_index is not None else 0
    if from_step_index == 0:
        replay_body = RunRequest(
            strategy_version_id=str(parent.strategy_version_id),
            pool_id=str(parent.pool_id),
            parent_run_id=str(run_id),
            params=parent.params,
            limits=parent.limits,
            dry_run=parent.dry_run,
            run_mode=getattr(parent.run_mode, "value", parent.run_mode) or "mock",
        )
        return await request_run(replay_body, session)

    # Replay from step N: need context_after from parent's step (N-1)
    step_q = select(RunStep).where(
        RunStep.run_id == run_id,
        RunStep.step_index == from_step_index - 1,
    ).limit(1)
    step_r = await session.execute(step_q)
    parent_step = step_r.scalar_one_or_none()
    if not parent_step or not parent_step.context_after:
        raise HTTPException(
            status_code=400,
            detail=f"No stored context for replay from step {from_step_index}. Parent run must have step_index={from_step_index - 1} with context_after.",
        )
    context_after = parent_step.context_after

    version_id = parent.strategy_version_id
    pool_id = parent.pool_id
    ver = await session.get(StrategyVersion, version_id)
    if not ver:
        raise HTTPException(status_code=404, detail="Strategy version not found")
    workflow_json = ver.workflow_json or {}
    if not workflow_json.get("steps"):
        raise HTTPException(status_code=400, detail="Workflow has no steps")
    strat = await session.get(Strategy, ver.strategy_id)
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")
    if strat.owner_agent_id:
        await require_activated_if_stake_required(session, strat.owner_agent_id)
    vert = await session.get(Vertical, strat.vertical_id)
    if not vert:
        raise HTTPException(status_code=404, detail="Vertical not found")
    spec_q = select(VerticalSpec).where(VerticalSpec.vertical_id == vert.id).order_by(VerticalSpec.created_at.desc()).limit(1)
    spec_r = await session.execute(spec_q)
    vspec = spec_r.scalar_one_or_none()
    allowed_actions = BASE_VERTICAL_ACTIONS
    if vspec and vspec.spec_json and vspec.spec_json.get("allowed_actions"):
        allowed_actions = frozenset(a.get("name") for a in vspec.spec_json["allowed_actions"] if a.get("name"))
    policy = await _resolve_policy(session, pool_id, strat.vertical_id, strat.id)
    limits = get_effective_limits(policy, parent.limits)
    risk_callback = make_risk_callback(policy)

    parent_run_mode = getattr(parent.run_mode, "value", parent.run_mode) or "mock"
    run = Run(
        strategy_version_id=version_id,
        pool_id=pool_id,
        parent_run_id=run_id,
        state=RunStateEnum.queued,
        params=parent.params,
        limits=parent.limits,
        dry_run=parent.dry_run,
        run_mode=parent_run_mode,
    )
    session.add(run)
    await session.flush()
    run.started_at = datetime.utcnow()
    run.state = RunStateEnum.running
    await session.flush()

    return await _run_workflow_and_persist(
        session,
        run,
        workflow_json,
        parent.params,
        pool_id,
        limits,
        parent.dry_run,
        version_id,
        allowed_actions,
        risk_callback,
        start_step_index=from_step_index,
        initial_context=context_after,
        step_scorers=get_step_scorers(policy),
    )


@router.get("", response_model=Pagination[RunPublic])
async def list_runs(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    strategy_version_id: UUID | None = Query(None),
    pool_id: UUID | None = Query(None),
    state: RunState | None = Query(None),
):
    q = select(Run).order_by(Run.created_at.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(Run.id < UUID(cursor))
        except ValueError:
            pass
    if strategy_version_id:
        q = q.where(Run.strategy_version_id == strategy_version_id)
    if pool_id:
        q = q.where(Run.pool_id == pool_id)
    if state:
        q = q.where(Run.state == state.value)
    r = await session.execute(q)
    rows = r.scalars().all()
    next_cursor = str(rows[-1].id) if len(rows) > limit else None
    items = rows[:limit]
    return Pagination(
        items=[
            RunPublic(
                id=str(run.id),
                strategy_version_id=str(run.strategy_version_id),
                pool_id=str(run.pool_id),
                parent_run_id=str(run.parent_run_id) if run.parent_run_id else None,
                state=RunState(run.state.value),
                started_at=run.started_at,
                ended_at=run.ended_at,
                failure_reason=run.failure_reason,
                inputs_hash=run.inputs_hash,
                workflow_hash=run.workflow_hash,
                outputs_hash=run.outputs_hash,
                env_hash=run.env_hash,
                run_mode=run.run_mode,
                created_at=run.created_at,
            )
            for run in items
        ],
        next_cursor=next_cursor,
    )


@router.get("/{run_id}", response_model=RunPublic)
async def get_run(run_id: UUID, session: DbSession):
    q = select(Run).where(Run.id == run_id)
    r = await session.execute(q)
    run = r.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return RunPublic(
        id=str(run.id),
        strategy_version_id=str(run.strategy_version_id),
        pool_id=str(run.pool_id),
        parent_run_id=str(run.parent_run_id) if run.parent_run_id else None,
        state=RunState(run.state.value),
        started_at=run.started_at,
        ended_at=run.ended_at,
        failure_reason=run.failure_reason,
        inputs_hash=run.inputs_hash,
        workflow_hash=run.workflow_hash,
        outputs_hash=run.outputs_hash,
        env_hash=run.env_hash,
        run_mode=run.run_mode,
        created_at=run.created_at,
    )


@router.get("/{run_id}/artifacts")
async def get_run_artifacts(run_id: UUID, session: DbSession):
    """L1 content-addressed audit: hashes of inputs, workflow, outputs; proof optional (MVP null)."""
    run = await session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {
        "run_id": str(run_id),
        "inputs_hash": run.inputs_hash,
        "workflow_hash": run.workflow_hash,
        "outputs_hash": run.outputs_hash,
        "env_hash": getattr(run, "env_hash", None),
        "proof": getattr(run, "proof_json", None),
    }


@router.get("/{run_id}/steps")
async def get_run_steps(run_id: UUID, session: DbSession):
    """Execution DAG (ROADMAP §5): list steps for a run (step_index, step_id, ..., scores)."""
    run = await session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    q = select(RunStep).where(RunStep.run_id == run_id).order_by(RunStep.step_index)
    r = await session.execute(q)
    steps = list(r.scalars().all())
    step_ids = [s.id for s in steps]
    extra_scores: dict[str, list[dict]] = {}
    if step_ids:
        sq = select(RunStepScore).where(RunStepScore.run_step_id.in_(step_ids))
        sr = await session.execute(sq)
        for row in sr.scalars().all():
            extra_scores.setdefault(row.run_step_id, []).append({
                "score_type": row.score_type,
                "score_value": float(row.score_value),
            })
    def _scores(s: RunStep) -> list[dict]:
        out = []
        if s.score_type and s.score_value is not None:
            out.append({"score_type": s.score_type, "score_value": float(s.score_value)})
        out.extend(extra_scores.get(s.id, []))
        return out
    return {
        "run_id": str(run_id),
        "steps": [
            {
                "step_index": s.step_index,
                "step_id": s.step_id,
                "parent_step_index": s.parent_step_index,
                "action": s.action,
                "state": s.state,
                "duration_ms": s.duration_ms,
                "result_summary": s.result_summary,
                "artifact_hash": s.artifact_hash,
                "score_value": float(s.score_value) if s.score_value is not None else None,
                "score_type": s.score_type,
                "scores": _scores(s),
            }
            for s in steps
        ],
    }


@router.get("/{run_id}/steps/{step_index}")
async def get_run_step_by_index(run_id: UUID, step_index: int, session: DbSession):
    """Execution DAG (ROADMAP §5): single step by index (scores include outcome + latency, etc.)."""
    run = await session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if step_index < 0:
        raise HTTPException(status_code=400, detail="step_index must be >= 0")
    q = select(RunStep).where(RunStep.run_id == run_id, RunStep.step_index == step_index)
    r = await session.execute(q)
    s = r.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Step not found")
    sq = select(RunStepScore).where(RunStepScore.run_step_id == s.id)
    sr = await session.execute(sq)
    extra = [{"score_type": row.score_type, "score_value": float(row.score_value)} for row in sr.scalars().all()]
    scores = []
    if s.score_type and s.score_value is not None:
        scores.append({"score_type": s.score_type, "score_value": float(s.score_value)})
    scores.extend(extra)
    return {
        "run_id": str(run_id),
        "step_index": s.step_index,
        "step_id": s.step_id,
        "parent_step_index": s.parent_step_index,
        "action": s.action,
        "state": s.state,
        "duration_ms": s.duration_ms,
        "result_summary": s.result_summary,
        "artifact_hash": s.artifact_hash,
        "score_value": float(s.score_value) if s.score_value is not None else None,
        "score_type": s.score_type,
        "scores": scores,
    }


@router.get("/{run_id}/logs", response_model=Pagination[dict])
async def get_run_logs(
    run_id: UUID,
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
):
    q = select(RunLog).where(RunLog.run_id == run_id).order_by(RunLog.ts.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(RunLog.id < UUID(cursor))
        except ValueError:
            pass
    r = await session.execute(q)
    rows = r.scalars().all()
    next_cursor = str(rows[-1].id) if len(rows) > limit else None
    items = rows[:limit]
    return Pagination(
        items=[{"ts": log.ts.isoformat(), "level": log.level, "message": log.message} for log in items],
        next_cursor=next_cursor,
    )
