from app.services import wallet_auth


def test_wallet_auth_nonce_and_verify(client):
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


def test_wallet_auth_challenge_cannot_be_reused(client):
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
