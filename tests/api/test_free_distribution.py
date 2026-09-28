"""Free ACP distribution cap + faucet amount cap."""
from decimal import Decimal

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
    from app.config import get_settings

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
