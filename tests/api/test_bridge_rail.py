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


def test_wacp_exact_public_paths_ok(client):
    r1 = client.get("/v1/wacp/reserve-proof", headers={"Authorization": ""})
    assert r1.status_code == 200, r1.text
    r2 = client.get("/v1/wacp/status", headers={"Authorization": ""})
    assert r2.status_code == 200, r2.text
