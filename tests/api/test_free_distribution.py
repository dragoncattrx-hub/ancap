"""Free ACP distribution cap + faucet amount cap."""
from decimal import Decimal
from uuid import uuid4

from app.config import get_settings
from app.services.free_distribution import faucet_max_amount, free_distribution_cap
from tests.conftest import unique_email


def test_faucet_max_defaults_to_ten():
    assert faucet_max_amount() == Decimal("10")


def test_free_distribution_cap_defaults_to_one_million():
    assert free_distribution_cap() == Decimal("1000000")


def test_market_free_distribution_endpoint(client):
    r = client.get("/v1/market/free-distribution", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "open" in data
    assert data["cap_acp"] == "1000000"
    assert "distributed_acp" in data


def test_total_free_acp_counts_only_positive_credit_legs(client):
    """Referral signup bonus writes ±legs; cap accounting must count credit once."""
    from sqlalchemy import create_engine, text

    before = Decimal(
        client.get("/v1/market/free-distribution", headers={"Authorization": ""}).json()[
            "distributed_acp"
        ]
    )
    db_url = (
        __import__("os").environ.get("DATABASE_URL", "")
        .replace("+asyncpg", "")
        .replace("postgresql+asyncpg", "postgresql")
    )
    engine = create_engine(db_url)
    debit_id = str(uuid4())
    credit_id = str(uuid4())
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO ledger_events (id, ts, type, amount_currency, amount_value, metadata)
                VALUES
                  (:d, NOW(), 'transfer', 'ACP', -25, CAST(:meta_debit AS jsonb)),
                  (:c, NOW(), 'transfer', 'ACP', 25, CAST(:meta_credit AS jsonb))
                """
            ),
            {
                "d": debit_id,
                "c": credit_id,
                "meta_debit": '{"type":"referral_signup_bonus","leg":"system_debit","test":"cap_positive_only"}',
                "meta_credit": '{"type":"referral_signup_bonus","leg":"beneficiary_credit","test":"cap_positive_only"}',
            },
        )
    after = Decimal(
        client.get("/v1/market/free-distribution", headers={"Authorization": ""}).json()[
            "distributed_acp"
        ]
    )
    assert after - before == Decimal("25")


def test_faucet_rejects_amount_above_cap(client, monkeypatch):
    email = unique_email()
    reg = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "Faucet Cap"},
        headers={"Authorization": ""},
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    r = client.post(
        "/v1/onboarding/faucet/claim",
        json={"currency": "ACP", "amount": "11"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400, r.text
    assert "cap" in r.text.lower()


def test_faucet_held_when_distribution_disabled(client, monkeypatch):
    monkeypatch.setenv("FREE_ACP_DISTRIBUTION_ENABLED", "false")
    get_settings.cache_clear()
    email = unique_email()
    reg = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "No Dist"},
        headers={"Authorization": ""},
    )
    assert reg.status_code == 201, reg.text
    token = reg.json()["access_token"]
    r = client.post(
        "/v1/onboarding/faucet/claim",
        json={"currency": "ACP", "amount": "10"},
        headers={"Authorization": f"Bearer {token}"},
    )
    # claim endpoint returns 201 with rejected/held status, or 400 depending on path
    assert r.status_code in (201, 400), r.text
    if r.status_code == 201:
        assert r.json()["claim_status"] in ("rejected", "held")
    get_settings.cache_clear()
