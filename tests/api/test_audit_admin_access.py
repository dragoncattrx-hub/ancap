import uuid

from app.config import get_settings


def _register_user(client, email: str):
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "audit-admin-test"},
        headers={"Authorization": ""},
    )
    if res.status_code not in (200, 201):
        res = client.post(
            "/v1/auth/users",
            json={
                "email": f"audit_admin_{uuid.uuid4().hex[:10]}@example.com",
                "password": "password123",
                "display_name": "audit-admin-test",
            },
            headers={"Authorization": ""},
        )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200, me.text
    return me.json(), headers


def test_audit_log_requires_configured_platform_admin(client, monkeypatch):
    _, headers = _register_user(client, "audit_admin_cfg@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        res = client.get("/v1/admin/audit-log?days=7", headers=headers)
        assert res.status_code == 503, res.text
        assert res.json()["detail"] == "Platform admin access is not configured"

        export = client.get("/v1/admin/audit-log/export?days=7", headers=headers)
        assert export.status_code == 503, export.text
        assert export.json()["detail"] == "Platform admin access is not configured"
    finally:
        get_settings.cache_clear()


def test_audit_log_forbids_non_admin_user(client, monkeypatch):
    _, headers = _register_user(client, "audit_admin_forbid@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "00000000-0000-0000-0000-000000000001")
    get_settings.cache_clear()
    try:
        res = client.get("/v1/admin/audit-log?days=7", headers=headers)
        assert res.status_code == 403, res.text
        assert res.json()["detail"] == "Platform admin required"

        export = client.get("/v1/admin/audit-log/export?days=7", headers=headers)
        assert export.status_code == 403, export.text
        assert export.json()["detail"] == "Platform admin required"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()


def test_audit_log_admin_can_read_and_export(client, monkeypatch):
    admin_user, headers = _register_user(client, "audit_admin_ok@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin_user["id"])
    get_settings.cache_clear()
    try:
        res = client.get("/v1/admin/audit-log?days=7&limit=10", headers=headers)
        assert res.status_code == 200, res.text
        payload = res.json()
        assert "items" in payload
        assert "total" in payload
        assert isinstance(payload["items"], list)

        export = client.get("/v1/admin/audit-log/export?days=7", headers=headers)
        assert export.status_code == 200, export.text
        assert "text/csv" in export.headers.get("content-type", "")
        assert "id,type,event_type" in export.text
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
