from app.config import get_settings


def _register_user(client):
    res = client.post(
        "/v1/auth/users",
        json={
            "email": "admin_access_test@example.com",
            "password": "password123",
            "display_name": "admin-access-test",
        },
        headers={"Authorization": ""},
    )
    if res.status_code not in (200, 201):
        # unique collision fallback for repeated suite runs
        import uuid
        res = client.post(
            "/v1/auth/users",
            json={
                "email": f"admin_access_{uuid.uuid4().hex[:10]}@example.com",
                "password": "password123",
                "display_name": "admin-access-test",
            },
            headers={"Authorization": ""},
        )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_workflow_revenue_admin_endpoint_requires_configured_admin(client, monkeypatch):
    headers = _register_user(client)

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        res = client.get("/v1/workflow-store/admin/revenue?days=1", headers=headers)
        assert res.status_code == 503, res.text
        assert res.json()["detail"] == "Platform admin access is not configured"
    finally:
        get_settings.cache_clear()


def test_workflow_revenue_admin_endpoint_forbids_non_admin_user(client, monkeypatch):
    headers = _register_user(client)

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "00000000-0000-0000-0000-000000000001")
    get_settings.cache_clear()
    try:
        res = client.get("/v1/workflow-store/admin/revenue?days=1", headers=headers)
        assert res.status_code == 403, res.text
        assert res.json()["detail"] == "Platform admin required"

        export = client.get("/v1/workflow-store/admin/revenue/export?days=1", headers=headers)
        assert export.status_code == 403, export.text
        assert export.json()["detail"] == "Platform admin required"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
