"""Welcome access grant: 100 ACP promotional credit on register."""
from decimal import Decimal
from uuid import uuid4

from app.config import get_settings


def _user_balance(client, user_id: str, headers) -> Decimal:
    res = client.get(f"/v1/ledger/balance?owner_type=user&owner_id={user_id}", headers=headers)
    assert res.status_code == 200, res.text
    for item in res.json()["balances"]:
        if item["currency"] == "ACP":
            return Decimal(item["amount"])
    return Decimal("0")


def test_welcome_grant_credits_on_register_when_enabled(client, monkeypatch):
    monkeypatch.setenv("WELCOME_GRANT_ACP", "100")
    get_settings.cache_clear()
    try:
        email = f"welcome_{uuid4().hex[:12]}@test.com"
        res = client.post(
            "/v1/auth/users",
            json={"email": email, "password": "password123", "display_name": "Welcome Grant"},
            headers={"Authorization": ""},
        )
        assert res.status_code in (200, 201), res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        user = client.get("/v1/users/me", headers=headers).json()
        assert _user_balance(client, user["id"], headers) == Decimal("100.000000000000000000")
    finally:
        monkeypatch.setenv("WELCOME_GRANT_ACP", "0")
        get_settings.cache_clear()


def test_welcome_grant_disabled_in_pytest_default(client):
    email = f"welcome_off_{uuid4().hex[:12]}@test.com"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "No Grant"},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    user = client.get("/v1/users/me", headers=headers).json()
    assert _user_balance(client, user["id"], headers) == Decimal("0")
