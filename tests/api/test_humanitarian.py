"""Humanitarian aid desk catalog honesty."""


def test_humanitarian_catalog(client):
    r = client.get("/v1/humanitarian/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    note = body["compliance_note"].lower()
    assert "red cross" in note or "красный" in note
    assert "tax-deductible" in note or "135-fz" in note or "135-фз" in note
    assert "welcome grant" in note or "welcome-grant" in note
    assert body["legal_href"] == "/legal/humanitarian"
    assert body.get("official_partnership") is False
    assert body.get("emblem_licensed") is False

    ids = {s["id"] for s in body["services"]}
    for expected in (
        "aid-food",
        "aid-water",
        "aid-nutrition",
        "aid-clothing",
        "aid-medical",
        "aid-livelihood",
    ):
        assert expected in ids

    blob = str(body).lower()
    assert "tax-deductible donation receipt" in blob or "not a tax-deductible" in note
    assert "pharmacy" in blob
    assert "employment agency" in blob or "livelihood" in blob
    assert "geneva" in blob or "emblem" in blob

    names = {p["name"].lower() for p in body["partners"]}
    assert any("ifrc" in n or "federation" in n for n in names)
    assert any("russian" in n or "российск" in n for n in names)
    assert any("ukrain" in n or "червоного" in n for n in names)
    assert any("german" in n or "deutsches" in n or "drk" in n for n in names)
    assert any("american" in n for n in names)
    assert all(p.get("official_partnership") is False for p in body["partners"])
    assert all(p.get("emblem_licensed") is False for p in body["partners"])
    assert all(p.get("ethics_note") for p in body["partners"])
    assert all(str(p.get("website", "")).startswith("https://") for p in body["partners"])
