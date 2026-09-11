"""Quantum-link digital SIM catalog smoke."""


def test_quantum_sim_catalog(client):
    r = client.get("/v1/quantum-sim/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "quantum" in body["compliance_note"].lower() or "post-quantum" in body["compliance_note"].lower()
    assert len(body["services"]) >= 4
    assert any(s["id"] == "qsim-esim" for s in body["services"])
    assert any(s["id"] == "qsim-global-mesh" for s in body["services"])
    assert "ixbt.com" in body["research_ref"]["url"]
    layers = {m["id"] for m in body["mesh_layers"]}
    assert {"satellite", "bts", "repeater"} <= layers
