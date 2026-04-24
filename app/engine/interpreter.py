"""
Workflow Interpreter v0.
Executes StrategyVersion.workflow (JSON); only whitelisted actions; no arbitrary code.
ROADMAP §5: optional start_step_index + initial_context for replay from step N; context_after_step_callback to capture context after each step.
"""
import copy
import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Optional

from app.schemas.strategies import WorkflowSpec, WorkflowStep
from app.engine.actions.base_vertical import BASE_VERTICAL_ACTIONS, execute_base_vertical_action


@dataclass
class StepLog:
    step_id: str
    action: str
    event: str  # step_started | step_succeeded | step_failed
    duration_ms: int = 0
    args_summary: dict = field(default_factory=dict)
    error: str | None = None


@dataclass
class RunResult:
    state: str  # succeeded | failed | killed
    failure_reason: str | None = None
    context: dict = field(default_factory=dict)
    step_logs: list[StepLog] = field(default_factory=list)
    metrics: dict[str, Any] = field(default_factory=dict)
    inputs_hash: str = ""
    workflow_hash: str = ""
    outputs_hash: str = ""
    risk_breaches: int = 0


def _normalize_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def _sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def _json_size_bytes(obj: Any) -> int:
    try:
        return len(_normalize_json(obj).encode("utf-8"))
    except Exception:
        return 0


def validate_workflow(workflow_dict: dict, allowed_actions: frozenset | None = None) -> WorkflowSpec:
    """Validate against base WorkflowSpec; allowed_actions = vertical whitelist."""
    steps = []
    for s in workflow_dict.get("steps", []):
        steps.append(WorkflowStep(
            id=s["id"],
            action=s["action"],
            args=s.get("args", {}),
            save_as=s.get("save_as"),
        ))
    spec = WorkflowSpec(
        vertical_id=str(workflow_dict.get("vertical_id", "")),
        version=str(workflow_dict.get("version", "1.0")),
        inputs=workflow_dict.get("inputs"),
        limits=workflow_dict.get("limits"),
        steps=steps,
    )
    if allowed_actions is not None:
        for s in spec.steps:
            if s.action not in allowed_actions:
                raise ValueError(f"Action '{s.action}' not in vertical whitelist")
    return spec


def run_workflow(
    workflow_json: dict,
    params: dict | None,
    run_id: str,
    pool_id: str,
    limits: dict | None,
    dry_run: bool,
    allowed_actions: frozenset | None = None,
    risk_callback: Optional[Callable[..., None]] = None,
    start_step_index: int = 0,
    initial_context: Optional[dict] = None,
    context_after_step_callback: Optional[Callable[[int, dict], None]] = None,
) -> RunResult:
    """
    Execute workflow steps; risk_callback(run_result, context) can set result.state=killed and result.failure_reason.
    If initial_context is provided, use it (replay from step N). start_step_index: skip steps before this.
    context_after_step_callback(step_index, context_copy) is called after each successful step.
    """
    allowed_actions = allowed_actions or BASE_VERTICAL_ACTIONS
    spec = validate_workflow(workflow_json, allowed_actions)
    if initial_context is not None:
        context = copy.deepcopy(initial_context)
        start_equity = float(context.get("_start_equity", 10000.0))
    else:
        context = dict(spec.inputs or {})
        context.update(params or {})
        start_equity = 10000.0
        context["_start_equity"] = start_equity
    max_steps = (limits or {}).get("max_steps") or (spec.limits or {}).get("max_steps") or 1000
    max_runtime_ms = (limits or {}).get("max_runtime_ms") or (spec.limits or {}).get("max_runtime_ms") or 60_000
    max_action_calls = (limits or {}).get("max_action_calls") or 500
    max_context_size_bytes = (limits or {}).get("max_context_size_bytes") or (spec.limits or {}).get("max_context_size_bytes") or 10_485_760
    max_step_output_size_bytes = (limits or {}).get("max_step_output_size_bytes") or (spec.limits or {}).get("max_step_output_size_bytes") or 524_288
    start_wall = time.perf_counter()
    step_logs: list[StepLog] = []
    steps_executed = 0
    risk_breaches = 0
    result = RunResult(state="succeeded", context=context, step_logs=step_logs, risk_breaches=0)

    inputs_payload = _normalize_json({"params": params, "workflow_inputs": spec.inputs, "run_limits": limits, "pool_id": pool_id})
    result.inputs_hash = _sha256(inputs_payload)
    result.workflow_hash = _sha256(_normalize_json(workflow_json))

    try:
        for i, step in enumerate(spec.steps):
            if i < start_step_index:
                continue
            if steps_executed >= max_steps:
                result.state = "killed"
                result.failure_reason = "max_steps"
                risk_breaches += 1
                break
            if (time.perf_counter() - start_wall) * 1000 > max_runtime_ms:
                result.state = "killed"
                result.failure_reason = "max_runtime_ms"
                risk_breaches += 1
                break
            if steps_executed >= max_action_calls:
                result.state = "killed"
                result.failure_reason = "max_action_calls"
                risk_breaches += 1
                break

            step_start = time.perf_counter()
            args_summary = {k: ("<ref>" if isinstance(v, dict) and v.get("ref") else v) for k, v in (step.args or {}).items()}
            step_logs.append(StepLog(step_id=step.id, action=step.action, event="step_started", args_summary=args_summary))

            try:
                value = execute_base_vertical_action(step.action, step.args or {}, context, run_id=run_id)
                if _json_size_bytes(value) > int(max_step_output_size_bytes):
                    raise ValueError("step_output_size_limit_exceeded")
                duration_ms = int((time.perf_counter() - step_start) * 1000)
                if step_logs:
                    step_logs[-1].event = "step_succeeded"
                    step_logs[-1].duration_ms = duration_ms
                save_key = (step.args or {}).get("save_as") or step.save_as
                if save_key:
                    context[save_key] = value
                    if _json_size_bytes(context) > int(max_context_size_bytes):
                        result.state = "killed"
                        result.failure_reason = "context_size_limit_exceeded"
                        risk_breaches += 1
                        break
                steps_executed += 1
                if context_after_step_callback:
                    context_after_step_callback(i, copy.deepcopy(context))
            except Exception as e:
                duration_ms = int((time.perf_counter() - step_start) * 1000)
                if step_logs:
                    step_logs[-1].event = "step_failed"
                    step_logs[-1].duration_ms = duration_ms
                    step_logs[-1].error = str(e)
                result.state = "failed"
                result.failure_reason = f"step {step.id} ({step.action}): {e}"
                break

            if risk_callback:
                risk_callback(result, context)
                if result.state == "killed":
                    risk_breaches += 1
                    break

        result.risk_breaches = risk_breaches
    except Exception as e:
        result.state = "failed"
        result.failure_reason = str(e)

    runtime_ms = int((time.perf_counter() - start_wall) * 1000)
    equity_curve = context.get("_equity_curve") or [start_equity]
    current_equity = equity_curve[-1] if equity_curve else start_equity
    pnl = current_equity - start_equity
    return_pct = (pnl / start_equity * 100) if start_equity else 0
    peak = start_equity
    max_dd = 0.0
    for e in equity_curve:
        if e > peak:
            peak = e
        dd = (peak - e) / peak if peak else 0
        if dd > max_dd:
            max_dd = dd
    result.metrics = {
        "pnl_amount": pnl,
        "return_pct": return_pct,
        "max_drawdown_pct": max_dd * 100,
        "steps_executed": steps_executed,
        "runtime_ms": runtime_ms,
        "risk_breaches": result.risk_breaches,
    }
    result.outputs_hash = _sha256(_normalize_json({"context_keys": [k for k in context if not k.startswith("_")], "metrics": result.metrics}))
    return result
