import os

from app.config import get_settings
from tests.conftest import unique_email


def _register_and_login(client) -> str:
    email = unique_email()
    password = "password123"
    r = client.post("/auth/users", json={"email": email, "password": password, "display_name": "Wave5"})
    assert r.status_code in (201, 400), r.text
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def test_autonomy_ops_and_council(client):
    token = _register_and_login(client)
    anomalies = client.get("/autonomy/ops/anomalies")
    assert anomalies.status_code == 200, anomalies.text
    council = client.post(
        "/autonomy/ai-council/recommend",
        headers={"Authorization": f"Bearer {token}"},
        json={"subject": "agent:abc", "evidence": "possible fraud cluster"},
    )
    assert council.status_code == 200, council.text
    assert council.json()["recommendation"] in ("escalate_manual_review", "allow_with_monitoring")


def test_nl_strategy_compiler_flagged(client):
    token = _register_and_login(client)
    os.environ["FF_NL_STRATEGY_COMPILER"] = "true"
    get_settings.cache_clear()
    try:
        r = client.post(
            "/autonomy/strategy-compiler/compile",
            headers={"Authorization": f"Bearer {token}"},
            json={"prompt": "Build momentum strategy with strict risk limits"},
        )
        assert r.status_code == 200, r.text
        assert "workflow_json" in r.json()
    finally:
        os.environ["FF_NL_STRATEGY_COMPILER"] = "false"
        get_settings.cache_clear()

