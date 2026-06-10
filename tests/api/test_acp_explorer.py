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
