import uuid

from app.config import get_settings


def _register_user(client, email: str):
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "bridge-admin-test"},
        headers={"Authorization": ""},
    )
    if res.status_code not in (200, 201):
        res = client.post(
            "/v1/auth/users",
            json={
                "email": f"bridge_admin_{uuid.uuid4().hex[:10]}@example.com",
                "password": password,
                "display_name": "bridge-admin-test",
            },
            headers={"Authorization": ""},
        )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_bridge_admin_requires_configured_platform_admin_even_with_operator_secret(client, monkeypatch):
    headers = _register_user(client, "bridge_admin_cfg@example.com")
    headers["X-Bridge-Operator-Secret"] = "test-secret"

    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        res = client.get("/v1/bridge/admin/reverse/liability", headers=headers)
        assert res.status_code == 503, res.text
        assert res.json()["detail"] == "Platform admin access is not configured"
    finally:
        get_settings.cache_clear()


def test_bridge_admin_requires_platform_admin_before_operator_secret(client, monkeypatch):
    headers = _register_user(client, "bridge_admin_forbid@example.com")
    headers["X-Bridge-Operator-Secret"] = "test-secret"

    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "00000000-0000-0000-0000-000000000001")
    get_settings.cache_clear()
    try:
        res = client.get("/v1/bridge/admin/reverse/liability", headers=headers)
        assert res.status_code == 403, res.text
        assert res.json()["detail"] == "Platform admin required"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()


def test_bridge_admin_requires_operator_secret_for_platform_admin(client, monkeypatch):
    email = "bridge_admin_secret@example.com"
    headers = _register_user(client, email)

    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        me = client.get("/v1/users/me", headers=headers)
        assert me.status_code == 200, me.text
        admin_id = me.json()["id"]

        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin_id)
        get_settings.cache_clear()

        no_secret = client.get("/v1/bridge/admin/reverse/liability", headers=headers)
        assert no_secret.status_code == 403, no_secret.text
        assert no_secret.json()["detail"] == "Invalid bridge operator secret"

        bad_secret = client.get(
            "/v1/bridge/admin/reverse/liability",
            headers={**headers, "X-Bridge-Operator-Secret": "wrong-secret"},
        )
        assert bad_secret.status_code == 403, bad_secret.text
        assert bad_secret.json()["detail"] == "Invalid bridge operator secret"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
