"""System and health endpoints."""


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data["service"] == "ANCAP Core API"
    assert "version" in data


def test_health(client):
    r = client.get("/v1/system/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_jobs_tick(client):
    """POST /v1/system/jobs/tick runs incremental jobs (edges_daily, agent_relationships, auto_*)."""
    r = client.post("/v1/system/jobs/tick")
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert "edges_daily_orders_processed" in data
    assert isinstance(data["edges_daily_orders_processed"], int)
    assert "agent_relationships_orders_processed" in data
    assert isinstance(data["agent_relationships_orders_processed"], int)
    assert "circuit_breaker_by_metric" in data
    assert data["circuit_breaker_by_metric"].keys() >= {"evaluated", "tripped"}
    assert "reputation_recomputed" in data
    assert isinstance(data["reputation_recomputed"], int)
    assert "ledger_invariant_violations" in data
    assert isinstance(data["ledger_invariant_violations"], list)


def test_openapi_schema(client):
    """GET /openapi.json returns valid OpenAPI 3 schema with paths."""
    r = client.get("/openapi.json")
    assert r.status_code == 200
    data = r.json()
    assert data.get("openapi", "").startswith("3.")
    assert "paths" in data
    assert "info" in data
    assert data.get("info", {}).get("title") == "ANCAP Core API"
