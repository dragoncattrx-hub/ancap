"""Mobile ACP Wallet public API tests."""

import app.api.routers.mobile_acp as mobile_acp
from app.services import rate_limit as rl_module


def test_mobile_config_ok(client):
    r = client.get("/v1/mobile/config")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["minAppVersion"] == "1.0.0"
    assert data["acpDecimals"] == 8
    assert data["wacpDecimals"] == 18
    assert "docs" in data
    assert data["docs"]["bridge"].startswith("https://")


def test_mobile_health(client):
    r = client.get("/v1/mobile/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_acp_network_status(client, monkeypatch):
    monkeypatch.setattr(mobile_acp.wallet_acp, "_rpc_call", lambda *a, **k: 42)
    r = client.get("/v1/acp/network/status")
    assert r.status_code == 200
    data = r.json()
    assert data["rpcStatus"] == "ok"
    assert data["blockHeight"] == 42
    assert data["minFeeAcp"]


def test_acp_address_balance(client, monkeypatch):
    monkeypatch.setattr(
        mobile_acp.wallet_acp,
        "_load_balance_result",
        lambda addr: {"address": addr, "units": "100000000", "acp": "1", "utxo_count": 1},
    )
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    r = client.get(f"/v1/acp/address/{addr}/balance")
    assert r.status_code == 200
    data = r.json()
    assert data["address"] == addr
    assert data["acp"] == "1"
    assert data["utxo_count"] == 1


def test_acp_address_balance_invalid(client):
    r = client.get("/v1/acp/address/not-an-address/balance")
    assert r.status_code == 400


def test_acp_estimate_fee(client):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    r = client.post(
        "/v1/acp/tx/estimate-fee",
        json={"from": addr, "to": addr, "amountAcp": "1"},
    )
    assert r.status_code == 200
    assert r.json()["feeAcp"]


def test_acp_broadcast_invalid_hex(client, monkeypatch):
    monkeypatch.setattr(mobile_acp.wallet_acp, "_require_acp_rpc_url", lambda: "http://rpc.test")
    r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "gg" * 20})
    assert r.status_code == 400


def test_acp_broadcast_ok(client, monkeypatch):
    monkeypatch.setattr(mobile_acp.wallet_acp, "_require_acp_rpc_url", lambda: "http://rpc.test")
    monkeypatch.setattr(
        mobile_acp.wallet_acp,
        "_rpc_call",
        lambda *a, **k: {"accepted": True, "txid": "abc123"},
    )
    r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "deadbeef" * 8})
    assert r.status_code == 200
    data = r.json()
    assert data["accepted"] is True
    assert data["txid"] == "abc123"


def test_acp_broadcast_rate_limited(client, monkeypatch):
    """Exhaust the per-IP broadcast limit; subsequent requests return 429.

    rate_limit.py is configured to use its in-memory fallback when REDIS_URL
    is empty (the default). The per-IP key is built from the test client's IP.
    """
    monkeypatch.setattr(mobile_acp.wallet_acp, "_require_acp_rpc_url", lambda: "http://rpc.test")
    monkeypatch.setattr(
        mobile_acp.wallet_acp,
        "_rpc_call",
        lambda *a, **k: {"accepted": True, "txid": "abc123"},
    )

    # Ensure clean in-memory state before the test
    rl_module.clear_rate_limit_state()

    # Limit = mobile_broadcast_rate_limit_per_minute = 10 per minute
    limit = 10
    for i in range(limit):
        r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "deadbeef" * 8})
        assert r.status_code == 200, f"request {i+1} should succeed, got {r.status_code}: {r.text}"

    # Next one must be rate-limited
    r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "deadbeef" * 8})
    assert r.status_code == 429, r.text
    assert r.json()["detail"]["code"] == "RATE_LIMITED"
    assert "retry_after_seconds" in r.json()["detail"]
