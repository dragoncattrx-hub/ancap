from fastapi import HTTPException

import app.api.routers.wallet_acp as wallet_acp


def test_acp_transaction_details_public_invalid_txid(client):
    r = client.get("/v1/wallet/acp/transactions/short", headers={"Authorization": ""})
    assert r.status_code == 400
    assert r.json()["detail"] == "txid looks invalid"


def test_acp_transaction_details_public_not_found(client, monkeypatch):
    monkeypatch.setattr(wallet_acp, "_chain_transaction_details", lambda txid: None)

    txid = "15d61ff66007c0190d5de98cf9128516a00a67cc7ac45b2a17c0dd9566f5fdf9"
    r = client.get(f"/v1/wallet/acp/transactions/{txid}", headers={"Authorization": ""})
    assert r.status_code == 404
    assert r.json()["detail"] == "ACP transaction not found"


def test_acp_transaction_details_public_maps_upstream_unavailable_to_503(client, monkeypatch):
    def _boom(txid: str):
        raise HTTPException(status_code=502, detail="upstream blew up")

    monkeypatch.setattr(wallet_acp, "_chain_transaction_details", _boom)

    txid = "15d61ff66007c0190d5de98cf9128516a00a67cc7ac45b2a17c0dd9566f5fdf9"
    r = client.get(f"/v1/wallet/acp/transactions/{txid}", headers={"Authorization": ""})
    assert r.status_code == 503
    assert r.json()["detail"] == "ACP transaction lookup is temporarily unavailable"


def test_acp_transaction_details_public_ok(client, monkeypatch):
    txid = "6c38d15141424819700e043fbd664826d37b0e0de14179a5f18906c2b3b4838e"

    monkeypatch.setattr(
        wallet_acp,
        "_chain_transaction_details",
        lambda incoming: {
            "txid": incoming,
            "block_height": 123,
            "block_hash": "00" * 32,
            "block_time": "2026-05-04T09:00:00Z",
            "confirmations": 7,
            "total_input_units": "100000000",
            "total_input_acp": "1",
            "total_output_units": "99999000",
            "total_output_acp": "0.99999",
            "fee_units": "1000",
            "fee_acp": "0.00001",
            "inputs": [{"address": "acp1fromexample0000000000000", "units": "100000000", "acp": "1", "vout": 0}],
            "outputs": [{"address": "acp1toexample000000000000000", "units": "99999000", "acp": "0.99999", "vout": 0}],
        },
    )

    r = client.get(f"/v1/wallet/acp/transactions/{txid}", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["txid"] == txid
    assert data["confirmations"] == 7
    assert data["fee_acp"] == "0.00001"
    assert data["inputs"][0]["address"].startswith("acp1")
    assert data["outputs"][0]["address"].startswith("acp1")
