import uuid

from app.config import get_settings


def _register_user(client, email: str):
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "privileged-surface-test"},
        headers={"Authorization": ""},
    )
    if res.status_code not in (200, 201):
        res = client.post(
            "/v1/auth/users",
            json={
                "email": f"privileged_{uuid.uuid4().hex[:10]}@example.com",
                "password": password,
                "display_name": "privileged-surface-test",
            },
            headers={"Authorization": ""},
        )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    me = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    return me.json(), {"Authorization": f"Bearer {token}"}


def test_privileged_surfaces_require_configured_platform_admin(client, monkeypatch):
    _, headers = _register_user(client, "privileged_cfg@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        checks = [
            client.get("/v1/autonomy/ops/anomalies", headers=headers),
            client.post("/v1/autonomy/ops/remediations/apply", headers=headers, json={"action": "reset_ledger_halt_after_verification"}),
            client.get("/v1/moderation/graph-enforcement/preview", headers=headers),
            client.post("/v1/moderation/actions", headers=headers, json={"target_type": "pool", "target_id": str(uuid.uuid4()), "action": "halt"}),
            client.post("/v1/moderation/agent-links", headers=headers, json={"agent_id": str(uuid.uuid4()), "linked_agent_id": str(uuid.uuid4()), "link_type": "manual", "confidence": 0.9}),
            client.post("/v1/reputation/recompute", headers=headers, json={"subject_type": "agent", "subject_id": str(uuid.uuid4())}),
            client.post(f"/v1/stakes/slash/{uuid.uuid4()}", headers=headers, json={"amount": "1", "currency": "ACP", "reason": "test"}),
        ]
        for res in checks:
            assert res.status_code == 503, res.text
            assert res.json()["detail"] == "Platform admin access is not configured"
    finally:
        get_settings.cache_clear()


def test_privileged_surfaces_forbid_non_admin_user(client, monkeypatch):
    _, headers = _register_user(client, "privileged_forbid@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "00000000-0000-0000-0000-000000000001")
    get_settings.cache_clear()
    try:
        checks = [
            client.get("/v1/autonomy/ops/anomalies", headers=headers),
            client.post("/v1/autonomy/ops/remediations/apply", headers=headers, json={"action": "reset_ledger_halt_after_verification"}),
            client.get("/v1/moderation/graph-enforcement/preview", headers=headers),
            client.post("/v1/moderation/actions", headers=headers, json={"target_type": "pool", "target_id": str(uuid.uuid4()), "action": "halt"}),
            client.post("/v1/moderation/agent-links", headers=headers, json={"agent_id": str(uuid.uuid4()), "linked_agent_id": str(uuid.uuid4()), "link_type": "manual", "confidence": 0.9}),
            client.post("/v1/reputation/recompute", headers=headers, json={"subject_type": "agent", "subject_id": str(uuid.uuid4())}),
            client.post(f"/v1/stakes/slash/{uuid.uuid4()}", headers=headers, json={"amount": "1", "currency": "ACP", "reason": "test"}),
        ]
        for res in checks:
            assert res.status_code == 403, res.text
            assert res.json()["detail"] == "Platform admin required"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()


def test_admin_agent_link_returns_not_found_for_missing_agents(client, monkeypatch):
    admin_user, headers = _register_user(client, "privileged_mod_link_admin@example.com")

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin_user["id"])
    get_settings.cache_clear()
    try:
        res = client.post(
            "/v1/moderation/agent-links",
            headers=headers,
            json={
                "agent_id": str(uuid.uuid4()),
                "linked_agent_id": str(uuid.uuid4()),
                "link_type": "manual",
                "confidence": 0.9,
            },
        )
        assert res.status_code == 404, res.text
        assert res.json()["detail"] in ("Agent not found", "Linked agent not found")
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
