"""Metrics and evaluations."""
from tests.conftest import unique_name

VERTICAL_SPEC = {
    "allowed_actions": [{"name": "m", "args_schema": {}}],
    "required_resources": ["data_feed"],
    "metrics": [{"name": "mock_pnl", "value_schema": {"type": "number"}}],
    "risk_spec": {},
}

# BaseVertical workflow that succeeds and produces metrics (return_pct, etc.)
BASE_WORKFLOW = {
    "vertical_id": "",
    "version": "1.0",
    "steps": [
        {"id": "s1", "action": "const", "args": {"value": 1}, "save_as": "x"},
        {"id": "s2", "action": "math_add", "args": {"a": {"ref": "x"}, "b": 2}},
    ],
}


def test_metrics_for_run(client):
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("met_agent"), "public_key": "m" * 32, "roles": ["seller"]},
    )
    vert = client.post(
        "/v1/verticals/propose",
        json={"name": unique_name("met_v"), "spec": VERTICAL_SPEC},
    )
    vid = vert.json()["id"]
    client.post(f"/v1/verticals/{vid}/review", json={"decision": "approve"})
    strat = client.post(
        "/v1/strategies",
        json={"name": unique_name("met_s"), "vertical_id": vid, "owner_agent_id": agent.json()["id"]},
    )
    ver = client.post(
        f"/v1/strategies/{strat.json()['id']}/versions",
        json={"semver": "0.1.0", "workflow": {"vertical_id": vid, "version": "1.0", "steps": [{"id": "s1", "action": "m", "args": {}}]}},
    )
    pool = client.post("/v1/pools", json={"name": unique_name("met_p"), "risk_profile": "low"})
    run = client.post(
        "/v1/runs",
        json={"strategy_version_id": ver.json()["id"], "pool_id": pool.json()["id"]},
    )
    run_id = run.json()["id"]
    r = client.get("/v1/metrics", params={"run_id": run_id})
    assert r.status_code == 200
    assert "items" in r.json()


def test_evaluation_not_found(client):
    """Evaluation is optional - 404 when no evaluation exists for a version."""
    import uuid
    r = client.get(f"/v1/evaluations/{uuid.uuid4()}")
    assert r.status_code == 404


def test_evaluation_after_successful_run(client, base_vertical_id):
    """After a successful run (BaseVertical), GET /v1/evaluations/{version_id} returns evaluation."""
    vid = base_vertical_id
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("ev_agent"), "public_key": "e" * 32, "roles": ["seller"]},
    )
    workflow = {**BASE_WORKFLOW, "vertical_id": vid}
    strat = client.post(
        "/v1/strategies",
        json={"name": unique_name("ev_s"), "vertical_id": vid, "owner_agent_id": agent.json()["id"]},
    )
    ver = client.post(
        f"/v1/strategies/{strat.json()['id']}/versions",
        json={"semver": "0.1.0", "workflow": workflow},
    )
    version_id = ver.json()["id"]
    pool = client.post("/v1/pools", json={"name": unique_name("ev_p"), "risk_profile": "low"})
    run_r = client.post(
        "/v1/runs",
        json={"strategy_version_id": version_id, "pool_id": pool.json()["id"]},
    )
    assert run_r.status_code == 201
    assert run_r.json()["state"] == "succeeded"
    r = client.get(f"/v1/evaluations/{version_id}")
    assert r.status_code == 200
    data = r.json()
    assert "score" in data
    assert "strategy_version_id" in data
    assert data["strategy_version_id"] == version_id
