"""Startup-investment literacy catalog smoke."""


def test_startup_invest_catalog(client):
    r = client.get("/v1/startups/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["as_of"] == "2026-09-12"
    note = body["compliance_note"].lower()
    assert "not a securities offering" in note
    assert "cnews.ru" in body["research_ref"]["url"]
    refs = {x["id"] for x in body["research_refs"]}
    assert {
        "cnews-spark-ict-gazelles-2026",
        "forbes-frii-small-it-2024",
        "skypro-it-business-ideas-2025",
        "businessmens-tech-niches-2026",
    } <= refs
    sectors = {s["id"] for s in body["sectors"]}
    assert {"ai_ml", "retail_ecommerce", "secaas", "agrotech_industry"} <= sectors
    briefs = {b["id"] for b in body["briefs"]}
    assert {
        "startup-market-map",
        "startup-retail-b2b",
        "startup-ai-ml",
        "startup-secaas",
        "startup-agrotech",
        "startup-gazelle-diligence",
    } <= briefs
    gazelle = next(b for b in body["briefs"] if b["id"] == "startup-gazelle-diligence")
    assert gazelle["price_from_acp"] == "75000"
    principles = {p["id"] for p in body["principles"]}
    assert {"S1", "S3", "S5", "S8"} <= principles
    assert any("securities" in (p["title"] + p["body"]).lower() for p in body["principles"])
