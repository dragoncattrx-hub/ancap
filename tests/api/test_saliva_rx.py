"""Saliva Rx catalog smoke."""


def test_saliva_rx_catalog(client):
    r = client.get("/v1/saliva-rx/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "saliva" in body["compliance_note"].lower()
    assert "not" in body["compliance_note"].lower() and "cure" in body["compliance_note"].lower()
    assert len(body["pipeline"]) >= 6
    assert len(body["services"]) >= 6
    ids = {s["id"] for s in body["services"]}
    assert {"saliva-kit", "saliva-rx-design", "saliva-compound-batch"} <= ids
    assert body["legal_href"] == "/legal/saliva-rx-notice"
    assert any(p["id"] == "compounding-rx-network" for p in body["partners"])
