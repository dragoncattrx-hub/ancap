from unittest.mock import AsyncMock, patch


def test_explorer_status_without_rpc(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = RuntimeError("ACP RPC URL is not configured")
        res = client.get("/v1/acp/explorer/status")
    assert res.status_code == 503


def test_explorer_status_ok(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = [
            21,
            "blockhash-abc",
            {
                "protocol_profile": "lean-v1.4",
                "energy_model": "ultra-light-assembler",
                "signing_security": "hybrid-ed25519-dilithium2",
                "encryption_security": "xwing-draft10-ml-kem-768-x25519-hkdf-sha256-xchacha20poly1305-v1",
                "encryption_status": "experimental-off-chain-envelope",
                "target_block_time_sec": 5,
                "design_tps_hint": 102,
                "pow": False,
            },
        ]
        res = client.get("/v1/acp/explorer/status")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["block_height"] == 21
    assert body["best_block_hash"] == "blockhash-abc"
    assert body["lean"]["protocol_profile"] == "lean-v1.4"
    assert "ml-kem-768" in body["lean"]["encryption_security"]
    assert body["lean"]["encryption_status"] == "experimental-off-chain-envelope"
    assert body["lean"]["pow"] is False


def test_explorer_efficiency_ok(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = [
            21,
            "blockhash-abc",
            {"protocol_profile": "lean-v1.4", "design_tps_hint": 102, "pow": False},
            {"size": 0, "bytes": 0},
        ]
        res = client.get("/v1/acp/explorer/efficiency")
    assert res.status_code == 200, res.text
    body = res.json()
    assert "security" in body["market_alignment_2026"]
    assert "speed" in body["market_alignment_2026"]
    assert "energy" in body["market_alignment_2026"]
    assert body["lean"]["protocol_profile"] == "lean-v1.4"
    assert any("ML-KEM-768" in item for item in body["market_alignment_2026"]["security"])


def test_explorer_blocks_ok(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = [
            2,
            "hash-2",
            {"tx": ["tx-a", "tx-b"]},
            "hash-1",
            {"tx": ["genesis"]},
        ]
        res = client.get("/v1/acp/explorer/blocks?limit=2")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["block_height"] == 2
    assert body["items"] == [
        {"height": 2, "hash": "hash-2", "tx_count": 2},
        {"height": 1, "hash": "hash-1", "tx_count": 1},
    ]
    assert mock_rpc.await_args_list[1].args == ("getblockhash", {"height": 2})
    assert mock_rpc.await_args_list[2].args == ("getblock", {"blockhash": "hash-2", "verbose": True})
