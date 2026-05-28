from decimal import Decimal
from uuid import uuid4

from app.config import get_settings


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


def _user_balance(client, user_id: str, currency="ACP", headers=None) -> Decimal:
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
            "amount": {"amount": "10", "currency": "ACP"},
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
    assert payload["receipt"]["x402"]["accepts"][0]["currency"] == "ACP"
    assert Decimal(payload["usage"]["amount"]["amount"]) == Decimal("2.000000000000000000")
    assert payload["result"]["score"] > 0
    assert _user_balance(client, user["id"], "ACP", headers=headers) == Decimal("8.000000000000000000")

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
            "amount": {"amount": "10", "currency": "ACP"},
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
        json={"currency": "ACP", "monthly_cap": "1.00"},
    )
    assert cap.status_code == 200, cap.text
    assert cap.json()["caps"]["ACP"] == "1.00"

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


def test_paid_api_usage_export_and_idempotency(client):
    user, headers = _register_user(client)
    deposit = client.post(
        "/v1/ledger/deposit",
        headers=headers,
        json={
            "account_owner_type": "user",
            "account_owner_id": user["id"],
            "amount": {"amount": "10", "currency": "ACP"},
            "reference": "paid-api-export-test",
        },
    )
    assert deposit.status_code == 201, deposit.text

    agent = client.post(
        "/v1/agents",
        json={"display_name": f"paid_api_export_{uuid4().hex[:8]}", "public_key": "x" * 32, "roles": ["buyer"]},
        headers=headers,
    )
    assert agent.status_code == 201, agent.text
    key = client.post("/v1/keys", json={"agent_id": agent.json()["id"], "scope": "paid-api"}, headers=headers)
    assert key.status_code == 201, key.text
    raw_key = key.json()["key"]

    idempotency_key = f"paid-api-{uuid4().hex}"
    body = {"subject": "EXPORT", "chain": "Base", "signals": {"owner": "known"}}
    first = client.post(
        "/v1/paid-api/token-risk",
        headers={"Authorization": "", "X-API-Key": raw_key, "Idempotency-Key": idempotency_key},
        json=body,
    )
    assert first.status_code == 200, first.text
    second = client.post(
        "/v1/paid-api/token-risk",
        headers={"Authorization": "", "X-API-Key": raw_key, "Idempotency-Key": idempotency_key},
        json=body,
    )
    assert second.status_code == 200, second.text
    assert second.json()["usage"]["id"] == first.json()["usage"]["id"]
    assert _user_balance(client, user["id"], "ACP", headers=headers) == Decimal("8.000000000000000000")

    usage = client.get("/v1/paid-api/me/usage", headers=headers)
    assert usage.status_code == 200, usage.text
    assert usage.json()["totals_by_currency"]["ACP"] == "2.000000000000000000"
    assert usage.json()["exported_at"]

    export_res = client.get("/v1/paid-api/me/usage/export?limit=10", headers=headers)
    assert export_res.status_code == 200, export_res.text
    assert export_res.headers["content-type"].startswith("text/csv")
    assert "product_slug" in export_res.text
    assert first.json()["usage"]["id"] in export_res.text


def test_paid_api_revenue_summary_requires_platform_admin(client, monkeypatch):
    _, headers = _register_user(client)

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    get_settings.cache_clear()
    try:
        response = client.get("/v1/paid-api/revenue-summary?days=30", headers=headers)
        assert response.status_code == 503, response.text
        assert response.json()["detail"] == "Platform admin access is not configured"
    finally:
        get_settings.cache_clear()



def test_paid_api_org_agent_key_endpoint_spend_cap_is_enforced(client):
    owner, owner_headers = _register_user(client)

    agent = client.post(
        "/v1/agents",
        json={"display_name": f"paid_api_orgcap_{uuid4().hex[:8]}", "public_key": "o" * 32, "roles": ["buyer"]},
        headers=owner_headers,
    )
    assert agent.status_code == 201, agent.text
    agent_id = agent.json()["id"]

    funded = client.post(
        "/v1/ledger/deposit",
        headers=owner_headers,
        json={
            "account_owner_type": "agent",
            "account_owner_id": agent_id,
            "amount": {"amount": "10", "currency": "ACP"},
            "reference": "paid-api-org-agent-key-cap",
        },
    )
    assert funded.status_code == 201, funded.text

    key = client.post("/v1/keys", json={"agent_id": agent_id, "scope": "paid-api"}, headers=owner_headers)
    assert key.status_code == 201, key.text
    key_id = key.json()["id"]
    raw_key = key.json()["key"]

    org = client.post(
        "/v1/organizations",
        headers=owner_headers,
        json={"name": f"Cap Org {uuid4().hex[:6]}", "description": "org key cap test"},
    )
    assert org.status_code == 201, org.text
    org_id = org.json()["id"]

    transfer = client.post(
        f"/v1/organizations/{org_id}/agents/{agent_id}",
        headers=owner_headers,
    )
    assert transfer.status_code == 200, transfer.text

    cap = client.patch(
        f"/v1/organizations/{org_id}/api-keys/{key_id}",
        headers=owner_headers,
        json={"endpoint": "/paid-api/token-risk", "currency": "ACP", "monthly_cap": "1.00"},
    )
    assert cap.status_code == 200, cap.text
    assert cap.json()["spend_caps"]["/paid-api/token-risk"]["ACP"] == "1.00"

    response = client.post(
        "/v1/paid-api/token-risk",
        headers={"Authorization": "", "X-API-Key": raw_key},
        json={"subject": "ORG-CAP", "chain": "Base", "signals": {"owner": "known"}},
    )
    assert response.status_code == 402, response.text
    detail = response.json()["detail"]
    assert detail["code"] == "endpoint_spend_cap_exceeded"
    assert detail["endpoint"] == "/paid-api/token-risk"
    assert detail["monthly_cap"] == "1.00"



def test_paid_api_revenue_summary_aggregates_margin_by_org_and_endpoint(client, monkeypatch):
    owner, owner_headers = _register_user(client)
    admin, admin_headers = _register_user(client)

    agent = client.post(
        "/v1/agents",
        json={"display_name": f"paid_api_rev_{uuid4().hex[:8]}", "public_key": "r" * 32, "roles": ["buyer"]},
        headers=owner_headers,
    )
    assert agent.status_code == 201, agent.text
    agent_id = agent.json()["id"]

    funded = client.post(
        "/v1/ledger/deposit",
        headers=owner_headers,
        json={
            "account_owner_type": "agent",
            "account_owner_id": agent_id,
            "amount": {"amount": "10", "currency": "ACP"},
            "reference": "paid-api-revenue-summary-agent-fund",
        },
    )
    assert funded.status_code == 201, funded.text

    key = client.post("/v1/keys", json={"agent_id": agent_id, "scope": "paid-api"}, headers=owner_headers)
    assert key.status_code == 201, key.text
    raw_key = key.json()["key"]

    org = client.post(
        "/v1/organizations",
        headers=owner_headers,
        json={"name": f"Revenue Org {uuid4().hex[:6]}", "description": "paid api revenue test"},
    )
    assert org.status_code == 201, org.text
    org_id = org.json()["id"]

    transfer = client.post(
        f"/v1/organizations/{org_id}/agents/{agent_id}",
        headers=owner_headers,
    )
    assert transfer.status_code == 200, transfer.text

    usage = client.post(
        "/v1/paid-api/token-risk",
        headers={"Authorization": "", "X-API-Key": raw_key},
        json={"subject": "REV", "chain": "Base", "signals": {"owner": "known"}},
    )
    assert usage.status_code == 200, usage.text

    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", admin["id"])
    get_settings.cache_clear()
    try:
        response = client.get("/v1/paid-api/revenue-summary?days=30", headers=admin_headers)
        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["window_days"] == 30
        assert payload["usage_count"] >= 1
        assert payload["status_counts"]["captured"] >= 1

        gross = {item["currency"]: Decimal(item["amount"]) for item in payload["gross_totals"]}
        provider = {item["currency"]: Decimal(item["amount"]) for item in payload["estimated_provider_cost_totals"]}
        margin = {item["currency"]: Decimal(item["amount"]) for item in payload["estimated_margin_totals"]}
        assert gross["ACP"] >= Decimal("2")
        assert provider["ACP"] >= Decimal("0.36")
        assert margin["ACP"] >= Decimal("1.64")

        endpoint = next(
            item
            for item in payload["endpoints"]
            if item["product_slug"] == "token-risk" and item["org_id"] == org_id
        )
        assert endpoint["endpoint"] == "/paid-api/token-risk"
        assert endpoint["usage_count"] >= 1
        assert endpoint["captured_count"] >= 1
        assert endpoint["gross_amount"] == "2.000000000000000000"
        assert endpoint["estimated_provider_cost_amount"] == "0.36"
        assert endpoint["estimated_margin_amount"] == "1.64"

        organization = next(item for item in payload["organizations"] if item["org_id"] == org_id)
        assert organization["org_name"] == org.json()["name"]
        org_gross = {item["currency"]: item["amount"] for item in organization["gross_totals"]}
        org_provider = {item["currency"]: item["amount"] for item in organization["estimated_provider_cost_totals"]}
        org_margin = {item["currency"]: item["amount"] for item in organization["estimated_margin_totals"]}
        assert org_gross["ACP"] == "2.000000000000000000"
        assert org_provider["ACP"] == "0.36"
        assert org_margin["ACP"] == "1.64"
    finally:
        monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
        get_settings.cache_clear()
