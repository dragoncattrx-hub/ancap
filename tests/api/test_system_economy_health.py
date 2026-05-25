import uuid

from app.config import get_settings


_SYSTEM_OPS_PATHS = (
    "/v1/internal/ops/diagnostics",
    "/v1/internal/ops/deep-health",
    "/v1/internal/ops/economy-health",
)


def _register_user(client, email: str):
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "system-ops-test"},
        headers={"Authorization": ""},
    )
    if res.status_code not in (200, 201):
        res = client.post(
            "/v1/auth/users",
            json={
                "email": f"system_ops_{uuid.uuid4().hex[:10]}@example.com",
                "password": password,
                "display_name": "system-ops-test",
            },
            headers={"Authorization": ""},
        )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200, me.text
    return me.json(), headers


def test_system_ops_endpoints_require_configured_platform_admin(client, monkeypatch):
    _, headers = _register_user(client, "system_ops_cfg@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        for path in _SYSTEM_OPS_PATHS:
            res = client.get(path, headers=headers)
            assert res.status_code == 503, res.text
            assert res.json()["detail"] == "Platform admin access is not configured"
    finally:
        get_settings.cache_clear()


def test_system_ops_endpoints_forbid_non_admin_user(client, monkeypatch):
    _, headers = _register_user(client, "system_ops_forbid@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "00000000-0000-0000-0000-000000000001")
    get_settings.cache_clear()
    try:
        for path in _SYSTEM_OPS_PATHS:
            res = client.get(path, headers=headers)
            assert res.status_code == 403, res.text
            assert res.json()["detail"] == "Platform admin required"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()


def test_system_ops_shapes_for_platform_admin(client, monkeypatch):
    admin_user, headers = _register_user(client, "system_ops_admin@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin_user["id"])
    monkeypatch.setenv("ACP_RPC_URL", "")
    get_settings.cache_clear()
    try:
        diagnostics = client.get("/v1/internal/ops/diagnostics", headers=headers)
        assert diagnostics.status_code == 200, diagnostics.text
        diag_payload = diagnostics.json()
        assert diag_payload["status"] == "ok"
        assert "currencies" in diag_payload
        assert "acp" in diag_payload

        deep_health = client.get("/v1/internal/ops/deep-health", headers=headers)
        assert deep_health.status_code == 200, deep_health.text
        deep_payload = deep_health.json()
        assert deep_payload["status"] in {"ok", "degraded"}
        assert deep_payload["checks"].keys() >= {"database", "redis", "llm", "acp_rpc"}

        economy = client.get("/v1/internal/ops/economy-health", headers=headers)
        assert economy.status_code == 200, economy.text
        economy_payload = economy.json()
        assert "acp_rpc_ok" in economy_payload
        assert "ledger_halted" in economy_payload
        assert "pending_swaps" in economy_payload
        assert "pending_referral_payout_jobs" in economy_payload
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
