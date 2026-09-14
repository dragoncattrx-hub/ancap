"""Worldwide legal counsel desk catalog honesty."""


def test_counsel_catalog(client):
    r = client.get("/v1/counsel/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    note = body["compliance_note"].lower()
    assert "not a law firm" in note or "does not practice law" in note
    assert "attorney" in note and "client" in note
    assert body["legal_href"] == "/legal/counsel"
    assert body.get("practices_law") is False
    assert body.get("attorney_client") is False

    ids = {s["id"] for s in body["services"]}
    for expected in (
        "counsel-jurisdiction-match",
        "counsel-entity-setup",
        "counsel-contract-review",
        "counsel-crypto-assets",
        "counsel-immigration",
        "counsel-ip-trademark",
        "counsel-dispute-referral",
        "counsel-tax-match",
    ):
        assert expected in ids

    regions = {r["id"] for r in body["regions"]}
    assert "eu-eea-uk" in regions
    assert "americas" in regions
    assert "global-remote" in regions

    match = next(s for s in body["services"] if s["id"] == "counsel-jurisdiction-match")
    assert match["price_from_acp"] == "3900"
    assert match["workflow_slug"] == "counsel-jurisdiction-match"


def test_counsel_workflow_templates_catalogued():
    from app.services.workflow_execution import WORKFLOW_TEMPLATES

    slugs = {t.slug for t in WORKFLOW_TEMPLATES}
    assert "counsel-jurisdiction-match" in slugs
    assert "counsel-entity-setup" in slugs
    assert "counsel-contract-review" in slugs
    assert "counsel-crypto-assets" in slugs
    counsel = [t for t in WORKFLOW_TEMPLATES if t.category == "Counsel"]
    assert len(counsel) >= 4
    prices = {t.slug: t.price.amount for t in counsel}
    assert prices["counsel-jurisdiction-match"] == "3900"
    assert prices["counsel-crypto-assets"] == "12000"
