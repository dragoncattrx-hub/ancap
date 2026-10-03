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
            {"tx": ["tx-a", "tx-b"], "time": 100, "size": 200},
            "hash-1",
            {"tx": ["genesis"], "time": 50, "size": 100},
        ]
        res = client.get("/v1/acp/explorer/blocks?limit=2")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["block_height"] == 2
    assert body["items"][0]["height"] == 2
    assert body["items"][0]["hash"] == "hash-2"
    assert body["items"][0]["tx_count"] == 2
    assert body["next_before_height"] == 0
    assert mock_rpc.await_args_list[1].args == ("getblockhash", {"height": 2})
    assert mock_rpc.await_args_list[2].args == ("getblock", {"blockhash": "hash-2", "verbose": True})


def test_explorer_search_height(client):
    res = client.get("/v1/acp/explorer/search?q=17")
    assert res.status_code == 200
    body = res.json()
    assert body["type"] == "block_height"
    assert body["canonical_path"] == "/explorer/block/17"


def test_explorer_search_address(client):
    addr = "acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz"
    res = client.get(f"/v1/acp/explorer/search?q={addr}")
    assert res.status_code == 200
    body = res.json()
    assert body["type"] == "address"
    assert body["canonical_path"] == f"/explorer/address/{addr}"


def test_explorer_search_hex_as_tx(client):
    txid = "a" * 64
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.return_value = {"txid": txid}
        res = client.get(f"/v1/acp/explorer/search?q={txid}")
    assert res.status_code == 200
    body = res.json()
    assert body["type"] == "tx"
    assert body["canonical_path"] == f"/explorer/tx/{txid}"


def test_explorer_block_by_height(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = [
            "hash-3",
            {
                "height": 3,
                "tx": [{"txid": "aa" * 32}, {"txid": "bb" * 32}],
                "header": {"time": 123, "prev_hash": "hash-2"},
                "size": 400,
            },
            5,
            "hash-4",
        ]
        res = client.get("/v1/acp/explorer/block/3")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["height"] == 3
    assert body["hash"] == "hash-3"
    assert body["tx_count"] == 2
    assert body["next_hash"] == "hash-4"


def test_explorer_mempool_ok(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = [
            {"size": 2, "bytes": 100},
            ["tx1", "tx2"],
            {"feerate": "1"},
        ]
        res = client.get("/v1/acp/explorer/mempool")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["info"]["size"] == 2
    assert body["txids"] == ["tx1", "tx2"]


def test_classify_explorer_query_unit():
    from app.services.acp_explorer_search import classify_explorer_query

    assert classify_explorer_query("42")["type"] == "block_height"
    assert classify_explorer_query("acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz")["type"] == "address"
    assert classify_explorer_query("f" * 64)["type"] == "tx"
    assert classify_explorer_query("???")["type"] == "unknown"
