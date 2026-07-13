from unittest.mock import AsyncMock, patch


def test_explorer_status_without_rpc(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = RuntimeError("ACP RPC URL is not configured")
        res = client.get("/v1/acp/explorer/status")
    assert res.status_code == 503


def test_explorer_status_ok(client):
    with patch("app.api.routers.acp_explorer.acp_rpc_call", new_callable=AsyncMock) as mock_rpc:
        mock_rpc.side_effect = [21, "blockhash-abc"]
        res = client.get("/v1/acp/explorer/status")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["block_height"] == 21
    assert body["best_block_hash"] == "blockhash-abc"


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
