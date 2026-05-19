from decimal import Decimal
from uuid import uuid4


def _register_user(client):
    email = f"paid_api_{uuid4().hex[:12]}@test.com"
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "paid_api_user"},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200, me.text
    return me.json(), headers


def _user_balance(client, user_id: str, currency="USDC", headers=None) -> Decimal:
    res = client.get(f"/v1/ledger/balance?owner_type=user&owner_id={user_id}", headers=headers)
    assert res.status_code == 200, res.text
    for item in res.json()["balances"]:
        if item["currency"] == currency:
            return Decimal(item["amount"])
    return Decimal("0")


def test_paid_api_usage_charges_owner_credits_and_records_meter_event(client):
    user, headers = _register_user(client)
    deposit = client.post(
        "/v1/ledger/deposit",
        headers=headers,
        json={
            "account_owner_type": "user",
            "account_owner_id": user["id"],
            "amount": {"amount": "10", "currency": "USDC"},
            "reference": "paid-api-test",
        },
    )
    assert deposit.status_code == 201, deposit.text

    agent = client.post(
        "/v1/agents",
        json={"display_name": f"paid_api_agent_{uuid4().hex[:8]}", "public_key": "p" * 32, "roles": ["buyer"]},
        headers=headers,
    )
    assert agent.status_code == 201, agent.text
    key = client.post("/v1/keys", json={"agent_id": agent.json()["id"], "scope": "paid-api"}, headers=headers)
    assert key.status_code == 201, key.text
    raw_key = key.json()["key"]

    products = client.get("/v1/paid-api/products")
    assert products.status_code == 200, products.text
    assert any(item["slug"] == "token-risk" for item in products.json()["items"])

    response = client.post(
        "/v1/paid-api/token-risk",
        headers={"Authorization": "", "X-API-Key": raw_key},
        json={
            "subject": "TEST",
            "chain": "Base",
            "signals": {"owner": "known", "liquidity": "locked"},
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["product"]["slug"] == "token-risk"
    assert payload["product"]["x402"]["version"] == "x402-compatible-preview"
    assert payload["usage"]["status"] == "captured"
    assert payload["receipt"]["request_hash"] == payload["usage"]["request_hash"]
    assert payload["receipt"]["x402"]["accepts"][0]["currency"] == "USDC"
    assert Decimal(payload["usage"]["amount"]["amount"]) == Decimal("2.000000000000000000")
    assert payload["result"]["score"] > 0
    assert _user_balance(client, user["id"], "USDC", headers=headers) == Decimal("8.000000000000000000")

    usage = client.get("/v1/paid-api/me/usage", headers=headers)
    assert usage.status_code == 200, usage.text
    assert any(item["id"] == payload["usage"]["id"] for item in usage.json()["items"])


def test_paid_api_usage_rejects_insufficient_credits(client):
    _, headers = _register_user(client)
    agent = client.post(
        "/v1/agents",
        json={"display_name": f"paid_api_empty_{uuid4().hex[:8]}", "public_key": "e" * 32, "roles": ["buyer"]},
        headers=headers,
    )
    assert agent.status_code == 201, agent.text
    key = client.post("/v1/keys", json={"agent_id": agent.json()["id"], "scope": "paid-api"}, headers=headers)
    assert key.status_code == 201, key.text

    response = client.post(
        "/v1/paid-api/wallet-risk",
        headers={"Authorization": "", "X-API-Key": key.json()["key"]},
        json={"subject": "0x0000000000000000000000000000000000000000", "chain": "BSC"},
    )
    assert response.status_code == 402, response.text
    assert response.json()["detail"]["message"] == "Insufficient credits for paid API usage"
    assert response.json()["detail"]["x402"]["version"] == "x402-compatible-preview"


def test_paid_api_usage_respects_agent_monthly_spend_cap(client):
    user, headers = _register_user(client)
    deposit = client.post(
        "/v1/ledger/deposit",
        headers=headers,
        json={
            "account_owner_type": "user",
            "account_owner_id": user["id"],
            "amount": {"amount": "10", "currency": "USDC"},
            "reference": "paid-api-spend-cap-test",
        },
    )
    assert deposit.status_code == 201, deposit.text

    agent = client.post(
        "/v1/agents",
        json={"display_name": f"paid_api_cap_{uuid4().hex[:8]}", "public_key": "c" * 32, "roles": ["buyer"]},
        headers=headers,
    )
    assert agent.status_code == 201, agent.text
    agent_id = agent.json()["id"]
    key = client.post("/v1/keys", json={"agent_id": agent_id, "scope": "paid-api"}, headers=headers)
    assert key.status_code == 201, key.text

    cap = client.post(
        f"/v1/paid-api/agents/{agent_id}/spend-cap",
        headers=headers,
        json={"currency": "USDC", "monthly_cap": "1.00"},
    )
    assert cap.status_code == 200, cap.text
    assert cap.json()["caps"]["USDC"] == "1.00"

    response = client.post(
        "/v1/paid-api/token-risk",
        headers={"Authorization": "", "X-API-Key": key.json()["key"]},
        json={"subject": "CAP", "chain": "Base"},
    )
    assert response.status_code == 402, response.text
    detail = response.json()["detail"]
    assert detail["code"] == "spend_cap_exceeded"
    assert detail["monthly_cap"] == "1.00"
    assert detail["x402"]["accepts"][0]["amount"] == "2.00"
