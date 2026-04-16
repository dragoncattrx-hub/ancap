"""L3: Stake-to-activate — registration leaves activated_at=None when required; stake activates; runs/listings require activation."""
from app.config import get_settings
from tests.conftest import unique_name


def _enable_stake_to_activate(monkeypatch, amount: str = "100"):
    monkeypatch.setenv("STAKE_TO_ACTIVATE_AMOUNT", amount)
    # Match ledger deposits in these tests (VUSD); default app currency for stake-to-activate is ACP.
    monkeypatch.setenv("STAKE_TO_ACTIVATE_CURRENCY", "VUSD")
    get_settings.cache_clear()


def _disable_stake_to_activate(monkeypatch):
    monkeypatch.setenv("STAKE_TO_ACTIVATE_AMOUNT", "0")
    get_settings.cache_clear()


def test_register_agent_when_stake_required_has_activated_at_none(client, monkeypatch):
    _enable_stake_to_activate(monkeypatch)
    try:
        r = client.post(
            "/v1/agents",
            json={
                "display_name": unique_name("stake_req"),
                "public_key": "p" * 32,
                "roles": ["seller"],
            },
        )
        assert r.status_code == 201
        data = r.json()
        assert data.get("activated_at") is None
    finally:
        _disable_stake_to_activate(monkeypatch)


def test_run_forbidden_when_stake_required_and_agent_not_activated(client, monkeypatch, base_vertical_id):
    _enable_stake_to_activate(monkeypatch)
    try:
        agent = client.post(
            "/v1/agents",
            json={"display_name": unique_name("stake_run"), "public_key": "r" * 32, "roles": ["seller"]},
        )
        assert agent.status_code == 201
        agent_id = agent.json()["id"]
        workflow = {
            "vertical_id": base_vertical_id,
            "version": "1.0",
            "steps": [
                {"id": "s1", "action": "const", "args": {"value": 1}, "save_as": "x"},
                {"id": "s2", "action": "math_add", "args": {"a": {"ref": "x"}, "b": 2}},
            ],
        }
        strat = client.post(
            "/v1/strategies",
            json={"name": unique_name("stake_s"), "vertical_id": base_vertical_id, "owner_agent_id": agent_id},
        )
        assert strat.status_code == 201
        ver = client.post(
            f"/v1/strategies/{strat.json()['id']}/versions",
            json={"semver": "0.1.0", "workflow": workflow},
        )
        assert ver.status_code == 201
        pool = client.post("/v1/pools", json={"name": unique_name("stake_p"), "risk_profile": "low"})
        assert pool.status_code == 201
        r = client.post(
            "/v1/runs",
            json={"strategy_version_id": ver.json()["id"], "pool_id": pool.json()["id"]},
            headers={"Idempotency-Key": unique_name("idk_stake_forbid_run")},
        )
        assert r.status_code == 403
        assert "stake to activate" in (r.json().get("detail") or "").lower()
    finally:
        _disable_stake_to_activate(monkeypatch)


def test_listing_forbidden_when_stake_required_and_agent_not_activated(client, monkeypatch, base_vertical_id):
    _enable_stake_to_activate(monkeypatch)
    try:
        agent = client.post(
            "/v1/agents",
            json={"display_name": unique_name("stake_li"), "public_key": "l" * 32, "roles": ["seller"]},
        )
        assert agent.status_code == 201
        agent_id = agent.json()["id"]
        workflow = {
            "vertical_id": base_vertical_id,
            "version": "1.0",
            "steps": [{"id": "s1", "action": "const", "args": {"value": 1}, "save_as": "x"}],
        }
        strat = client.post(
            "/v1/strategies",
            json={"name": unique_name("stake_ls"), "vertical_id": base_vertical_id, "owner_agent_id": agent_id},
        )
        assert strat.status_code == 201
        ver = client.post(
            f"/v1/strategies/{strat.json()['id']}/versions",
            json={"semver": "0.1.0", "workflow": workflow},
        )
        assert ver.status_code == 201
        r = client.post(
            "/v1/listings",
            json={
                "strategy_id": strat.json()["id"],
                "strategy_version_id": ver.json()["id"],
                "fee_model": {"type": "one_time", "one_time_price": {"amount": "0", "currency": "VUSD"}},
                "status": "active",
            },
        )
        assert r.status_code == 403
        assert "stake to activate" in (r.json().get("detail") or "").lower()
    finally:
        _disable_stake_to_activate(monkeypatch)


def test_stake_activates_agent_then_run_allowed(client, monkeypatch, base_vertical_id):
    _enable_stake_to_activate(monkeypatch)
    try:
        agent = client.post(
            "/v1/agents",
            json={"display_name": unique_name("stake_act"), "public_key": "a" * 32, "roles": ["seller"]},
        )
        assert agent.status_code == 201
        agent_id = agent.json()["id"]
        assert agent.json().get("activated_at") is None
        client.post(
            "/v1/ledger/deposit",
            json={
                "account_owner_type": "agent",
                "account_owner_id": agent_id,
                "amount": {"amount": "100", "currency": "VUSD"},
            },
            headers={"Idempotency-Key": unique_name("idk_stake_dep")},
        )
        key = client.post("/v1/keys", json={"agent_id": agent_id})
        assert key.status_code == 201
        api_key = key.json()["key"]
        stake_r = client.post(
            "/v1/stakes",
            json={"amount": "100", "currency": "VUSD"},
            headers={"X-API-Key": api_key},
        )
        assert stake_r.status_code == 201
        get_agent = client.get(f"/v1/agents/{agent_id}")
        assert get_agent.status_code == 200
        assert get_agent.json().get("activated_at") is not None
        workflow = {
            "vertical_id": base_vertical_id,
            "version": "1.0",
            "steps": [
                {"id": "s1", "action": "const", "args": {"value": 1}, "save_as": "x"},
                {"id": "s2", "action": "math_add", "args": {"a": {"ref": "x"}, "b": 2}},
            ],
        }
        strat = client.post(
            "/v1/strategies",
            json={"name": unique_name("stake_ok"), "vertical_id": base_vertical_id, "owner_agent_id": agent_id},
        )
        ver = client.post(
            f"/v1/strategies/{strat.json()['id']}/versions",
            json={"semver": "0.1.0", "workflow": workflow},
        )
        pool = client.post("/v1/pools", json={"name": unique_name("stake_okp"), "risk_profile": "low"})
        run_r = client.post(
            "/v1/runs",
            json={"strategy_version_id": ver.json()["id"], "pool_id": pool.json()["id"]},
            headers={"Idempotency-Key": unique_name("idk_stake_run_ok")},
        )
        assert run_r.status_code == 201
    finally:
        _disable_stake_to_activate(monkeypatch)
