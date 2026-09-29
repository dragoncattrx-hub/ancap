"""Platform admin email allowlist + metrics auth."""
import uuid

from app.config import get_settings


def _register_user(client, email: str):
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "plat-admin-test"},
        headers={"Authorization": ""},
    )
    if res.status_code not in (200, 201):
        res = client.post(
            "/v1/auth/users",
            json={
                "email": f"plat_admin_{uuid.uuid4().hex[:10]}@example.com",
                "password": password,
                "display_name": "plat-admin-test",
            },
            headers={"Authorization": ""},
        )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200, me.text
    return me.json(), headers


def test_metrics_requires_auth(client):
    res = client.get("/v1/metrics", headers={"Authorization": ""})
    assert res.status_code in (401, 403, 503), res.text


def test_growth_metrics_requires_auth(client):
    res = client.get("/v1/system/growth-metrics", headers={"Authorization": ""})
    assert res.status_code in (401, 403, 503), res.text


def test_metrics_scrape_token(client, monkeypatch):
    monkeypatch.setenv("METRICS_SCRAPE_TOKEN", "scrape-test-token")
    get_settings.cache_clear()
    try:
        denied = client.get("/v1/metrics", headers={"Authorization": ""})
        assert denied.status_code in (401, 403, 503), denied.text
        ok = client.get(
            "/v1/metrics",
            headers={"Authorization": "", "X-Metrics-Token": "scrape-test-token"},
        )
        assert ok.status_code == 200, ok.text
    finally:
        monkeypatch.setenv("METRICS_SCRAPE_TOKEN", "")
        get_settings.cache_clear()


def test_platform_admin_by_email(client, monkeypatch):
    user, headers = _register_user(client, "email_admin@example.com")
    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    monkeypatch.setenv("PLATFORM_ADMIN_EMAILS", user["email"])
    get_settings.cache_clear()
    try:
        res = client.get("/v1/platform-admin/overview", headers=headers)
        assert res.status_code == 200, res.text
        body = res.json()
        assert "users_total" in body
        assert "redis_ok" in body
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_EMAILS", "")
        get_settings.cache_clear()


def test_platform_admin_users_list(client, monkeypatch):
    user, headers = _register_user(client, "email_admin_users@example.com")
    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", user["id"])
    get_settings.cache_clear()
    try:
        res = client.get("/v1/platform-admin/users?limit=10", headers=headers)
        assert res.status_code == 200, res.text
        body = res.json()
        assert "items" in body
        assert body["total"] >= 1
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
