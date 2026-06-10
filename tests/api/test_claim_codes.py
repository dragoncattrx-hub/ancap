from uuid import uuid4


def _register_user(client, label: str):
    email = f"{label}_{uuid4().hex[:12]}@test.com"
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": label},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    user = client.get("/v1/users/me", headers=headers).json()
    return user, headers


def _deposit(client, user_id: str, amount: str, headers):
    res = client.post(
        "/v1/ledger/deposit",
        headers=headers,
        json={
            "account_owner_type": "user",
            "account_owner_id": user_id,
            "amount": {"amount": amount, "currency": "ACP"},
            "reference": "claim-code-test",
        },
    )
    assert res.status_code == 201, res.text


def test_claim_code_create_and_redeem(client):
    owner, owner_headers = _register_user(client, "claim_owner")
    redeemer, redeemer_headers = _register_user(client, "claim_redeemer")
    _deposit(client, owner["id"], "20", owner_headers)

    create = client.post(
        "/v1/claim-codes/create",
        headers=owner_headers,
        json={"amount": "3", "currency": "ACP", "max_redemptions": 1},
    )
    assert create.status_code == 201, create.text
    code = create.json()["code"]

    redeem = client.post(
        "/v1/claim-codes/redeem",
        headers=redeemer_headers,
        json={"code": code},
    )
    assert redeem.status_code == 200, redeem.text
    assert redeem.json()["status"] == "redeemed"
