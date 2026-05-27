from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from tests.conftest import unique_name


def _register_user(client, prefix: str):
    email = f"{prefix}_{uuid4().hex[:10]}@test.com"
    password = "password123"
    response = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": prefix},
        headers={"Authorization": ""},
    )
    assert response.status_code in (200, 201), response.text
    token = response.json()["access_token"]
    user = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    return user, {"Authorization": f"Bearer {token}"}


def _create_agent(client, headers: dict[str, str], role: str, display_prefix: str) -> str:
    response = client.post(
        "/v1/agents",
        json={"display_name": unique_name(display_prefix), "public_key": (role[:1] or "x") * 32, "roles": [role]},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _create_strategy_with_listing(client, headers: dict[str, str], owner_agent_id: str, base_vertical_id: str, *, price: str = "10", currency: str = "ACP") -> tuple[str, str, str]:
    strategy = client.post(
        "/v1/strategies",
        json={
            "name": unique_name("creator_strategy"),
            "vertical_id": base_vertical_id,
            "owner_agent_id": owner_agent_id,
            "tags": ["growth"],
        },
        headers=headers,
    )
    assert strategy.status_code == 201, strategy.text
    strategy_id = strategy.json()["id"]

    workflow = {
        "vertical_id": base_vertical_id,
        "version": "1.0",
        "steps": [
            {"id": "s1", "action": "const", "args": {"value": 1}, "save_as": "x"},
            {"id": "s2", "action": "math_add", "args": {"a": {"ref": "x"}, "b": 2}},
        ],
    }
    version = client.post(
        f"/v1/strategies/{strategy_id}/versions",
        json={"semver": "1.0.0", "workflow": workflow},
        headers=headers,
    )
    assert version.status_code == 201, version.text
    version_id = version.json()["id"]

    listing = client.post(
        "/v1/listings",
        json={
            "strategy_id": strategy_id,
            "strategy_version_id": version_id,
            "fee_model": {"type": "one_time", "one_time_price": {"amount": price, "currency": currency}},
            "status": "active",
        },
        headers=headers,
    )
    assert listing.status_code == 201, listing.text
    return strategy_id, version_id, listing.json()["id"]


def _deposit_agent_balance(client, agent_id: str, *, amount: str, currency: str, headers: dict[str, str]):
    response = client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "agent",
            "account_owner_id": agent_id,
            "amount": {"amount": amount, "currency": currency},
        },
        headers={**headers, "Idempotency-Key": unique_name("creator_deposit")},
    )
    assert response.status_code == 201, response.text


def _deposit_user_balance(client, user_id: str, *, amount: str, currency: str, headers: dict[str, str]):
    response = client.post(
        "/v1/ledger/deposit",
        json={
            "account_owner_type": "user",
            "account_owner_id": user_id,
            "amount": {"amount": amount, "currency": currency},
        },
        headers={**headers, "Idempotency-Key": unique_name("creator_user_deposit")},
    )
    assert response.status_code == 201, response.text


def _place_order(client, listing_id: str, buyer_id: str, headers: dict[str, str]):
    response = client.post(
        "/v1/orders",
        json={
            "listing_id": listing_id,
            "buyer_type": "agent",
            "buyer_id": buyer_id,
            "payment_method": "ledger",
        },
        headers={**headers, "Idempotency-Key": unique_name("creator_order")},
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_payout_request(client, headers: dict[str, str], *, amount: str, destination: str):
    response = client.post(
        "/v1/payouts/request",
        json={
            "amount": {"amount": amount, "currency": "ACP"},
            "method": "acp_wallet",
            "destination": destination,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_creator_earnings_summary_aggregates_listing_revenue_and_pending_payouts(client, base_vertical_id):
    creator_user, creator_headers = _register_user(client, "creator_owner")
    seller_agent_id = _create_agent(client, creator_headers, "seller", "creator_seller")
    _, _, listing_id = _create_strategy_with_listing(client, creator_headers, seller_agent_id, base_vertical_id, price="12", currency="ACP")

    buyer_user, buyer_headers = _register_user(client, "creator_buyer")
    buyer_agent_id = _create_agent(client, buyer_headers, "buyer", "creator_buyer_agent")
    _deposit_agent_balance(client, buyer_agent_id, amount="100", currency="ACP", headers=buyer_headers)
    _place_order(client, listing_id, buyer_agent_id, buyer_headers)
    _place_order(client, listing_id, buyer_agent_id, buyer_headers)

    _deposit_user_balance(client, creator_user["id"], amount="5", currency="ACP", headers=creator_headers)
    payout = _create_payout_request(client, creator_headers, amount="5", destination="ACP_CREATOR_DESTINATION")
    assert payout["status"] == "pending"

    response = client.get("/v1/creators/me/earnings?days=30", headers=creator_headers)
    assert response.status_code == 200, response.text
    payload = response.json()

    assert Decimal(payload["total_earnings_acp"]) == Decimal("24")
    assert Decimal(payload["window_earnings_acp"]) == Decimal("24")
    assert Decimal(payload["pending_payout_acp"]) == Decimal("5")
    assert Decimal(payload["paid_out_acp"]) == Decimal("0")
    assert payload["active_listing_count"] == 1
    assert payload["completed_order_count"] == 2
    assert payload["conversion_rate"] is None
    assert payload["conversion_rate_basis"] == "awaiting_checkout_funnel_instrumentation"
    assert len(payload["earnings_by_workflow"]) == 1
    workflow_row = payload["earnings_by_workflow"][0]
    assert workflow_row["strategy_id"]
    assert workflow_row["captured_amount_acp"] == "24.000000000000000000"
    assert workflow_row["order_count"] == 2
    assert workflow_row["latest_order_at"] is not None
    assert payload["earnings_by_period"]



def test_creator_conversions_returns_completed_order_counts_and_zero_uninstrumented_stages(client, base_vertical_id):
    creator_user, creator_headers = _register_user(client, "creator_conv_owner")
    seller_agent_id = _create_agent(client, creator_headers, "seller", "creator_conv_seller")
    _, _, listing_id = _create_strategy_with_listing(client, creator_headers, seller_agent_id, base_vertical_id, price="9", currency="ACP")

    buyer_user, buyer_headers = _register_user(client, "creator_conv_buyer")
    buyer_agent_id = _create_agent(client, buyer_headers, "buyer", "creator_conv_buyer_agent")
    _deposit_agent_balance(client, buyer_agent_id, amount="50", currency="ACP", headers=buyer_headers)
    _place_order(client, listing_id, buyer_agent_id, buyer_headers)

    response = client.get("/v1/creators/me/conversions?days=30", headers=creator_headers)
    assert response.status_code == 200, response.text
    payload = response.json()

    assert payload["coverage"] == {
        "views": False,
        "add_to_cart": False,
        "checkout_started": False,
        "completed": True,
    }
    assert payload["totals"] == {
        "views": 0,
        "add_to_cart": 0,
        "checkout_started": 0,
        "completed": 1,
    }
    assert len(payload["listings"]) == 1
    row = payload["listings"][0]
    assert row["listing_id"] == listing_id
    assert row["counts"] == {
        "views": 0,
        "add_to_cart": 0,
        "checkout_started": 0,
        "completed": 1,
    }
    assert payload["periods"]



def test_creator_endpoints_require_authentication(client):
    earnings = client.get("/v1/creators/me/earnings", headers={"Authorization": ""})
    assert earnings.status_code == 401, earnings.text

    conversions = client.get("/v1/creators/me/conversions", headers={"Authorization": ""})
    assert conversions.status_code == 401, conversions.text
