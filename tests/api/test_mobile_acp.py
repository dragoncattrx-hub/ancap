"""Mobile ACP Wallet public API tests."""

import app.api.routers.mobile_acp as mobile_acp
from app.services import rate_limit as rl_module


def test_smart_pay_capabilities(client, monkeypatch):
    monkeypatch.setenv("MOBILE_SMART_PAY_ENABLED", "true")
    monkeypatch.setenv("MOBILE_SMART_PAY_AI_FALLBACK_ENABLED", "false")
    monkeypatch.setenv("MOBILE_SMART_PAY_AUTO_SWAP_ENABLED", "false")
    mobile_acp.get_settings.cache_clear()
    try:
        r = client.get("/v1/mobile/smart-pay/capabilities")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["enabled"] is True
        assert data["smartQrParseEnabled"] is True
        assert data["smartQrAiFallbackEnabled"] is False
        assert data["autoSwapEnabled"] is False
        assert data["supportedNetworks"] == ["acp", "bsc"]
        assert any(asset["symbol"] == "ACP" for asset in data["supportedAssets"])
        assert data["minAcpFeeReserve"] == "1.0"
    finally:
        mobile_acp.get_settings.cache_clear()


def test_smart_pay_parse_acp_address_with_amount_and_memo(client):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    r = client.post(
        "/v1/mobile/smart-pay/parse",
        json={
            "source": "camera",
            "rawPayload": f"{addr}?amount=1.25&memo=coffee",
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()["paymentIntent"]
    assert data["network"] == "acp"
    assert data["parseMethod"] == "deterministic"
    assert data["recipient"]["address"] == addr
    assert data["amount"]["value"] == "1.25"
    assert data["amount"]["currencySymbol"] == "ACP"
    assert data["memo"]["value"] == "coffee"
    assert data["metadata"]["detectedStandard"] in ("acp_uri", "acp_address")


def test_smart_pay_parse_eip681_token_transfer(client):
    contract = "0x1111111111111111111111111111111111111111"
    recipient = "0x2222222222222222222222222222222222222222"
    payload = f"ethereum:{contract}@56/transfer?address={recipient}&uint256=25000000"
    r = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "photo", "rawPayload": payload},
    )
    assert r.status_code == 200, r.text
    data = r.json()["paymentIntent"]
    assert data["network"] == "bsc"
    assert data["asset"]["kind"] == "erc20"
    assert data["asset"]["tokenAddress"] == contract
    assert data["recipient"]["address"] == recipient
    assert data["amount"]["atomicValue"] == "25000000"
    assert data["metadata"]["detectedStandard"] == "eip681"


def test_smart_pay_parse_raw_evm_address_needs_review(client):
    address = "0x3333333333333333333333333333333333333333"
    r = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "paste", "rawPayload": address},
    )
    assert r.status_code == 200, r.text
    data = r.json()["paymentIntent"]
    assert data["status"] == "needs_review"
    assert data["network"] == "unknown"
    assert "unknown_network" in data["riskFlags"]
    assert data["recipient"]["address"] == address


def test_smart_pay_parse_unsupported_payload(client):
    r = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "camera", "rawPayload": "pay me maybe"},
    )
    assert r.status_code == 400
    assert "Unsupported or malformed QR payload" in r.text


def test_smart_pay_quote_acp_direct_send(client):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    parsed = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "camera", "rawPayload": f"{addr}?amount=2.5"},
    )
    payment_intent_id = parsed.json()["paymentIntent"]["id"]
    r = client.post(
        "/v1/mobile/smart-pay/quote",
        json={
            "paymentIntentId": payment_intent_id,
            "sourcePreference": {
                "preferredAsset": "ACP",
                "allowedAssets": ["ACP"],
                "maxSlippageBps": 150,
                "minAcpFeeReserve": "1.0",
            },
        },
    )
    assert r.status_code == 200, r.text
    quote = r.json()["quote"]
    assert quote["mode"] == "direct_send"
    assert quote["sourceAsset"]["symbol"] == "ACP"
    assert quote["targetAsset"]["symbol"] == "ACP"
    assert quote["paymentIntentId"] == payment_intent_id


def test_smart_pay_quote_bsc_usdt_from_acp(client):
    contract = "0x1111111111111111111111111111111111111111"
    recipient = "0x2222222222222222222222222222222222222222"
    payload = f"ethereum:{contract}@56/transfer?address={recipient}&uint256=25000000"
    parsed = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "photo", "rawPayload": payload},
    )
    payment_intent_id = parsed.json()["paymentIntent"]["id"]
    r = client.post(
        "/v1/mobile/smart-pay/quote",
        json={
            "paymentIntentId": payment_intent_id,
            "sourcePreference": {
                "preferredAsset": "ACP",
                "allowedAssets": ["ACP", "wACP", "USDT"],
                "maxSlippageBps": 150,
                "minAcpFeeReserve": "1.0",
            },
        },
    )
    assert r.status_code == 200, r.text
    quote = r.json()["quote"]
    assert quote["mode"] == "swap_then_send"
    assert quote["sourceAsset"]["symbol"] == "ACP"
    assert quote["targetAsset"]["symbol"] == "USDT"
    assert len(quote["route"]) == 3
    assert quote["route"][0]["kind"] == "bridge"


def test_smart_pay_execute_and_recover(client):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    parsed = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "camera", "rawPayload": f"{addr}?amount=1"},
    )
    payment_intent_id = parsed.json()["paymentIntent"]["id"]
    quote_res = client.post(
        "/v1/mobile/smart-pay/quote",
        json={
            "paymentIntentId": payment_intent_id,
            "sourcePreference": {
                "preferredAsset": "ACP",
                "allowedAssets": ["ACP"],
                "maxSlippageBps": 100,
                "minAcpFeeReserve": "1.0",
            },
        },
    )
    quote_id = quote_res.json()["quote"]["quoteId"]
    exec_res = client.post(
        "/v1/mobile/smart-pay/execute",
        json={
            "paymentIntentId": payment_intent_id,
            "quoteId": quote_id,
            "confirmationAccepted": True,
            "deviceContext": {"platform": "android", "appVersion": "1.1.0"},
        },
    )
    assert exec_res.status_code == 200, exec_res.text
    execution = exec_res.json()["execution"]
    assert execution["status"] == "awaiting_local_signature"
    execution_id = execution["id"]

    status_res = client.get(f"/v1/mobile/smart-pay/payments/{execution_id}")
    assert status_res.status_code == 200
    assert status_res.json()["execution"]["id"] == execution_id

    recover_res = client.post(
        f"/v1/mobile/smart-pay/payments/{execution_id}/recover",
        json={"clientKnownTxs": ["0xabc123"]},
    )
    assert recover_res.status_code == 200, recover_res.text
    recovered = recover_res.json()["execution"]
    assert recovered["status"] == "pending_reconciliation"
    assert recovered["txRefs"][0]["txid"] == "0xabc123"


def test_smart_pay_quote_rejects_low_acp_fee_reserve(client):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    parsed = client.post(
        "/v1/mobile/smart-pay/parse",
        json={"source": "camera", "rawPayload": f"{addr}?amount=1"},
    )
    payment_intent_id = parsed.json()["paymentIntent"]["id"]
    r = client.post(
        "/v1/mobile/smart-pay/quote",
        json={
            "paymentIntentId": payment_intent_id,
            "sourcePreference": {
                "preferredAsset": "ACP",
                "allowedAssets": ["ACP"],
                "maxSlippageBps": 100,
                "minAcpFeeReserve": "0.1",
            },
        },
    )
    assert r.status_code == 409


def test_mobile_config_ok(client):
    r = client.get("/v1/mobile/config")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["minAppVersion"] == "1.0.0"
    assert data["acpDecimals"] == 8
    assert data["wacpDecimals"] == 18
    assert "docs" in data
    assert data["docs"]["bridge"] == "https://ancap.cloud/docs/wacp/bridge"
    assert data["docs"]["risks"] == "https://ancap.cloud/docs/wacp/risks"
    assert data["docs"]["reserve"] == "https://ancap.cloud/docs/wacp/reserve"
    assert data["docs"]["contracts"] == "https://ancap.cloud/docs/wacp/contracts"
    assert data["docs"]["walletSecurity"] == "https://ancap.cloud/docs/mobile/security"


def test_mobile_health(client):
    r = client.get("/v1/mobile/health")
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_acp_network_status(client, monkeypatch):
    monkeypatch.setattr(mobile_acp.wallet_acp, "_rpc_call", lambda *a, **k: 42)
    r = client.get("/v1/acp/network/status")
    assert r.status_code == 200
    data = r.json()
    assert data["rpcStatus"] == "ok"
    assert data["blockHeight"] == 42
    assert data["minFeeAcp"]


def test_acp_address_balance(client, monkeypatch):
    monkeypatch.setattr(
        mobile_acp.wallet_acp,
        "_load_balance_result",
        lambda addr: {"address": addr, "units": "100000000", "acp": "1", "utxo_count": 1},
    )
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    r = client.get(f"/v1/acp/address/{addr}/balance")
    assert r.status_code == 200
    data = r.json()
    assert data["address"] == addr
    assert data["acp"] == "1"
    assert data["utxo_count"] == 1


def test_acp_address_balance_invalid(client):
    r = client.get("/v1/acp/address/not-an-address/balance")
    assert r.status_code == 400


def test_acp_estimate_fee(client):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    r = client.post(
        "/v1/acp/tx/estimate-fee",
        json={"from": addr, "to": addr, "amountAcp": "1"},
    )
    assert r.status_code == 200
    assert r.json()["feeAcp"]


def test_acp_broadcast_invalid_hex(client, monkeypatch):
    monkeypatch.setattr(mobile_acp.wallet_acp, "_require_acp_rpc_url", lambda: "http://rpc.test")
    r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "gg" * 20})
    assert r.status_code == 400


def test_acp_broadcast_ok(client, monkeypatch):
    monkeypatch.setattr(mobile_acp.wallet_acp, "_require_acp_rpc_url", lambda: "http://rpc.test")
    monkeypatch.setattr(
        mobile_acp.wallet_acp,
        "_rpc_call",
        lambda *a, **k: {"accepted": True, "txid": "abc123"},
    )
    r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "deadbeef" * 8})
    assert r.status_code == 200
    data = r.json()
    assert data["accepted"] is True
    assert data["txid"] == "abc123"


def test_acp_broadcast_rate_limited(client, monkeypatch):
    """Exhaust the per-IP broadcast limit; subsequent requests return 429.

    rate_limit.py is configured to use its in-memory fallback when REDIS_URL
    is empty (the default). The per-IP key is built from the test client's IP.
    """
    monkeypatch.setattr(mobile_acp.wallet_acp, "_require_acp_rpc_url", lambda: "http://rpc.test")
    monkeypatch.setattr(
        mobile_acp.wallet_acp,
        "_rpc_call",
        lambda *a, **k: {"accepted": True, "txid": "abc123"},
    )

    # Ensure clean in-memory state before the test
    rl_module.clear_rate_limit_state()

    # Limit = mobile_broadcast_rate_limit_per_minute = 10 per minute
    limit = 10
    for i in range(limit):
        r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "deadbeef" * 8})
        assert r.status_code == 200, f"request {i+1} should succeed, got {r.status_code}: {r.text}"

    # Next one must be rate-limited
    r = client.post("/v1/acp/tx/broadcast", json={"rawTx": "deadbeef" * 8})
    assert r.status_code == 429, r.text
    assert r.json()["detail"]["code"] == "RATE_LIMITED"
    assert "retry_after_seconds" in r.json()["detail"]
