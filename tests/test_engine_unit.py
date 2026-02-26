"""Unit tests for workflow interpreter and BaseVertical actions (no DB)."""
import pytest
from app.engine.interpreter import validate_workflow, run_workflow
from app.engine.actions.base_vertical import execute_base_vertical_action, BASE_VERTICAL_ACTIONS


def test_workflow_schema_validation():
    w = {"vertical_id": "v1", "version": "1.0", "steps": [{"id": "s1", "action": "const", "args": {"value": 1}}]}
    spec = validate_workflow(w, allowed_actions=BASE_VERTICAL_ACTIONS)
    assert spec.version == "1.0"
    assert len(spec.steps) == 1
    assert spec.steps[0].action == "const"


def test_workflow_validation_rejects_unknown_action():
    w = {"vertical_id": "v1", "version": "1.0", "steps": [{"id": "s1", "action": "exec_code", "args": {}}]}
    with pytest.raises(ValueError, match="not in vertical whitelist"):
        validate_workflow(w, allowed_actions=BASE_VERTICAL_ACTIONS)


def test_action_math():
    ctx = {}
    assert execute_base_vertical_action("math_add", {"a": 1, "b": 2}, ctx) == 3
    assert execute_base_vertical_action("math_mul", {"a": 3, "b": 4}, ctx) == 12
    assert execute_base_vertical_action("math_div", {"a": 10, "b": 2}, ctx) == 5
    assert execute_base_vertical_action("math_div", {"a": 1, "b": 0}, ctx) == 0


def test_action_cmp_and_if():
    ctx = {}
    assert execute_base_vertical_action("cmp", {"op": "lt", "a": 1, "b": 2}, ctx) is True
    assert execute_base_vertical_action("if", {"cond": True, "then": "yes", "else": "no"}, ctx) == "yes"
    assert execute_base_vertical_action("if", {"cond": False, "then": "yes", "else": "no"}, ctx) == "no"


def test_action_rand_deterministic_with_seed():
    ctx = {}
    r1 = execute_base_vertical_action("rand_uniform", {"low": 0, "high": 1, "seed": 42}, ctx)
    r2 = execute_base_vertical_action("rand_uniform", {"low": 0, "high": 1, "seed": 42}, ctx)
    assert r1 == r2
    assert 0 <= r1 <= 1


def test_run_workflow_max_steps_kill():
    w = {
        "vertical_id": "v",
        "version": "1.0",
        "steps": [{"id": f"s{i}", "action": "const", "args": {"value": i}} for i in range(5)],
    }
    result = run_workflow(
        workflow_json=w,
        params={},
        run_id="test-run",
        pool_id="pool",
        limits={"max_steps": 2},
        dry_run=True,
    )
    assert result.state == "killed"
    assert result.failure_reason == "max_steps"
    assert result.metrics["steps_executed"] == 2
    assert result.risk_breaches >= 1


def test_portfolio_sell_price_zero_no_op():
    """portfolio_sell with price=0 returns skipped and does not change portfolio."""
    context = {"_start_equity": 10000.0}
    execute_base_vertical_action("portfolio_buy", {"asset": "X", "amount": 10, "price": 100}, context)
    assert context["_portfolio"]["X"]["qty"] == 10
    out = execute_base_vertical_action("portfolio_sell", {"asset": "X", "amount": 5, "price": 0}, context)
    assert out.get("skipped") is True
    assert context["_portfolio"]["X"]["qty"] == 10
    assert out.get("qty") == 0


def test_run_workflow_success_simple():
    w = {
        "vertical_id": "v",
        "version": "1.0",
        "steps": [
            {"id": "s1", "action": "const", "args": {"value": 42}, "save_as": "x"},
            {"id": "s2", "action": "math_add", "args": {"a": {"ref": "x"}, "b": 8}},
        ],
    }
    result = run_workflow(
        workflow_json=w,
        params={},
        run_id="test",
        pool_id="p",
        limits={},
        dry_run=True,
    )
    assert result.state == "succeeded"
    assert result.context.get("x") == 42
    assert result.metrics["steps_executed"] == 2
    assert "pnl_amount" in result.metrics
    assert result.inputs_hash
    assert result.workflow_hash
    assert result.outputs_hash
