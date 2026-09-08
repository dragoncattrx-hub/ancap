"""Banknote/coin authenticity + numismatic ACP valuation tests."""

from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.numismatic_auth import NumismaticAuthRequest, NumismaticValueRequest
from app.services.numismatic_auth import authenticate, catalog, value


def test_catalog_has_banknote_and_coin_features():
    c = catalog()
    assert any(x.code == "USD" for x in c.currencies)
    assert any(x.code == "UAH" for x in c.currencies)
    bank = [f for f in c.features if "banknote" in f.applies_to]
    coin = [f for f in c.features if "coin" in f.applies_to]
    assert len(bank) >= 5
    assert len(coin) >= 4
    assert any(g["code"] == "VF" for g in c.grades)
    assert any(r["code"] == "rare" for r in c.rarity_tiers)
    assert "educational" in c.disclaimer.lower() or "prototype" in c.disclaimer.lower()


def test_authenticate_likely_genuine_when_features_present():
    feats = [f.id for f in catalog().features if "banknote" in f.applies_to]
    r = authenticate(
        NumismaticAuthRequest(
            kind="banknote",
            currency_code="usd",
            series_or_denomination="$100 Federal Reserve",
            year=1996,
            serial_or_mint_mark="AB12345678A",
            features_present=feats,
            features_missing=[],
            features_unchecked=[],
        )
    )
    assert r.verdict == "likely_genuine"
    assert r.authenticity_score >= 80
    assert r.currency_code == "USD"


def test_authenticate_insufficient_data_when_few_checks():
    r = authenticate(
        NumismaticAuthRequest(
            kind="coin",
            currency_code="EUR",
            series_or_denomination="1 euro",
            year=2002,
            features_present=["weight_match"],
            features_missing=[],
            features_unchecked=[],
        )
    )
    assert r.verdict == "insufficient_data"
    assert any("Too few" in f for f in r.flags)


def test_authenticate_suspect_when_many_missing():
    feats = [f.id for f in catalog().features if "banknote" in f.applies_to]
    r = authenticate(
        NumismaticAuthRequest(
            kind="banknote",
            currency_code="USD",
            series_or_denomination="$20",
            features_present=[],
            features_missing=feats,
            features_unchecked=[],
        )
    )
    assert r.verdict == "suspect"
    assert r.authenticity_score < 55


def test_value_applies_grade_rarity_and_auth_factor():
    strong = value(
        NumismaticValueRequest(
            kind="banknote",
            currency_code="USD",
            series_or_denomination="$100",
            year=1990,
            grade="UNC",
            rarity="rare",
            face_value_hint="100",
            authenticity_score=90,
            quantity=1,
        )
    )
    weak = value(
        NumismaticValueRequest(
            kind="banknote",
            currency_code="USD",
            series_or_denomination="$100",
            year=1990,
            grade="UNC",
            rarity="rare",
            face_value_hint="100",
            authenticity_score=40,
            quantity=1,
        )
    )
    assert Decimal(strong.indicative_acp_amount) > Decimal(weak.indicative_acp_amount)
    assert Decimal(strong.indicative_acp_amount) > Decimal("100")


def test_http_routes_mounted():
    client = TestClient(app)
    cat = client.get("/v1/mobile/numismatic/catalog")
    assert cat.status_code == 200
    body = cat.json()
    assert body["features"]
    auth = client.post(
        "/v1/mobile/numismatic/authenticate",
        json={
            "kind": "banknote",
            "currency_code": "USD",
            "series_or_denomination": "$1",
            "features_present": ["watermark", "security_thread", "paper_feel"],
            "features_missing": [],
            "features_unchecked": [],
        },
    )
    assert auth.status_code == 200
    assert "verdict" in auth.json()
    val = client.post(
        "/v1/mobile/numismatic/value",
        json={
            "kind": "coin",
            "currency_code": "USD",
            "series_or_denomination": "Morgan dollar",
            "grade": "VF",
            "rarity": "scarce",
            "face_value_hint": "1",
            "authenticity_score": 85,
        },
    )
    assert val.status_code == 200
    assert Decimal(val.json()["indicative_acp_amount"]) > 0
