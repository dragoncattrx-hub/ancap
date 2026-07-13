from app.services.acp_rpc import ACP_RPC_USER_AGENT, acp_rpc_headers


def test_acp_rpc_headers_include_user_agent():
    headers = acp_rpc_headers()
    assert headers["User-Agent"] == ACP_RPC_USER_AGENT
    assert headers["Content-Type"] == "application/json"
