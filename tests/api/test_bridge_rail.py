"""Bridge rail HTTP surface (public read paths).

Use the session-scoped ``client`` with ``Authorization: ""`` — not ``client_unauth``.
A second ``TestClient`` uses a different asyncio loop and breaks asyncpg with the
shared engine (see tests/conftest.py).
"""


def test_bridge_status_public_ok(client):
    r = client.get("/v1/bridge/status", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("bridge_rail_enabled") is False
    assert "counts_by_status" in data
    assert "checkpoint_acp" in data
    assert "checkpoint_bsc" in data


def test_bridge_reserve_summary_disabled_503(client):
    r = client.get("/v1/bridge/reserve-summary", headers={"Authorization": ""})
    assert r.status_code == 503


def test_wacp_reserve_proof_public_ok(client):
    r = client.get("/v1/bridge/wacp/reserve-proof", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "status" in data
    assert "reserve_health" in data
    assert "wacp_total_supply_wei" in data
    assert "notes" in data


def test_wacp_status_public_ok(client):
    r = client.get("/v1/bridge/wacp/status", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "status" in data
    assert "docs" in data
    assert data["docs"]["overview"].endswith("/docs/wacp")
    assert "pair_live" in data
    assert "token_metadata_live" in data
    assert "reserve_proof_status" in data
    assert "reserve_health" in data


def test_wacp_exact_public_paths_ok(client):
    r1 = client.get("/v1/wacp/reserve-proof", headers={"Authorization": ""})
    assert r1.status_code == 200, r1.text
    r2 = client.get("/v1/wacp/status", headers={"Authorization": ""})
    assert r2.status_code == 200, r2.text


def test_quote_bsc_to_acp_floor_and_remainder(client):
    r = client.post("/v1/bridge/quote/bsc-to-acp", json={"amount_wacp": "1.0000000001"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["amount_wacp_wei"] == "1000000000100000000"
    assert data["acp_smallest_floor"] == "100000000"
    assert data["acp_amount_floor"] == "1"
    assert data["remainder_wacp_wei"] == "100000000"


def test_wacp_reserve_proof_live_balance_path(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_RESERVE_ACP_ADDRESS", "acp1qreserve0000000000000000000000000000000")
    monkeypatch.setenv("BRIDGE_WACP_CONTRACT", "0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402")
    from app.config import get_settings
    get_settings.cache_clear()

    import app.api.routers.bridge_rail as bridge_rail

    async def fake_scalar(*args, **kwargs):
        return 1000000000000000000

    class _FakeSession:
        async def scalar(self, *args, **kwargs):
            return 1000000000000000000

        async def get(self, *args, **kwargs):
            return None

        async def rollback(self):
            return None

    def fake_require_rpc_url():
        return "http://fake-rpc"

    def fake_run_walletd(args, timeout_s=180):
        return {"address": "acp1qreserve0000000000000000000000000000000", "units": "200000000", "acp": "2", "utxo_count": 1}

    from app.api.routers import wallet_acp
    original_require = wallet_acp._require_acp_rpc_url
    original_run = wallet_acp._run_walletd
    wallet_acp._require_acp_rpc_url = fake_require_rpc_url
    wallet_acp._run_walletd = fake_run_walletd
    try:
        import anyio
        data = anyio.run(bridge_rail._live_reserve_proof_payload, _FakeSession())
    finally:
        wallet_acp._require_acp_rpc_url = original_require
        wallet_acp._run_walletd = original_run

    assert data.acp_reserve_balance_smallest == "200000000"
    assert data.wacp_total_supply_acp_smallest == "100000000"
    assert data.backing_ratio == "2"
    assert data.status == "healthy"
    assert data.reserve_health == "healthy"


def test_create_redeem_intent_bsc_to_acp(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x1111111111111111111111111111111111111111",
        "user_acp_address": "acp1qtestredeemaddress0000000000000000000000000",
        "amount_wacp": "1.0000000001",
    }
    r = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["direction"] == "bsc_to_acp"
    assert data["status"] == "PENDING_BURN"
    assert data["amount_wacp_wei"] == "1000000000100000000"
    assert data["amount_acp_smallest"] == "100000000"
    assert data["remainder_wacp_wei"] == "100000000"
    assert data["bsc_tx_hash_burn"] is None


def test_list_my_intents_includes_redeem_direction(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x2222222222222222222222222222222222222222",
        "user_acp_address": "acp1qredeemlist000000000000000000000000000000",
        "amount_wacp": "0.5",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text

    r = client.get("/v1/bridge/intents/me")
    assert r.status_code == 200, r.text
    data = r.json()
    assert any(op["direction"] == "bsc_to_acp" for op in data)
