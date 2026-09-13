"""StardustSRT weather-control catalog smoke."""


def test_stardust_catalog(client):
    r = client.get("/v1/stardust/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["brand"] == "StardustSRT"
    assert "weather" in body["compliance_note"].lower()
    assert "geoengineering" in body["compliance_note"].lower() or "not unilaterally" in body["compliance_note"].lower()
    assert len(body["services"]) >= 4
    ids = {s["id"] for s in body["services"]}
    assert "stardust-weather-control-global" in ids
    assert "stardust-weather-control-sub" in ids
    priced = {s["id"]: s["price_from_acp"] for s in body["services"]}
    assert priced["stardust-weather-control-global"] == "58000"
    assert priced["stardust-weather-control-sub"] == "45000"
    assert any(s.get("workflow_slug") == "stardust-weather-control-global" for s in body["services"])
    modules = {m["id"] for m in body["monitoring_modules"]}
    assert {"seismic", "extreme-weather", "tsunami"} <= modules
    controls = {c["id"] for c in body["weather_controls"]}
    assert {"rainfall", "storm", "temperature", "snow"} <= controls
    assert body["legal_href"] == "/legal/stardust"
