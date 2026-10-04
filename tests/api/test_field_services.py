"""Field services hub — catalog groups, quote per group, workflow SKUs."""
from decimal import Decimal


def test_field_services_catalog_groups(client):
    r = client.get("/v1/field-services/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    note = body["compliance_note"].lower()
    assert "not an official" in note or "reseller" in note
    assert "jobcenter" in note or "avgs" in note
    assert body["legal_href"] == "/legal/field-services"
    assert body.get("official_reseller") is False
    assert body.get("jobcenter_guarantee") is False
    assert body["service_fee_eur"] == "3"

    group_ids = {g["id"] for g in body["groups"]}
    assert group_ids == {"starlink", "it", "cameras", "solar", "space"}
    note_l = body["compliance_note"].lower()
    assert "launch" in note_l or "orbital" in note_l or "spacex" in note_l

    ids = {s["id"] for s in body["services"]}
    for expected in (
        "starlink-standard",
        "it-pc-setup",
        "cam-cctv-install",
        "solar-balcony-install",
        "panel-other-mount",
        "space-ai-orbit-intake",
        "space-ai-beyond-orbit",
        "space-ai-superintel-architecture",
    ):
        assert expected in ids

    by_group = {}
    for s in body["services"]:
        by_group.setdefault(s["group_id"], set()).add(s["id"])
    assert "starlink-standard" in by_group["starlink"]
    assert "it-pc-setup" in by_group["it"]
    assert "cam-nvr-config" in by_group["cameras"]
    assert "solar-panel-service" in by_group["solar"]
    assert "space-ai-orbit-intake" in by_group["space"]


def test_field_services_catalog_filter_group(client):
    r = client.get("/v1/field-services/catalog", params={"group": "it"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["services"]
    assert all(s["group_id"] == "it" for s in body["services"])


def test_field_services_quote_it(client):
    r = client.post(
        "/v1/field-services/quote",
        json={"service_id": "it-pc-setup", "region": "de-nrw", "payment_currency": "ACP"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert Decimal(body["installation_fee_eur"]) == Decimal("120")
    assert Decimal(body["service_fee_eur"]) == Decimal("3")
    assert Decimal(body["total_eur"]) == Decimal("123")
    assert body["group_id"] == "it"
    assert body["workflow_slug"] == "it-pc-setup"
    assert float(body["amount_wacp"]) == float(body["amount_acp"]) * 10


def test_field_services_quote_cameras(client):
    r = client.post(
        "/v1/field-services/quote",
        json={"service_id": "cam-cctv-install", "region": "de-nrw", "payment_currency": "wACP"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert Decimal(body["total_eur"]) == Decimal("183")
    assert body["payment_currency"] == "WACP"
    assert body["group_id"] == "cameras"


def test_field_services_quote_solar(client):
    r = client.post(
        "/v1/field-services/quote",
        json={"service_id": "solar-balcony-install", "region": "de", "payment_currency": "ACP"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert Decimal(body["total_eur"]) == Decimal("253")
    assert body["workflow_slug"] == "solar-balcony-install"


def test_field_services_quote_unknown(client):
    r = client.post("/v1/field-services/quote", json={"service_id": "nope"})
    assert r.status_code == 400


def test_field_services_quote_space_orbit(client):
    r = client.post(
        "/v1/field-services/quote",
        json={"service_id": "space-ai-orbit-intake", "region": "de-nrw", "payment_currency": "ACP"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert Decimal(body["installation_fee_eur"]) == Decimal("12000")
    assert Decimal(body["service_fee_eur"]) == Decimal("3")
    assert Decimal(body["total_eur"]) == Decimal("12003")
    assert body["group_id"] == "space"
    assert body["workflow_slug"] == "space-ai-orbit-intake"


def test_field_services_catalog_filter_space(client):
    r = client.get("/v1/field-services/catalog", params={"group": "space"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["services"]
    assert all(s["group_id"] == "space" for s in body["services"])
    assert {s["id"] for s in body["services"]} >= {
        "space-ai-orbit-intake",
        "space-ai-beyond-orbit",
        "space-ai-superintel-architecture",
    }


def test_field_services_workflow_templates():
    from app.services.workflow_execution import WORKFLOW_TEMPLATES

    field = [t for t in WORKFLOW_TEMPLATES if t.category == "FieldServices"]
    slugs = {t.slug for t in field}
    for expected in (
        "it-pc-setup",
        "it-device-repair",
        "it-network-home",
        "it-maintenance-visit",
        "cam-cctv-install",
        "cam-nvr-config",
        "cam-maintenance",
        "solar-balcony-install",
        "solar-panel-service",
        "panel-other-mount",
        "space-ai-orbit-intake",
        "space-ai-beyond-orbit",
        "space-ai-superintel-architecture",
    ):
        assert expected in slugs
    prices = {t.slug: t.price.amount for t in field}
    assert prices["it-pc-setup"] == "123"
    assert prices["cam-maintenance"] == "78"
    assert prices["panel-other-mount"] == "153"
    assert prices["space-ai-orbit-intake"] == "12003"
    assert prices["space-ai-superintel-architecture"] == "48003"
    for t in field:
        assert "ACP" in t.accepted_currencies
        assert "wACP" in t.accepted_currencies
