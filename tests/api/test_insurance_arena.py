"""ACP Insurance + Arena API tests."""

from tests.api.test_organizations import _register_and_login


def test_insurance_catalog_and_quote(client):
    catalog = client.get("/v1/insurance/catalog")
    assert catalog.status_code == 200, catalog.text
    body = catalog.json()
    assert body["currency"] == "ACP"
    assert len(body["products"]) >= 5
    coverage = body["products"][0]["coverage_class"]

    quote = client.post(
        "/v1/insurance/quote",
        json={"coverage_class": coverage, "sum_insured_acp": "1000", "term_days": 30},
    )
    assert quote.status_code == 200, quote.text
    q = quote.json()
    assert float(q["premium_acp"]) > 0
    assert q["quote_hash"]


def test_insurance_buy_and_claim(client):
    user, headers, _ = _register_and_login(client, "Insurance Buyer")
    policy = client.post(
        "/v1/insurance/policies",
        headers=headers,
        json={"coverage_class": "wallet_theft", "sum_insured_acp": "500", "term_days": 30},
    )
    assert policy.status_code == 201, policy.text
    pid = policy.json()["id"]
    assert policy.json()["status"] == "active"

    listed = client.get("/v1/insurance/policies", headers=headers)
    assert listed.status_code == 200
    assert any(p["id"] == pid for p in listed.json())

    claim = client.post(
        f"/v1/insurance/policies/{pid}/claims",
        headers=headers,
        json={"amount_acp": "100", "note": "device lost", "evidence": {"report": "ticket-1"}},
    )
    assert claim.status_code == 201, claim.text
    assert claim.json()["status"] == "filed"


def test_arena_catalog_bet_and_house(client):
    catalog = client.get("/v1/arena/catalog")
    assert catalog.status_code == 200, catalog.text
    body = catalog.json()
    assert body["currency"] == "ACP"
    assert len(body["markets"]) >= 1
    assert len(body["house_games"]) >= 1
    market_id = body["markets"][0]["id"]

    _, headers, _ = _register_and_login(client, "Arena Player")
    bet = client.post(
        f"/v1/arena/markets/{market_id}/bets",
        headers=headers,
        json={"side": "yes", "stake_acp": "10"},
    )
    assert bet.status_code == 201, bet.text
    assert bet.json()["side"] == "yes"

    legacy = client.post(
        "/v1/arena/house/play",
        headers=headers,
        json={"game": "coinflip", "stake_acp": "5", "choice": "heads"},
    )
    assert legacy.status_code == 400

    commit = client.post(
        "/v1/arena/house/commit",
        headers=headers,
        json={"game": "coinflip", "stake_acp": "5"},
    )
    assert commit.status_code == 201, commit.text
    committed = commit.json()
    assert committed["status"] == "committed"
    assert committed["server_seed_hash"]
    assert committed.get("server_seed") in (None, "")

    reveal = client.post(
        "/v1/arena/house/reveal",
        headers=headers,
        json={
            "round_id": committed["id"],
            "choice": "heads",
            "client_seed": "clientseed99",
        },
    )
    assert reveal.status_code == 200, reveal.text
    round_body = reveal.json()
    assert round_body["result"] in ("heads", "tails")
    assert round_body["server_seed_hash"] == committed["server_seed_hash"]
    assert round_body["server_seed"]
    assert round_body["status"] == "resolved"


def test_exponential_growth_quote(client):
    _, headers, _ = _register_and_login(client, "Growth User")
    growth = client.get("/v1/growth/exponential", headers=headers)
    assert growth.status_code == 200, growth.text
    body = growth.json()
    assert "total_multiplier" in body
    assert float(body["total_multiplier"]) >= 1.0

    quote = client.post(
        "/v1/growth/exponential/compound",
        headers=headers,
        json={"principal_acp": "100", "periods": 3},
    )
    assert quote.status_code == 200, quote.text
    assert float(quote.json()["projected_acp"]) >= 100.0
