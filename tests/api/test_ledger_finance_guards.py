"""Finance guards: production deposit lock + ledger account IDOR."""
from uuid import uuid4

from app.config import get_settings


def _register(client, label: str):
    email = f"{label}_{uuid4().hex[:12]}@test.com"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": label},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    user = client.get("/v1/users/me", headers=headers).json()
    return user, headers


def test_ledger_accounts_idor_blocked(client):
    user_a, headers_a = _register(client, "fin_idor_a")
    user_b, headers_b = _register(client, "fin_idor_b")

    # Victim creates a personal account via balance lookup.
    bal = client.get(
        "/v1/ledger/balance",
        params={"owner_type": "user", "owner_id": user_a["id"]},
        headers=headers_a,
    )
    assert bal.status_code == 200, bal.text

    leak = client.get(
        "/v1/ledger/accounts",
        params={"owner_type": "user", "owner_id": user_a["id"]},
        headers=headers_b,
    )
    assert leak.status_code == 403, leak.text


def test_ledger_deposit_blocked_in_production(client, monkeypatch):
    user, headers = _register(client, "fin_dep_prod")
    settings = get_settings()
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(
        type(settings),
        "platform_admin_user_ids_allowlist",
        property(lambda self: ()),
    )

    res = client.post(
        "/v1/ledger/deposit",
        headers=headers,
        json={
            "account_owner_type": "user",
            "account_owner_id": user["id"],
            "amount": {"amount": "10", "currency": "ACP"},
        },
    )
    assert res.status_code == 403, res.text


def test_ledger_deposit_rejects_non_positive(client):
    user, headers = _register(client, "fin_dep_zero")
    res = client.post(
        "/v1/ledger/deposit",
        headers=headers,
        json={
            "account_owner_type": "user",
            "account_owner_id": user["id"],
            "amount": {"amount": "0", "currency": "ACP"},
        },
    )
    assert res.status_code == 400, res.text
