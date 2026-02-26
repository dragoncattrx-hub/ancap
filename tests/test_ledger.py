"""Ledger: deposit, withdraw, balance, allocate, events."""
import uuid

from tests.conftest import unique_name


def test_deposit_and_balance(client):
    pool = client.post(
        "/v1/pools",
        json={"name": unique_name("ledger_pool"), "risk_profile": "low"},
    )
    pool_id = pool.json()["id"]
    r = client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "pool_treasury",
            "account_owner_id": pool_id,
            "amount": {"amount": "1000", "currency": "VUSD"},
        },
    )
    assert r.status_code == 201
    r2 = client.get(
        "/v1/ledger/balance",
        params={"owner_type": "pool_treasury", "owner_id": pool_id},
    )
    assert r2.status_code == 200
    balances = r2.json()["balances"]
    vusd = next((b for b in balances if b["currency"] == "VUSD"), None)
    assert vusd is not None
    assert float(vusd["amount"]) == 1000


def test_ledger_events(client):
    pool = client.post(
        "/v1/pools",
        json={"name": unique_name("ev_pool"), "risk_profile": "medium"},
    )
    pool_id = pool.json()["id"]
    client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "pool_treasury",
            "account_owner_id": pool_id,
            "amount": {"amount": "500", "currency": "VUSD"},
        },
    )
    r = client.get("/v1/ledger/events", params={"limit": 10})
    assert r.status_code == 200
    assert "items" in r.json()


def test_allocate(client):
    pool = client.post(
        "/v1/pools",
        json={"name": unique_name("alloc_pool"), "risk_profile": "high"},
    )
    pool_id = pool.json()["id"]
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("a"), "public_key": "p" * 32, "roles": ["seller"]},
    )
    vert = client.post(
        "/v1/verticals/propose",
        json={
            "name": unique_name("v"),
            "spec": {
                "allowed_actions": [{"name": "a", "args_schema": {}}],
                "required_resources": ["data_feed"],
                "metrics": [{"name": "m", "value_schema": {}}],
                "risk_spec": {},
            },
        },
    )
    vid = vert.json()["id"]
    client.post(f"/v1/verticals/{vid}/review", json={"decision": "approve"})
    strat = client.post(
        "/v1/strategies",
        json={
            "name": unique_name("s"),
            "vertical_id": vid,
            "owner_agent_id": agent.json()["id"],
        },
    )
    strat_id = strat.json()["id"]
    r = client.post(
        "/v1/ledger/allocate",
        json={
            "pool_id": pool_id,
            "strategy_id": strat_id,
            "amount": {"amount": "100", "currency": "VUSD"},
        },
    )
    assert r.status_code == 201


def test_allocate_pool_not_found(client):
    """POST /v1/ledger/allocate with non-existent pool_id returns 404."""
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("anf"), "public_key": "k" * 32, "roles": ["seller"]},
    )
    vert = client.post(
        "/v1/verticals/propose",
        json={
            "name": unique_name("vnf"),
            "spec": {
                "allowed_actions": [{"name": "a", "args_schema": {}}],
                "required_resources": [],
                "metrics": [{"name": "m", "value_schema": {}}],
                "risk_spec": {},
            },
        },
    )
    vid = vert.json()["id"]
    client.post(f"/v1/verticals/{vid}/review", json={"decision": "approve"})
    strat = client.post(
        "/v1/strategies",
        json={"name": unique_name("snf"), "vertical_id": vid, "owner_agent_id": agent.json()["id"]},
    )
    r = client.post(
        "/v1/ledger/allocate",
        json={
            "pool_id": str(uuid.uuid4()),
            "strategy_id": strat.json()["id"],
            "amount": {"amount": "100", "currency": "VUSD"},
        },
    )
    assert r.status_code == 404
    assert "not found" in (r.json().get("detail") or "").lower()


def test_ledger_deposit_blocked_when_invariant_halted(client):
    """When tick has detected invariant violations, next deposit returns 503 (ROADMAP §3)."""
    pool = client.post(
        "/v1/pools",
        json={"name": unique_name("halt_pool"), "risk_profile": "low"},
    )
    pool_id = pool.json()["id"]
    # One deposit creates imbalance (sum != 0), so tick will set ledger_invariant_halted=true
    client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "pool_treasury",
            "account_owner_id": pool_id,
            "amount": {"amount": "100", "currency": "VUSD"},
        },
    )
    r_tick = client.post("/v1/system/jobs/tick")
    assert r_tick.status_code == 200
    assert r_tick.json().get("ledger_invariant_violations")
    status = client.get("/v1/system/ledger-invariant-status")
    assert status.status_code == 200
    assert status.json().get("halted") is True, "tick should set halted=true when violations exist"
    # Next deposit must be blocked
    r = client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "pool_treasury",
            "account_owner_id": pool_id,
            "amount": {"amount": "50", "currency": "VUSD"},
        },
    )
    assert r.status_code == 503
    assert "invariant" in (r.json().get("detail") or "").lower()
