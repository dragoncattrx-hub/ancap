"""Dark matter title auction API tests."""
from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from app.main import app
from app.services.dark_matter_auction import kinds


def _register_user(client):
    email = f"dm_{uuid4().hex[:12]}@test.com"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "dm bidder"},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_dark_matter_auction_routes_registered():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/dark-matter-auction/catalog" in paths
    assert "/v1/dark-matter-auction/catalog" in paths
    assert "/dark-matter-auction/lots/{lot_id}/bids" in paths


def test_dark_matter_auction_catalog(client):
    res = client.get("/v1/dark-matter-auction/catalog")
    assert res.status_code == 200, res.text
    data = res.json()
    lots = data["lots"]
    kinds_found = {lot["kind"] for lot in lots}
    assert kinds_found == set(kinds())
    assert data["legal_href"] == "/legal/dark-matter"
    assert any(lot["id"] == "dm-milky-way-halo" for lot in lots)
    assert any(lot["id"] == "dm-bullet-cluster" for lot in lots)
    featured_ids = {lot["id"] for lot in data["featured"]}
    assert "dm-milky-way-halo" in featured_ids
    halo = next(lot for lot in lots if lot["id"] == "dm-milky-way-halo")
    assert halo["starting_acp"] == "22000000"
    assert "not" in data["compliance_note"].lower() or "do not" in data["compliance_note"].lower()


def test_dark_matter_auction_bid_updates_price(client):
    headers = _register_user(client)
    catalog = client.get("/v1/dark-matter-auction/catalog")
    assert catalog.status_code == 200, catalog.text
    lot = next(x for x in catalog.json()["lots"] if x["id"] == "dm-xenon-nt")
    first_amount = lot["min_next_acp"] if int(lot["bid_count"] or 0) else lot["current_acp"]
    first = client.post(
        "/v1/dark-matter-auction/lots/dm-xenon-nt/bids",
        json={"amount_acp": first_amount},
        headers=headers,
    )
    assert first.status_code == 201, first.text
    body = first.json()
    assert Decimal(body["amount_acp"]) == Decimal(first_amount)
    assert Decimal(body["lot"]["current_acp"]) == Decimal(first_amount)

    too_low = client.post(
        "/v1/dark-matter-auction/lots/dm-xenon-nt/bids",
        json={"amount_acp": first_amount},
        headers=headers,
    )
    assert too_low.status_code == 400


def test_dark_matter_auction_bid_requires_auth(client):
    res = client.post(
        "/v1/dark-matter-auction/lots/dm-xenon-nt/bids",
        json={"amount_acp": "125000"},
        headers={"Authorization": ""},
    )
    assert res.status_code in (401, 403)
