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
