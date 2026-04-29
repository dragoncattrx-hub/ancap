from tests.conftest import unique_email, unique_name


def _register_and_login(client) -> str:
    email = unique_email()
    password = "password123"
    r = client.post("/auth/users", json={"email": email, "password": password, "display_name": "AI Console"})
    assert r.status_code in (201, 400), r.text
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def test_referral_summary_endpoint(client):
    owner_token = _register_and_login(client)
    referred_token = _register_and_login(client)

    code_resp = client.post("/referrals/codes/create", headers={"Authorization": f"Bearer {owner_token}"}, json={})
    assert code_resp.status_code == 201, code_resp.text
    code = code_resp.json()["code"]

    attr_resp = client.post(
        "/referrals/attribute",
        headers={"Authorization": f"Bearer {referred_token}"},
        json={"code": code},
    )
    assert attr_resp.status_code == 201, attr_resp.text

    summary = client.get("/referrals/me/summary", headers={"Authorization": f"Bearer {owner_token}"})
    assert summary.status_code == 200, summary.text
    body = summary.json()
    assert body["total_attributions"] >= 1
    assert {"pending", "eligible", "rewarded", "rejected"} & set(body.keys())


def test_decision_logs_written_for_listing_gate(client, base_vertical_id, monkeypatch):
    # This test specifically asserts the participation-gate denial path. The
    # global test environment has gates disabled to keep the rest of the suite
    # green, so re-enable them just for this test and clear the settings cache.
    from app.config import get_settings

    monkeypatch.setenv("PARTICIPATION_GATES_ENABLED", "true")
    get_settings.cache_clear()
    try:
        token = _register_and_login(client)
        agent_resp = client.post(
            "/agents",
            headers={"Authorization": f"Bearer {token}"},
            json={"display_name": unique_name("gate_agent"), "public_key": "x" * 32, "roles": ["seller"]},
        )
        assert agent_resp.status_code == 201, agent_resp.text
        agent_id = agent_resp.json()["id"]

        strategy_resp = client.post(
            "/strategies",
            json={"name": unique_name("gate_strategy"), "vertical_id": base_vertical_id, "owner_agent_id": agent_id},
        )
        assert strategy_resp.status_code == 201, strategy_resp.text
        strategy_id = strategy_resp.json()["id"]

        ver_resp = client.post(
            f"/strategies/{strategy_id}/versions",
            json={
                "semver": "1.0.0",
                "workflow": {
                    "vertical_id": base_vertical_id,
                    "version": "1.0",
                    "steps": [{"id": "s1", "action": "const", "args": {"value": 1}}],
                },
            },
        )
        assert ver_resp.status_code == 201, ver_resp.text
        version_id = ver_resp.json()["id"]

        listing_resp = client.post(
            "/listings",
            json={
                "strategy_id": strategy_id,
                "strategy_version_id": version_id,
                "fee_model": {"type": "one_time", "one_time_price": {"amount": "10", "currency": "USD"}},
                "status": "active",
            },
        )
        assert listing_resp.status_code == 403, listing_resp.text

        logs_resp = client.get("/system/decision-logs?scope=listings.create&limit=20")
        assert logs_resp.status_code == 200, logs_resp.text
        logs = logs_resp.json()
        assert any(item["scope"] == "listings.create" for item in logs)
    finally:
        get_settings.cache_clear()
