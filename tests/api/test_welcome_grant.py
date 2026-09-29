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


def test_custodial_hot_deposit_skips_utxo_full_scan(client, monkeypatch):
    """Accounts bound to custodial hot must not tip-scan inside decorate (browser timeout)."""
    import os

    from sqlalchemy import create_engine, select as sync_select
    from sqlalchemy.orm import Session

    from app.api.routers import wallet_acp as wallet_acp_router
    from app.db.models import User, UserAcpWallet
    from app.services.acp_tokenomics import CUSTODIAL_HOT_ADDRESS, _scan_address_utxo_units
    from app.services import acp_tokenomics as tokenomics_mod

    monkeypatch.setenv("WELCOME_GRANT_ACP", "100")
    get_settings.cache_clear()
    scan_calls = {"n": 0}

    async def forbidden_utxo_scan(address: str):
        scan_calls["n"] += 1
        raise AssertionError(f"decorate must not full-scan UTXOs for {address}")

    def boom_walletd(args, timeout_s=90):
        from fastapi import HTTPException

        raise HTTPException(status_code=504, detail="ACP wallet helper timed out")

    monkeypatch.setattr(wallet_acp_router, "_run_walletd", boom_walletd)
    monkeypatch.setattr(tokenomics_mod, "_scan_address_utxo_units", forbidden_utxo_scan)
    # Keep the unbound symbol unused-check honest if import changes.
    assert callable(_scan_address_utxo_units)

    try:
        email = f"hot_bound_{uuid4().hex[:12]}@test.com"
        res = client.post(
            "/v1/auth/users",
            json={"email": email, "password": "password123", "display_name": "Hot Bound"},
            headers={"Authorization": ""},
        )
        assert res.status_code == 201, res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        db_url = os.environ["DATABASE_URL"].replace("+asyncpg", "").replace(
            "postgresql+asyncpg", "postgresql"
        )
        sync_engine = create_engine(db_url, pool_pre_ping=True)
        with Session(sync_engine) as session:
            user = session.execute(sync_select(User).where(User.email == email)).scalar_one()
            wallet = session.get(UserAcpWallet, user.id)
            assert wallet is not None
            wallet.address = CUSTODIAL_HOT_ADDRESS
            session.commit()

        deposit = client.get("/v1/wallet/acp/deposit_address", headers=headers)
        assert deposit.status_code == 200, deposit.text
        dep = deposit.json()
        assert dep["address"] == CUSTODIAL_HOT_ADDRESS
        assert dep.get("note")
        assert dep.get("needs_personalize") is True

        hot = client.get("/v1/wallet/acp/hot/balance", headers=headers)
        assert hot.status_code == 200, hot.text
        body = hot.json()
        assert scan_calls["n"] == 0
        # Shared hot must not masquerade as personal operator pool balance.
        assert body.get("view_mode") in (None, "user")
        assert Decimal(body["platform_credits_acp"]) == Decimal("100")
        assert Decimal(body["acp"]) == Decimal("100")
        assert Decimal(body["available_acp"]) == Decimal("0")

        # Free the unique hot address for other tests in this suite.
        with Session(sync_engine) as session:
            user = session.execute(sync_select(User).where(User.email == email)).scalar_one()
            wallet = session.get(UserAcpWallet, user.id)
            assert wallet is not None
            wallet.address = f"acp1qcleanup{uuid4().hex[:28]}"
            session.commit()
        sync_engine.dispose()
    finally:
        monkeypatch.setenv("WELCOME_GRANT_ACP", "0")
        get_settings.cache_clear()


def test_personalize_replaces_hot_bound_deposit_address(client, monkeypatch):
    """Personalize endpoint mints a unique deposit address off shared custodial hot."""
    import os

    from sqlalchemy import create_engine, select as sync_select
    from sqlalchemy.orm import Session

    from app.api.routers import wallet_acp as wallet_acp_router
    from app.db.models import User, UserAcpWallet
    from app.services.acp_tokenomics import CUSTODIAL_HOT_ADDRESS

    monkeypatch.setenv("WELCOME_GRANT_ACP", "100")
    get_settings.cache_clear()

    monkeypatch.setattr(
        wallet_acp_router,
        "_load_balance_result",
        lambda address, interactive=True: {
            "address": address,
            "units": "0",
            "acp": "0",
            "utxo_count": 0,
        },
    )

    try:
        email = f"hot_fix_{uuid4().hex[:12]}@test.com"
        password = "password123"
        res = client.post(
            "/v1/auth/users",
            json={"email": email, "password": password, "display_name": "Hot Fix"},
            headers={"Authorization": ""},
        )
        assert res.status_code == 201, res.text
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        db_url = os.environ["DATABASE_URL"].replace("+asyncpg", "").replace(
            "postgresql+asyncpg", "postgresql"
        )
        sync_engine = create_engine(db_url, pool_pre_ping=True)
        with Session(sync_engine) as session:
            user = session.execute(sync_select(User).where(User.email == email)).scalar_one()
            wallet = session.get(UserAcpWallet, user.id)
            assert wallet is not None
            wallet.address = CUSTODIAL_HOT_ADDRESS
            session.commit()
        sync_engine.dispose()

        before = client.get("/v1/wallet/acp/deposit_address", headers=headers).json()
        assert before["address"] == CUSTODIAL_HOT_ADDRESS
        assert before.get("needs_personalize") is True

        fixed = client.post(
            "/v1/wallet/acp/personalize",
            json={"wallet_password": password},
            headers=headers,
        )
        assert fixed.status_code == 200, fixed.text
        body = fixed.json()
        assert body["address"]
        assert body["address"] != CUSTODIAL_HOT_ADDRESS
        assert body["wallet_backup_mnemonic"]
        assert len(body["wallet_backup_mnemonic"].split()) >= 12

        after = client.get("/v1/wallet/acp/deposit_address", headers=headers).json()
        assert after["address"] == body["address"]
        assert after.get("needs_personalize") is False
        assert not after.get("note")

        bal = client.get("/v1/wallet/acp/hot/balance", headers=headers)
        assert bal.status_code == 200, bal.text
        bal_body = bal.json()
        assert bal_body["address"] == body["address"]
        assert Decimal(bal_body["acp"]) == Decimal("100")
        assert Decimal(bal_body["platform_credits_acp"]) == Decimal("100")
    finally:
        monkeypatch.setenv("WELCOME_GRANT_ACP", "0")
        get_settings.cache_clear()
