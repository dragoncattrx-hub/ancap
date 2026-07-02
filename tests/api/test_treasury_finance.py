"""Finance model: fee-policy surface and treasury transparency endpoint."""
from decimal import Decimal


def test_system_fees_expose_finance_policy(client):
    res = client.get("/v1/system/fees")
    assert res.status_code == 200, res.text
    body = res.json()
    # Marketplace take rate + referral economics must be surfaced for the UI.
    for key in (
        "order_fee_percent",
        "run_fee_percent",
        "listing_fee_percent",
        "referral_signup_bonus_acp",
        "referral_commission_share_rate",
    ):
        assert key in body, f"missing {key} in /system/fees"
    assert Decimal(body["order_fee_percent"]) >= Decimal("0")
    assert Decimal(body["referral_signup_bonus_acp"]) >= Decimal("0")
    assert Decimal("0") <= Decimal(body["referral_commission_share_rate"]) <= Decimal("1")


def test_treasury_status_shape(client):
    res = client.get("/v1/treasury/status")
    assert res.status_code == 200, res.text
    body = res.json()
    assert set(["onchain", "ledger", "revenue_breakdown_30d", "expense_breakdown_30d", "fee_policy"]).issubset(
        body.keys()
    )
    onchain = body["onchain"]
    assert "address" in onchain and "balance_acp" in onchain and "utxo_count" in onchain
    ledger = body["ledger"]
    for key in ("balance", "revenue_total", "expenses_total", "revenue_30d", "expenses_30d"):
        assert key in ledger
    fee_policy = body["fee_policy"]
    assert "order_fee_percent" in fee_policy
    assert "staking_rewards_fees_share_percent" in fee_policy
