"""TECH auction + AuctionEscrow anchoring tests."""

from tests.api.test_organizations import _register_and_login


def test_tech_auction_catalog_and_bid(client):
    catalog = client.get("/v1/tech-auction/catalog")
    assert catalog.status_code == 200, catalog.text
    body = catalog.json()
    assert body["currency"] == "ACP"
    assert len(body["lots"]) >= 3
    assert len(body["technologies"]) >= 3
    lot_id = body["lots"][0]["id"]
    min_next = body["lots"][0]["min_next_acp"]

    _, headers, _ = _register_and_login(client, "Tech Bidder")
    bid = client.post(
        f"/v1/tech-auction/lots/{lot_id}/bids",
        headers=headers,
        json={"amount_acp": min_next},
    )
    assert bid.status_code == 201, bid.text
    data = bid.json()
    assert data["status"] == "winning"
    assert data["tx_hash"]
    assert data["tx_hash"].startswith("0x")


def test_tech_auction_list_anchors_create(client):
    _, headers, _ = _register_and_login(client, "Tech Seller")
    listed = client.post(
        "/v1/tech-auction/lots",
        headers=headers,
        json={
            "category": "ai_workflow",
            "title": "Custom ACP workflow pack",
            "stack": "FastAPI + ledger",
            "blurb": "Licensed workflow rail for agents with ACP metering.",
            "starting_acp": "5000",
            "license_acknowledged": True,
        },
    )
    assert listed.status_code == 201, listed.text
    lot = listed.json()
    assert lot["tx_hash"]
    assert lot["contract_hash"]
