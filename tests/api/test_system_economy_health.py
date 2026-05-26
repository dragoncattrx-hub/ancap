import uuid

from app.api.routers import system as system_router
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


def test_public_health_full_does_not_schedule_external_probe_refresh(client, monkeypatch):
    llm_schedule_calls: list[str] = []
    acp_schedule_calls: list[str] = []

    monkeypatch.setitem(system_router._llm_probe_cache, "expires_at", 0.0)
    monkeypatch.setitem(system_router._acp_rpc_probe_cache, "expires_at", 0.0)
    monkeypatch.setattr(system_router, "_schedule_llm_probe_refresh", lambda: llm_schedule_calls.append("llm"))
    monkeypatch.setattr(system_router, "_schedule_acp_rpc_probe_refresh", lambda: acp_schedule_calls.append("acp"))

    health = client.get("/v1/system/health/full")
    assert health.status_code == 200, health.text
    payload = health.json()
    assert payload["status"] in {"ok", "degraded"}
    assert payload["checks"].keys() >= {"database", "redis", "llm", "mail", "bridge"}
    assert llm_schedule_calls == []
    assert acp_schedule_calls == []


def test_internal_deep_health_schedules_cached_external_probe_refresh(client, monkeypatch):
    admin_user, headers = _register_user(client, "system_ops_cached_refresh@example.com")

    llm_schedule_calls: list[str] = []
    acp_schedule_calls: list[str] = []

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin_user["id"])
    monkeypatch.setenv("ACP_RPC_URL", "")
    monkeypatch.setitem(system_router._llm_probe_cache, "expires_at", 0.0)
    monkeypatch.setitem(system_router._llm_probe_cache, "value", {"status": "unknown", "error": None, "checked_at": None})
    monkeypatch.setitem(system_router._acp_rpc_probe_cache, "expires_at", 0.0)
    monkeypatch.setitem(system_router._acp_rpc_probe_cache, "value", {"status": "disabled", "ok": False, "error": None, "checked_at": None})
    monkeypatch.setattr(system_router, "_schedule_llm_probe_refresh", lambda: llm_schedule_calls.append("llm"))
    monkeypatch.setattr(system_router, "_schedule_acp_rpc_probe_refresh", lambda: acp_schedule_calls.append("acp"))
    get_settings.cache_clear()
    try:
        deep_health = client.get("/v1/internal/ops/deep-health", headers=headers)
        assert deep_health.status_code == 200, deep_health.text
        payload = deep_health.json()
        assert payload["status"] in {"ok", "degraded"}
        assert payload["checks"].keys() >= {"database", "redis", "llm", "acp_rpc"}
        assert llm_schedule_calls == ["llm"]
        assert acp_schedule_calls == ["acp"]
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        monkeypatch.setenv("ACP_RPC_URL", "")
        get_settings.cache_clear()


def test_internal_deep_health_marks_llm_degraded_until_probe_succeeds(client, monkeypatch):
    admin_user, headers = _register_user(client, "system_ops_llm_probe_required@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin_user["id"])
    monkeypatch.setenv("LLM_PROVIDER", "teneta_claude")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "real-test-key")
    monkeypatch.setenv("ANTHROPIC_BASE_URL", "https://llm.example.test")
    monkeypatch.setenv("ACP_RPC_URL", "")
    monkeypatch.setitem(system_router._llm_probe_cache, "expires_at", 9999999999.0)
    monkeypatch.setitem(system_router._llm_probe_cache, "value", {"status": "degraded", "error": "HTTP 500", "checked_at": 1234567890})
    monkeypatch.setitem(system_router._acp_rpc_probe_cache, "expires_at", 9999999999.0)
    monkeypatch.setitem(system_router._acp_rpc_probe_cache, "value", {"status": "disabled", "ok": False, "error": None, "checked_at": 1234567890})
    get_settings.cache_clear()
    try:
        deep_health = client.get("/v1/internal/ops/deep-health", headers=headers)
        assert deep_health.status_code == 200, deep_health.text
        payload = deep_health.json()
        assert payload["status"] == "degraded"
        assert payload["checks"]["llm"]["configured"] is True
        assert payload["checks"]["llm"]["probe_status"] == "degraded"
        assert payload["checks"]["llm"]["ok"] is False
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        monkeypatch.setenv("LLM_PROVIDER", "")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "")
        monkeypatch.setenv("ANTHROPIC_BASE_URL", "")
        monkeypatch.setenv("ACP_RPC_URL", "")
        get_settings.cache_clear()
