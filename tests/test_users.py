"""Users: me (requires auth)."""
import secrets

from app.api.routers import auth as auth_router
from app.services import wallet_auth
from tests.conftest import unique_email


def test_me_unauthorized(client):
    r = client.get("/v1/users/me", headers={"Authorization": ""})
    assert r.status_code == 401


def test_me_success(client, monkeypatch):
    email = unique_email()
    reg = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "pass1234", "display_name": "Me Test"},
        headers={"Authorization": ""},
    )
    assert reg.status_code == 201, reg.text
    monkeypatch.setattr(auth_router, "send_login_alert", _async_return(False))
    login = client.post("/v1/auth/login", json={"email": email, "password": "pass1234"}, headers={"Authorization": ""})
    assert login.status_code == 200, login.text
    data = login.json()
    token = data.get("access_token")
    assert token, data
    r = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == email
    assert me["display_name"] == "Me Test"
    assert me["wallet_address"] is None
    assert me["wallet_chain_id"] is None


def test_me_includes_wallet_fields_for_wallet_user(client, monkeypatch):
    address = f"0x{secrets.token_hex(20)}"

    nonce_res = client.post(
        "/v1/auth/wallet/nonce",
        json={"address": address, "chain_id": 56, "domain": "ancap.cloud", "uri": "https://ancap.cloud/login"},
        headers={"Authorization": ""},
    )
    assert nonce_res.status_code == 200, nonce_res.text
    payload = nonce_res.json()

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
    token = verify_res.json()["access_token"]
    me_res = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200, me_res.text
    me = me_res.json()
    assert me["wallet_address"] == address.lower()
    assert me["wallet_chain_id"] == 56
    assert isinstance(me["email"], str) and me["email"]


def _async_return(value):
    async def _inner(*_args, **_kwargs):
        return value

    return _inner
