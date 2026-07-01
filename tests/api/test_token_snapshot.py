"""Free token risk snapshot endpoint."""


def test_token_snapshot_name_only(client):
    r = client.post("/v1/token-snapshot", json={"subject": "ANCAP", "chain": "bsc"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert 0 <= data["score"] <= 100
    assert data["risk_level"] in ("low", "medium", "high")
    assert data["is_contract_address"] is False
    assert data["onchain_verified"] is False
    keys = {check["key"] for check in data["checks"]}
    assert "contract_address" in keys
    assert "liquidity_proof" in keys


def test_token_snapshot_address_without_rpc(client, monkeypatch):
    """Address input on an unsupported chain reports needs_evidence instead of failing."""
    r = client.post(
        "/v1/token-snapshot",
        json={"subject": "0x" + "a" * 40, "chain": "solana"},
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["is_contract_address"] is True
    assert data["onchain_verified"] is False
    keys = {check["key"] for check in data["checks"]}
    assert "onchain_lookup" in keys


def test_token_snapshot_validation(client):
    r = client.post("/v1/token-snapshot", json={"subject": ""})
    assert r.status_code == 422
