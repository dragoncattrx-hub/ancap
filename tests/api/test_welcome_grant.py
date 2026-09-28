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


def test_wallet_hot_balance_surfaces_welcome_grant_when_on_chain_empty(client, monkeypatch):
    """/wallet/acp must not show 0 when the user only has ledger welcome credit."""
    monkeypatch.setenv("WELCOME_GRANT_ACP", "100")
    get_settings.cache_clear()
    try:
        email = f"welcome_wallet_{uuid4().hex[:12]}@test.com"
        res = client.post(
            "/v1/auth/users",
            json={"email": email, "password": "password123", "display_name": "Wallet Grant"},
            headers={"Authorization": ""},
        )
        assert res.status_code == 201, res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        hot = client.get("/v1/wallet/acp/hot/balance", headers=headers)
        assert hot.status_code == 200, hot.text
        body = hot.json()
        assert Decimal(body["platform_credits_acp"]) == Decimal("100")
        assert Decimal(body["acp"]) == Decimal("100")
        # On-chain withdraw stays 0 until UTXOs exist for this deposit address.
        assert Decimal(body["available_acp"]) == Decimal("0")
    finally:
        monkeypatch.setenv("WELCOME_GRANT_ACP", "0")
        get_settings.cache_clear()


def test_interactive_balance_skips_full_chain_scan_on_walletd_timeout(client, monkeypatch):
    """Slow walletd must fail closed quickly — never scan the whole tip inline."""
    from app.api.routers import wallet_acp as wallet_acp_router

    monkeypatch.setenv("WELCOME_GRANT_ACP", "100")
    get_settings.cache_clear()
    scan_calls = {"n": 0}

    def boom_walletd(args, timeout_s=90):
        from fastapi import HTTPException

        raise HTTPException(status_code=504, detail="ACP wallet helper timed out")

    def forbidden_scan(address: str):
        scan_calls["n"] += 1
        raise AssertionError("interactive balance must not full-scan the chain")

    monkeypatch.setattr(wallet_acp_router, "_run_walletd", boom_walletd)
    monkeypatch.setattr(wallet_acp_router, "_rpc_balance_for_address", forbidden_scan)
    try:
        email = f"welcome_fast_{uuid4().hex[:12]}@test.com"
        res = client.post(
            "/v1/auth/users",
            json={"email": email, "password": "password123", "display_name": "Fast Wallet"},
            headers={"Authorization": ""},
        )
        assert res.status_code == 201, res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        hot = client.get("/v1/wallet/acp/hot/balance", headers=headers)
        assert hot.status_code == 200, hot.text
        body = hot.json()
        assert scan_calls["n"] == 0
        assert Decimal(body["platform_credits_acp"]) == Decimal("100")
        assert Decimal(body["acp"]) == Decimal("100")
    finally:
        monkeypatch.setenv("WELCOME_GRANT_ACP", "0")
        get_settings.cache_clear()
