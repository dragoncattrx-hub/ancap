import uuid

from sqlalchemy import select

from app.api.routers import auth as auth_router
from app.db.models import User, UserEvmWallet
from app.services import wallet_auth
from app.services.auth import hash_password
from tests.conftest import _sync_database_url, unique_email


def _unique_wallet_address() -> str:
    return "0x" + uuid.uuid4().hex + uuid.uuid4().hex[:8]


def test_wallet_auth_nonce_and_verify(client, monkeypatch):
    address = "0x396351dF6420e6089dC67F4CBdDc717f34fFB2e4"

    nonce_res = client.post(
        "/v1/auth/wallet/nonce",
        json={
            "address": address,
            "chain_id": 56,
            "domain": "ancap.cloud",
            "uri": "https://ancap.cloud/login",
        },
        headers={"Authorization": ""},
    )
    assert nonce_res.status_code == 200, nonce_res.text
    payload = nonce_res.json()
    assert payload["address"] == address.lower()
    assert payload["chain_id"] == 56
    assert payload["challenge_id"]
    assert payload["nonce"]
    assert "Sign this message to authenticate with ANCAP" in payload["message"]

    original_recover = wallet_auth.Account.recover_message

    def fake_recover_message(_encoded, signature):
        assert signature == "0xdeadbeef"
        return address

    wallet_auth.Account.recover_message = fake_recover_message
    monkeypatch.setattr(auth_router, "send_login_alert", _async_return(False))
    try:
        verify_res = client.post(
            "/v1/auth/wallet/verify",
            json={
                "challenge_id": payload["challenge_id"],
                "address": address,
                "signature": "0xdeadbeef",
            },
            headers={"Authorization": ""},
        )
    finally:
        wallet_auth.Account.recover_message = original_recover

    assert verify_res.status_code == 200, verify_res.text
    verify_payload = verify_res.json()
    assert verify_payload["access_token"]
    assert verify_payload["token_type"] == "bearer"

    me_res = client.get(
        "/v1/users/me",
        headers={"Authorization": f"Bearer {verify_payload['access_token']}"},
    )
    assert me_res.status_code == 200, me_res.text
    me = me_res.json()
    assert me["email"].endswith("@wallet.ancap.local")
    assert me["display_name"]
    assert me["wallet_address"] == address.lower()
    assert me["wallet_chain_id"] == 56


def test_wallet_auth_challenge_cannot_be_reused(client, monkeypatch):
    address = "0x396351dF6420e6089dC67F4CBdDc717f34fFB2e4"
    nonce_res = client.post(
        "/v1/auth/wallet/nonce",
        json={"address": address, "chain_id": 56},
        headers={"Authorization": ""},
    )
    assert nonce_res.status_code == 200, nonce_res.text
    payload = nonce_res.json()

    original_recover = wallet_auth.Account.recover_message
    wallet_auth.Account.recover_message = lambda _encoded, signature: address
    monkeypatch.setattr(auth_router, "send_login_alert", _async_return(False))
    try:
        first = client.post(
            "/v1/auth/wallet/verify",
            json={
                "challenge_id": payload["challenge_id"],
                "address": address,
                "signature": "0xdeadbeef",
            },
            headers={"Authorization": ""},
        )
        second = client.post(
            "/v1/auth/wallet/verify",
            json={
                "challenge_id": payload["challenge_id"],
                "address": address,
                "signature": "0xdeadbeef",
            },
            headers={"Authorization": ""},
        )
    finally:
        wallet_auth.Account.recover_message = original_recover

    assert first.status_code == 200, first.text
    assert second.status_code == 400, second.text
    assert "already used" in second.text.lower()


def test_wallet_link_attaches_wallet_to_existing_user(client, monkeypatch):
    email = unique_email()
    password = "password123"
    register = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "Link Me"},
        headers={"Authorization": ""},
    )
    assert register.status_code == 201, register.text

    monkeypatch.setattr(auth_router, "send_login_alert", _async_return(False))
    login = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Authorization": ""},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    address = _unique_wallet_address()
    nonce_res = client.post(
        "/v1/auth/wallet/nonce",
        json={"address": address, "chain_id": 56, "domain": "ancap.cloud", "uri": "https://ancap.cloud/login"},
        headers={"Authorization": ""},
    )
    assert nonce_res.status_code == 200, nonce_res.text
    payload = nonce_res.json()

    original_recover = wallet_auth.Account.recover_message
    wallet_auth.Account.recover_message = lambda _encoded, signature: address
    try:
        link_res = client.post(
            "/v1/auth/wallet/link",
            json={
                "challenge_id": payload["challenge_id"],
                "address": address,
                "signature": "0xdeadbeef",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    finally:
        wallet_auth.Account.recover_message = original_recover

    assert link_res.status_code == 200, link_res.text
    link_payload = link_res.json()
    assert link_payload["success"] is True
    assert link_payload["wallet_address"] == address.lower()
    assert link_payload["chain_id"] == 56

    me = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    me_payload = me.json()
    assert me_payload["email"] == email
    assert me_payload["wallet_address"] == address.lower()
    assert me_payload["wallet_chain_id"] == 56


def test_wallet_link_reclaims_shadow_wallet_user(client, monkeypatch):
    email = unique_email()
    password = "password123"
    address = _unique_wallet_address().lower()
    pseudo_email = f"{address.removeprefix('0x')}@wallet.ancap.local"

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    sync_engine = create_engine(_sync_database_url(), pool_pre_ping=True)
    with Session(sync_engine) as session:
        email_user = User(email=email, password_hash=hash_password(password), display_name="Main User")
        shadow_user = User(email=pseudo_email, password_hash=hash_password("shadow-secret"), display_name="Shadow User")
        session.add(email_user)
        session.add(shadow_user)
        session.flush()
        session.add(UserEvmWallet(user_id=shadow_user.id, wallet_address=address, chain_id=56))
        session.commit()

    monkeypatch.setattr(auth_router, "send_login_alert", _async_return(False))
    login = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Authorization": ""},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    nonce_res = client.post(
        "/v1/auth/wallet/nonce",
        json={"address": address, "chain_id": 56, "domain": "ancap.cloud", "uri": "https://ancap.cloud/login"},
        headers={"Authorization": ""},
    )
    assert nonce_res.status_code == 200, nonce_res.text
    payload = nonce_res.json()

    original_recover = wallet_auth.Account.recover_message
    wallet_auth.Account.recover_message = lambda _encoded, signature: address
    try:
        link_res = client.post(
            "/v1/auth/wallet/link",
            json={
                "challenge_id": payload["challenge_id"],
                "address": address,
                "signature": "0xdeadbeef",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
    finally:
        wallet_auth.Account.recover_message = original_recover

    assert link_res.status_code == 200, link_res.text
    link_payload = link_res.json()
    assert link_payload["success"] is True
    assert link_payload["wallet_address"] == address
    assert link_payload["chain_id"] == 56

    me = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200, me.text
    me_payload = me.json()
    assert me_payload["email"] == email
    assert me_payload["wallet_address"] == address
    assert me_payload["wallet_chain_id"] == 56

    with Session(sync_engine) as session:
        linked = session.execute(select(UserEvmWallet).where(UserEvmWallet.wallet_address == address)).scalar_one()
        owner = session.execute(select(User).where(User.id == linked.user_id)).scalar_one()
        assert owner.email == email
    sync_engine.dispose()


def _async_return(value):
    async def _inner(*_args, **_kwargs):
        return value

    return _inner
