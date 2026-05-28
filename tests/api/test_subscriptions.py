from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from tests.conftest import unique_email, unique_name


def _register_user(client):
    email = unique_email()
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "subscription user"},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    user = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    return user, {"Authorization": f"Bearer {token}"}


def _deposit_user_credits(client, user_id: str, *, amount: str, currency: str, headers: dict[str, str]):
    response = client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "user",
            "account_owner_id": user_id,
            "amount": {"amount": amount, "currency": currency},
            "reference": "test-subscription-funding",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text


def _user_balance(client, user_id: str, *, headers: dict[str, str], currency: str = "ACP") -> Decimal:
    response = client.get(
        "/v1/ledger/balance",
        params={"owner_type": "user", "owner_id": user_id},
        headers=headers,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    for item in payload["balances"]:
        if item["currency"] == currency:
            return Decimal(item["amount"])
    return Decimal("0")


def _create_agent(client, headers: dict[str, str], *, prefix: str) -> str:
    response = client.post(
        "/v1/agents",
        json={"display_name": unique_name(prefix), "public_key": uuid4().hex * 2, "roles": ["seller"]},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _create_subscription_listing(client, seller_headers: dict[str, str], *, owner_agent_id: str, monthly: str = "10", quarterly: str = "27", annual: str = "100") -> tuple[str, str]:
    verticals = client.get("/v1/verticals?limit=1")
    assert verticals.status_code == 200, verticals.text
    vertical_id = verticals.json()["items"][0]["id"]

    strategy = client.post(
        "/v1/strategies",
        json={"name": unique_name("sub_strategy"), "vertical_id": vertical_id, "owner_agent_id": owner_agent_id},
        headers=seller_headers,
    )
    assert strategy.status_code == 201, strategy.text
    strategy_id = strategy.json()["id"]

    version = client.post(
        f"/v1/strategies/{strategy_id}/versions",
        json={
            "semver": "1.0.0",
            "workflow": {
                "vertical_id": vertical_id,
                "version": "1.0",
                "steps": [{"id": "s1", "action": "const", "args": {"value": 1}}],
            },
        },
        headers=seller_headers,
    )
    assert version.status_code == 201, version.text

    listing = client.post(
        "/v1/listings",
        json={
            "strategy_id": strategy_id,
            "strategy_version_id": version.json()["id"],
            "fee_model": {
                "type": "subscription",
                "subscription_price_monthly": {"amount": monthly, "currency": "ACP"},
                "subscription_price_quarterly": {"amount": quarterly, "currency": "ACP"},
                "subscription_price_annual": {"amount": annual, "currency": "ACP"},
            },
            "status": "active",
        },
        headers=seller_headers,
    )
    assert listing.status_code == 201, listing.text
    return strategy_id, listing.json()["id"]


def test_create_subscription_and_list(client):
    seller, seller_headers = _register_user(client)
    buyer, buyer_headers = _register_user(client)
    seller_agent_id = _create_agent(client, seller_headers, prefix="seller_sub")
    strategy_id, listing_id = _create_subscription_listing(client, seller_headers, owner_agent_id=seller_agent_id)
    _deposit_user_credits(client, buyer["id"], amount="50", currency="ACP", headers=buyer_headers)

    created = client.post(
        "/v1/subscriptions",
        json={"listing_id": listing_id, "billing_period": "quarterly", "auto_renew": True},
        headers=buyer_headers,
    )
    assert created.status_code == 201, created.text
    payload = created.json()
    assert payload["listing_id"] == listing_id
    assert payload["status"] == "active"
    assert payload["billing_period"] == "quarterly"
    assert payload["price"] == {"amount": "27.000000000000000000", "currency": "ACP"}
    assert payload["last_order_id"] is not None
    assert payload["next_billing_at"] is not None

    assert _user_balance(client, buyer["id"], headers=buyer_headers) == Decimal("23.000000000000000000")

    grants = client.get(
        "/v1/access/grants",
        params={"grantee_type": "user", "grantee_id": buyer["id"]},
        headers=buyer_headers,
    )
    assert grants.status_code == 200, grants.text
    grant_items = grants.json()["items"]
    assert any(item["strategy_id"] == strategy_id and item["scope"] == "execute" for item in grant_items)

    listed = client.get("/v1/subscriptions", headers=buyer_headers)
    assert listed.status_code == 200, listed.text
    assert any(item["id"] == payload["id"] for item in listed.json()["items"])


def test_create_subscription_requires_sufficient_balance(client):
    seller, seller_headers = _register_user(client)
    buyer, buyer_headers = _register_user(client)
    seller_agent_id = _create_agent(client, seller_headers, prefix="seller_sub_low")
    _strategy_id, listing_id = _create_subscription_listing(client, seller_headers, owner_agent_id=seller_agent_id, monthly="10")
    _deposit_user_credits(client, buyer["id"], amount="5", currency="ACP", headers=buyer_headers)

    created = client.post(
        "/v1/subscriptions",
        json={"listing_id": listing_id, "billing_period": "monthly", "auto_renew": True},
        headers=buyer_headers,
    )
    assert created.status_code == 402, created.text
    assert created.json()["detail"] == "Insufficient balance for subscription"


def test_subscriptions_tick_renews_due_subscription_and_records_output(client):
    seller, seller_headers = _register_user(client)
    buyer, buyer_headers = _register_user(client)
    seller_agent_id = _create_agent(client, seller_headers, prefix="seller_tick_ok")
    _strategy_id, listing_id = _create_subscription_listing(client, seller_headers, owner_agent_id=seller_agent_id, monthly="10")
    _deposit_user_credits(client, buyer["id"], amount="50", currency="ACP", headers=buyer_headers)

    created = client.post(
        "/v1/subscriptions",
        json={"listing_id": listing_id, "billing_period": "monthly", "auto_renew": True},
        headers=buyer_headers,
    )
    assert created.status_code == 201, created.text
    subscription_id = created.json()["id"]
    first_order_id = created.json()["last_order_id"]

    from sqlalchemy import text
    from app.db.session import SessionLocal

    async def _force_due_once() -> None:
        async with SessionLocal() as session:
            await session.execute(
                text("UPDATE subscriptions SET next_billing_at = NOW() - INTERVAL '1 minute' WHERE id = :sid"),
                {"sid": subscription_id},
            )
            await session.commit()

    import asyncio

    asyncio.run(_force_due_once())

    tick = client.post("/v1/system/jobs/tick")
    assert tick.status_code == 200, tick.text
    subs = tick.json()["subscriptions"]
    assert subs["processed"] >= 1
    assert subs["renewed"] >= 1
    assert subs["errors"] == 0

    listed = client.get("/v1/subscriptions", headers=buyer_headers)
    assert listed.status_code == 200, listed.text
    sub = next(item for item in listed.json()["items"] if item["id"] == subscription_id)
    assert sub["status"] == "active"
    assert sub["last_order_id"] != first_order_id
    assert _user_balance(client, buyer["id"], headers=buyer_headers) == Decimal("30.000000000000000000")


def test_subscriptions_tick_marks_past_due_then_pauses_after_retries(client):
    seller, seller_headers = _register_user(client)
    buyer, buyer_headers = _register_user(client)
    seller_agent_id = _create_agent(client, seller_headers, prefix="seller_tick_retry")
    _strategy_id, listing_id = _create_subscription_listing(client, seller_headers, owner_agent_id=seller_agent_id, monthly="10")
    _deposit_user_credits(client, buyer["id"], amount="10", currency="ACP", headers=buyer_headers)

    created = client.post(
        "/v1/subscriptions",
        json={"listing_id": listing_id, "billing_period": "monthly", "auto_renew": True},
        headers=buyer_headers,
    )
    assert created.status_code == 201, created.text
    subscription_id = created.json()["id"]

    from sqlalchemy import text
    from app.db.session import SessionLocal
    import asyncio

    async def _force_due() -> None:
        async with SessionLocal() as session:
            await session.execute(
                text("UPDATE subscriptions SET next_billing_at = NOW() - INTERVAL '1 minute' WHERE id = :sid"),
                {"sid": subscription_id},
            )
            await session.commit()

    asyncio.run(_force_due())
    tick1 = client.post("/v1/system/jobs/tick")
    assert tick1.status_code == 200, tick1.text
    subs1 = tick1.json()["subscriptions"]
    assert subs1["past_due"] >= 1
    assert subs1["paused"] == 0

    listed1 = client.get("/v1/subscriptions", headers=buyer_headers)
    sub1 = next(item for item in listed1.json()["items"] if item["id"] == subscription_id)
    assert sub1["status"] == "past_due"
    assert sub1["retry_count"] == 1
    assert sub1["next_billing_at"] is not None

    asyncio.run(_force_due())
    tick2 = client.post("/v1/system/jobs/tick")
    assert tick2.status_code == 200, tick2.text
    subs2 = tick2.json()["subscriptions"]
    assert subs2["past_due"] >= 1

    asyncio.run(_force_due())
    tick3 = client.post("/v1/system/jobs/tick")
    assert tick3.status_code == 200, tick3.text
    subs3 = tick3.json()["subscriptions"]
    assert subs3["paused"] >= 1

    listed3 = client.get("/v1/subscriptions", headers=buyer_headers)
    sub3 = next(item for item in listed3.json()["items"] if item["id"] == subscription_id)
    assert sub3["status"] == "paused"
    assert sub3["retry_count"] == 3
    assert sub3["next_billing_at"] is None
