"""Bridge rail HTTP surface (public read paths).

Use the session-scoped ``client`` with ``Authorization: ""`` — not ``client_unauth``.
A second ``TestClient`` uses a different asyncio loop and breaks asyncpg with the
shared engine (see tests/conftest.py).
"""

import anyio
import os
import uuid

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


def _test_async_db_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def test_bridge_status_public_ok(client):
    r = client.get("/v1/bridge/status", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("bridge_rail_enabled") is False
    assert "counts_by_status" in data
    assert "checkpoint_acp" in data
    assert "checkpoint_bsc" in data


def test_bridge_reserve_summary_disabled_503(client):
    r = client.get("/v1/bridge/reserve-summary", headers={"Authorization": ""})
    assert r.status_code == 503


def test_wacp_reserve_proof_public_ok(client):
    r = client.get("/v1/bridge/wacp/reserve-proof", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "status" in data
    assert "reserve_health" in data
    assert "wacp_total_supply_wei" in data
    assert "notes" in data


def test_wacp_status_public_ok(client):
    r = client.get("/v1/bridge/wacp/status", headers={"Authorization": ""})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "status" in data
    assert "docs" in data
    assert data["docs"]["overview"].endswith("/docs/wacp")
    assert "pair_live" in data
    assert "token_metadata_live" in data
    assert "reserve_proof_status" in data
    assert "reserve_health" in data


def test_wacp_exact_public_paths_ok(client):
    r1 = client.get("/v1/wacp/reserve-proof", headers={"Authorization": ""})
    assert r1.status_code == 200, r1.text
    r2 = client.get("/v1/wacp/status", headers={"Authorization": ""})
    assert r2.status_code == 200, r2.text


def test_quote_bsc_to_acp_floor_and_remainder(client):
    r = client.post("/v1/bridge/quote/bsc-to-acp", json={"amount_wacp": "1.0000000001"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["amount_wacp_wei"] == "1000000000100000000"
    assert data["acp_smallest_floor"] == "100000000"
    assert data["acp_amount_floor"] == "1"
    assert data["remainder_wacp_wei"] == "100000000"


def test_wacp_reserve_proof_live_balance_path(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_RESERVE_ACP_ADDRESS", "acp1qreserve0000000000000000000000000000000")
    monkeypatch.setenv("BRIDGE_WACP_CONTRACT", "0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402")
    from app.config import get_settings
    get_settings.cache_clear()

    import app.api.routers.bridge_rail as bridge_rail

    async def fake_scalar(*args, **kwargs):
        return 1000000000000000000

    class _FakeSession:
        async def scalar(self, *args, **kwargs):
            return 1000000000000000000

        async def get(self, *args, **kwargs):
            return None

        async def rollback(self):
            return None

    def fake_require_rpc_url():
        return "http://fake-rpc"

    def fake_run_walletd(args, timeout_s=180):
        return {"address": "acp1qreserve0000000000000000000000000000000", "units": "200000000", "acp": "2", "utxo_count": 1}

    from app.api.routers import wallet_acp
    original_require = wallet_acp._require_acp_rpc_url
    original_run = wallet_acp._run_walletd
    wallet_acp._require_acp_rpc_url = fake_require_rpc_url
    wallet_acp._run_walletd = fake_run_walletd
    try:
        import anyio
        data = anyio.run(bridge_rail._live_reserve_proof_payload, _FakeSession())
    finally:
        wallet_acp._require_acp_rpc_url = original_require
        wallet_acp._run_walletd = original_run

    assert data.acp_reserve_balance_smallest == "200000000"
    assert data.wacp_total_supply_acp_smallest == "100000000"
    assert data.backing_ratio == "2"
    assert data.status == "healthy"
    assert data.reserve_health == "healthy"


def test_create_redeem_intent_bsc_to_acp(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x1111111111111111111111111111111111111111",
        "user_acp_address": "acp1qtestredeemaddress0000000000000000000000000",
        "amount_wacp": "1.0000000001",
    }
    r = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["direction"] == "bsc_to_acp"
    assert data["status"] == "PENDING_BURN"
    assert data["amount_wacp_wei"] == "1000000000100000000"
    assert data["amount_acp_smallest"] == "100000000"
    assert data["remainder_wacp_wei"] == "100000000"
    assert data["bsc_tx_hash_burn"] is None


def test_list_my_intents_includes_redeem_direction(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x2222222222222222222222222222222222222222",
        "user_acp_address": "acp1qredeemlist000000000000000000000000000000",
        "amount_wacp": "0.5",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text

    r = client.get("/v1/bridge/intents/me")
    assert r.status_code == 200, r.text
    data = r.json()
    assert any(op["direction"] == "bsc_to_acp" for op in data)


def test_bsc_release_log_matches_pending_redeem_and_confirms_burn(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_BSC_RPC_URL", "https://bsc.example.invalid")
    monkeypatch.setenv("BRIDGE_GATEWAY_CONTRACT", "0x57c24FF77B23a82328cb88914D4FD4EEBd93321b")
    monkeypatch.setenv("BRIDGE_BSC_CONFIRMATIONS", "2")
    from app.config import get_settings
    get_settings.cache_clear()

    suffix = uuid.uuid4().hex[:4]
    payload = {
        "user_bsc_address": "0x" + ("3" * 36) + suffix,
        "user_acp_address": f"acp1qreleasewatch{suffix}0000000000000000000000000000",
        "amount_wacp": "1.5",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    created = create.json()

    from eth_abi import encode
    from eth_utils import keccak
    from app.db.models import BridgeWatcherCheckpoint
    import app.services.bridge_bsc_watcher as watcher

    request_id = 7
    amount = 1500000000000000000
    live_height = 999999
    log_block = 999998
    burn_tx_hash = "0x" + uuid.uuid4().hex
    data_hex = "0x" + encode(["string", "uint256"], [payload["user_acp_address"], amount]).hex()
    topic0 = "0x" + keccak(text="ReleaseRequested(uint256,address,string,uint256)").hex()
    from_topic = "0x" + ("0" * 24) + payload["user_bsc_address"][2:].lower()
    log = {
        "transactionHash": burn_tx_hash,
        "blockNumber": hex(log_block),
        "logIndex": hex(2),
        "topics": [topic0, hex(request_id), from_topic],
        "data": data_hex,
    }

    async def fake_rpc(rpc_url, method, params):
        if method == "eth_blockNumber":
            return hex(live_height)
        if method == "eth_getLogs":
            return [log]
        raise AssertionError(f"unexpected rpc method: {method}")

    async def reset_and_run_tick():
        engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with Session() as session:
                cp = await session.get(BridgeWatcherCheckpoint, "bsc")
                if cp is None:
                    cp = BridgeWatcherCheckpoint(chain_key="bsc", last_block_height=0)
                    session.add(cp)
                else:
                    cp.last_block_height = 0
                await session.commit()
            async with Session() as session:
                result = await watcher.tick_bsc_checkpoint(session)
                await session.commit()
                return result
        finally:
            await engine.dispose()

    original_rpc = watcher._rpc
    watcher._rpc = fake_rpc
    try:
        result = anyio.run(reset_and_run_tick)
    finally:
        watcher._rpc = original_rpc

    assert result["matched_releases"] == 1

    mine = client.get("/v1/bridge/intents/me")
    assert mine.status_code == 200, mine.text
    op = next(x for x in mine.json() if x["id"] == created["id"])
    assert op["status"] == "BURN_CONFIRMED"
    assert op["bsc_tx_hash_burn"] == burn_tx_hash
    assert op["bsc_log_index"] == 2


def test_orchestrator_submits_acp_payout_for_confirmed_burn(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_DRY_RUN", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    suffix = uuid.uuid4().hex[:4]
    payload = {
        "user_bsc_address": "0x" + ("4" * 36) + suffix,
        "user_acp_address": f"acp1qpayoutwatch{suffix}00000000000000000000000000000",
        "amount_wacp": "1.0000000001",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    op_id = create.json()["id"]

    from sqlalchemy import select
    from app.db.models import BridgeOperation
    import app.services.bridge_orchestrator as orch

    burn_tx_hash = "0x" + uuid.uuid4().hex

    async def setup_burn_confirmed():
        engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with Session() as session:
                op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == op_id))).scalars().one()
                op.status = "BURN_CONFIRMED"
                op.bsc_tx_hash_burn = burn_tx_hash
                op.bsc_log_index = 5
                await session.commit()
        finally:
            await engine.dispose()

    anyio.run(setup_burn_confirmed)

    payout_txid = f"acp-payout-{uuid.uuid4().hex}"
    original_transfer = orch._hot_wallet_transfer

    def fake_hot_wallet_transfer(acp_address, acp_smallest):
        if acp_address == payload["user_acp_address"]:
            return {"txid": payout_txid}
        return {"txid": f"acp-payout-{uuid.uuid4().hex}"}

    orch._hot_wallet_transfer = fake_hot_wallet_transfer
    try:
        async def run_tick():
            engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
            Session = async_sessionmaker(engine, expire_on_commit=False)
            try:
                async with Session() as session:
                    result = await orch.tick_orchestrator(session)
                    await session.commit()
                    return result
            finally:
                await engine.dispose()
        result = anyio.run(run_tick)
    finally:
        orch._hot_wallet_transfer = original_transfer

    assert result["progressed_bsc_to_acp"] >= 1

    mine = client.get("/v1/bridge/intents/me")
    assert mine.status_code == 200, mine.text
    op = next(x for x in mine.json() if x["id"] == op_id)
    assert op["status"] == "ACP_PAYOUT_SENT"
    assert op["acp_tx_hash"] == payout_txid


def test_orchestrator_resolves_missing_walletd_txid_via_chain_scan(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_DRY_RUN", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    suffix = uuid.uuid4().hex[:4]
    payload = {
        "user_bsc_address": "0x" + ("5" * 36) + suffix,
        "user_acp_address": f"acp1qfallback{suffix}0000000000000000000000000000000",
        "amount_wacp": "0.005",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    op_id = create.json()["id"]

    from sqlalchemy import select
    from app.db.models import BridgeOperation
    import app.services.bridge_orchestrator as orch

    burn_tx_hash = "0x" + uuid.uuid4().hex
    fallback_txid = uuid.uuid4().hex + uuid.uuid4().hex

    async def setup_burn_confirmed():
        engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with Session() as session:
                op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == op_id))).scalars().one()
                op.status = "BURN_CONFIRMED"
                op.bsc_tx_hash_burn = burn_tx_hash
                op.bsc_log_index = 7
                await session.commit()
        finally:
            await engine.dispose()

    anyio.run(setup_burn_confirmed)

    original_transfer = orch._hot_wallet_transfer

    def fake_hot_wallet_transfer(acp_address, acp_smallest):
        return {"accepted": True, "txid": fallback_txid, "txid_source": "chain_scan_fallback"}

    orch._hot_wallet_transfer = fake_hot_wallet_transfer
    try:
        async def run_tick():
            engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
            Session = async_sessionmaker(engine, expire_on_commit=False)
            try:
                async with Session() as session:
                    result = await orch.tick_orchestrator(session)
                    await session.commit()
                    return result
            finally:
                await engine.dispose()
        result = anyio.run(run_tick)
    finally:
        orch._hot_wallet_transfer = original_transfer

    assert result["progressed_bsc_to_acp"] >= 1

    mine = client.get("/v1/bridge/intents/me")
    assert mine.status_code == 200, mine.text
    op = next(x for x in mine.json() if x["id"] == op_id)
    assert op["status"] == "ACP_PAYOUT_SENT"
    assert op["acp_tx_hash"] == fallback_txid


def test_orchestrator_rejects_hot_wallet_reserve_mismatch(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_DRY_RUN", "false")
    monkeypatch.setenv("BRIDGE_RESERVE_ACP_ADDRESS", "acp1qreserveexpected000000000000000000000000")
    from app.config import get_settings
    get_settings.cache_clear()

    import app.services.bridge_orchestrator as orch

    original_run_walletd = orch._hot_wallet_transfer.__globals__.get("_run_walletd") if False else None
    from app.api.routers import wallet_acp as wallet_acp_router

    original_loader = wallet_acp_router._load_or_create_valid_hot_mnemonic
    original_require_rpc = wallet_acp_router._require_acp_rpc_url
    original_run = wallet_acp_router._run_walletd

    wallet_acp_router._load_or_create_valid_hot_mnemonic = lambda: "test mnemonic"
    wallet_acp_router._require_acp_rpc_url = lambda: "http://acp.invalid/rpc"

    def fake_run_walletd(args, timeout_s=180):
        if args[:2] == ["address", "--mnemonic"]:
            return {"address": "acp1qderiveddifferent0000000000000000000000000"}
        raise AssertionError(args)

    wallet_acp_router._run_walletd = fake_run_walletd
    try:
        try:
            orch._hot_wallet_transfer("acp1qdest000000000000000000000000000000000", 500000)
            assert False, "expected RuntimeError"
        except RuntimeError as exc:
            assert "ACP hot wallet address mismatch" in str(exc)
    finally:
        wallet_acp_router._load_or_create_valid_hot_mnemonic = original_loader
        wallet_acp_router._require_acp_rpc_url = original_require_rpc
        wallet_acp_router._run_walletd = original_run


def test_admin_reverse_bind_burn_promotes_pending_burn(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x6666666666666666666666666666666666666666",
        "user_acp_address": "acp1qadminburn0000000000000000000000000000000",
        "amount_wacp": "1",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    op_id = create.json()["id"]

    burn_tx_hash = "0x" + uuid.uuid4().hex + uuid.uuid4().hex
    r = client.post(
        "/v1/bridge/admin/reverse/bind-burn",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={
            "operation_id": op_id,
            "bsc_tx_hash_burn": burn_tx_hash,
            "bsc_log_index": 4,
            "correlation_id": "req-4",
            "note": "manual bind for recovery",
        },
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["status"] == "BURN_CONFIRMED"
    assert data["bsc_tx_hash_burn"] == burn_tx_hash
    assert data["bsc_log_index"] == 4


def test_admin_reverse_bind_payout_and_requeue(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x7777777777777777777777777777777777777777",
        "user_acp_address": "acp1qadminpayout00000000000000000000000000000",
        "amount_wacp": "1.25",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    op_id = create.json()["id"]

    burn_tx_hash = "0x" + uuid.uuid4().hex + uuid.uuid4().hex
    bind_burn = client.post(
        "/v1/bridge/admin/reverse/bind-burn",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={
            "operation_id": op_id,
            "bsc_tx_hash_burn": burn_tx_hash,
            "bsc_log_index": 5,
        },
    )
    assert bind_burn.status_code == 200, bind_burn.text

    bind_payout = client.post(
        "/v1/bridge/admin/reverse/bind-payout",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={
            "operation_id": op_id,
            "acp_tx_hash": "acp-manual-payout-1",
            "note": "manual payout bind",
        },
    )
    assert bind_payout.status_code == 200, bind_payout.text
    payout_data = bind_payout.json()
    assert payout_data["status"] == "ACP_PAYOUT_SENT"
    assert payout_data["acp_tx_hash"] == "acp-manual-payout-1"

    requeue = client.post(
        "/v1/bridge/admin/reverse/requeue-payout",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={"operation_id": op_id, "note": "tx missing on chain"},
    )
    assert requeue.status_code == 200, requeue.text
    requeue_data = requeue.json()
    assert requeue_data["status"] == "BURN_CONFIRMED"
    assert requeue_data["acp_tx_hash"] is None


def test_admin_reverse_mark_disputed_and_list(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    payload = {
        "user_bsc_address": "0x8888888888888888888888888888888888888888",
        "user_acp_address": "acp1qadmindispute0000000000000000000000000000",
        "amount_wacp": "0.75",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    op_id = create.json()["id"]

    dispute = client.post(
        "/v1/bridge/admin/reverse/mark-disputed",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={"operation_id": op_id, "note": "mismatch under investigation"},
    )
    assert dispute.status_code == 200, dispute.text
    dispute_data = dispute.json()
    assert dispute_data["status"] == "DISPUTED"

    listed = client.get(
        "/v1/bridge/admin/reverse/operations?status=DISPUTED",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
    )
    assert listed.status_code == 200, listed.text
    rows = listed.json()
    assert any(row["id"] == op_id and row["status"] == "DISPUTED" for row in rows)


def test_bridge_tick_surfaces_orchestrator_error_without_500(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    from app.config import get_settings
    get_settings.cache_clear()

    import app.jobs.bridge_rail_tick as bridge_tick

    original_tick = bridge_tick.tick_orchestrator

    async def fake_tick_orchestrator(session):
        raise RuntimeError("forced reverse payout failure")

    bridge_tick.tick_orchestrator = fake_tick_orchestrator
    try:
        r = client.post("/v1/system/jobs/tick", headers={"Authorization": ""})
    finally:
        bridge_tick.tick_orchestrator = original_tick

    assert r.status_code == 200, r.text
    data = r.json()
    assert data["bridge_rail"]["orchestrator"]["ok"] is False
    assert data["bridge_rail"]["orchestrator"]["step"] == "orchestrator"
    assert "forced reverse payout failure" in data["bridge_rail"]["orchestrator"]["error"]


def test_admin_reverse_liability_summary(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("BRIDGE_OPERATOR_SECRET", "test-secret")
    from app.config import get_settings
    get_settings.cache_clear()

    burn_payload = {
        "user_bsc_address": "0x9999999999999999999999999999999999999999",
        "user_acp_address": "acp1qliabilityburn000000000000000000000000000",
        "amount_wacp": "0.5",
    }
    sent_payload = {
        "user_bsc_address": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "user_acp_address": "acp1qliabilitysent000000000000000000000000000",
        "amount_wacp": "0.75",
    }
    disputed_payload = {
        "user_bsc_address": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "user_acp_address": "acp1qliabilitydisp000000000000000000000000000",
        "amount_wacp": "1",
    }

    burn = client.post("/v1/bridge/intents/bsc-to-acp", json=burn_payload)
    assert burn.status_code == 200, burn.text
    burn_id = burn.json()["id"]

    sent = client.post("/v1/bridge/intents/bsc-to-acp", json=sent_payload)
    assert sent.status_code == 200, sent.text
    sent_id = sent.json()["id"]

    disputed = client.post("/v1/bridge/intents/bsc-to-acp", json=disputed_payload)
    assert disputed.status_code == 200, disputed.text
    disputed_id = disputed.json()["id"]

    burn_tx_1 = "0x" + uuid.uuid4().hex + uuid.uuid4().hex
    burn_tx_2 = "0x" + uuid.uuid4().hex + uuid.uuid4().hex

    r1 = client.post(
        "/v1/bridge/admin/reverse/bind-burn",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={"operation_id": burn_id, "bsc_tx_hash_burn": burn_tx_1, "bsc_log_index": 1},
    )
    assert r1.status_code == 200, r1.text

    r2 = client.post(
        "/v1/bridge/admin/reverse/bind-burn",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={"operation_id": sent_id, "bsc_tx_hash_burn": burn_tx_2, "bsc_log_index": 2},
    )
    assert r2.status_code == 200, r2.text

    payout_tx_hash = f"acp-liability-payout-{uuid.uuid4().hex}"
    r3 = client.post(
        "/v1/bridge/admin/reverse/bind-payout",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={"operation_id": sent_id, "acp_tx_hash": payout_tx_hash},
    )
    assert r3.status_code == 200, r3.text

    r4 = client.post(
        "/v1/bridge/admin/reverse/mark-disputed",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
        json={"operation_id": disputed_id, "note": "manual dispute"},
    )
    assert r4.status_code == 200, r4.text

    summary = client.get(
        "/v1/bridge/admin/reverse/liability",
        headers={"X-Bridge-Operator-Secret": "test-secret"},
    )
    assert summary.status_code == 200, summary.text
    data = summary.json()
    assert data["reverse_public_mode"] == "pending-rollout"
    assert int(data["counts_by_status"].get("BURN_CONFIRMED", 0)) >= 1
    assert int(data["counts_by_status"].get("ACP_PAYOUT_SENT", 0)) >= 1
    assert int(data["counts_by_status"].get("DISPUTED", 0)) >= 1
    assert int(data["total_confirmed_burn_acp_smallest"]) >= 50000000
    assert int(data["total_payout_sent_acp_smallest"]) >= 75000000
    assert int(data["total_disputed_acp_smallest"]) >= 100000000
    assert int(data["outstanding_operator_liability_acp_smallest"]) >= 225000000


def test_acp_watcher_confirms_reverse_payout_and_completes(client, monkeypatch):
    monkeypatch.setenv("BRIDGE_RAIL_ENABLED", "true")
    monkeypatch.setenv("BRIDGE_RAIL_PAUSED", "false")
    monkeypatch.setenv("ACP_RPC_URL", "https://acp.example.invalid")
    monkeypatch.setenv("BRIDGE_RESERVE_ACP_ADDRESS", "acp1qreserve0000000000000000000000000000000")
    monkeypatch.setenv("BRIDGE_ACP_CONFIRMATIONS", "3")
    from app.config import get_settings
    get_settings.cache_clear()

    suffix = uuid.uuid4().hex[:4]
    payload = {
        "user_bsc_address": "0x" + ("5" * 36) + suffix,
        "user_acp_address": f"acp1qwatchdone{suffix}00000000000000000000000000000",
        "amount_wacp": "1.25",
    }
    create = client.post("/v1/bridge/intents/bsc-to-acp", json=payload)
    assert create.status_code == 200, create.text
    created = create.json()
    op_id = created["id"]
    payout_txid = f"acp-confirm-{uuid.uuid4().hex}"

    from sqlalchemy import select
    from app.db.models import BridgeOperation, BridgeWatcherCheckpoint
    import app.services.bridge_acp_watcher as acp_watcher

    async def setup_sent_payout():
        engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with Session() as session:
                cp = await session.get(BridgeWatcherCheckpoint, "acp")
                if cp is None:
                    cp = BridgeWatcherCheckpoint(chain_key="acp", last_block_height=0)
                    session.add(cp)
                else:
                    cp.last_block_height = 0
                op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == op_id))).scalars().one()
                op.status = "ACP_PAYOUT_SENT"
                op.bsc_tx_hash_burn = "0x" + uuid.uuid4().hex
                op.bsc_log_index = 9
                op.acp_tx_hash = payout_txid
                op.acp_out_index = 0
                await session.commit()
        finally:
            await engine.dispose()

    anyio.run(setup_sent_payout)

    async def fake_json_rpc(rpc_url, method, params=None):
        if method == "getblockcount":
            return {"result": 10}
        if method == "getblockhash":
            height = int((params or {}).get("height") or 0)
            return {"result": f"blockhash-{height}"}
        if method == "getblock":
            blockhash = str((params or {}).get("blockhash") or "")
            try:
                height = int(blockhash.split("-")[-1])
            except Exception:
                height = 0
            txs = []
            if height == 7:
                txs = [
                    {
                        "txid": "fundingtx",
                        "vin": [],
                        "vout": [
                            {"recipient_address": "acp1qreserve0000000000000000000000000000000", "amount": 1000000000},
                        ],
                    }
                ]
            elif height == 8:
                txs = [
                    {
                        "txid": payout_txid,
                        "vin": [{"prev_txid": "fundingtx", "vout": 0}],
                        "vout": [
                            {"recipient_address": payload["user_acp_address"], "amount": 125000000},
                            {"recipient_address": "acp1qreserve0000000000000000000000000000000", "amount": 875000000},
                        ],
                    }
                ]
            return {"result": {"tx": txs}}
        raise AssertionError(f"unexpected rpc method: {method}")

    original_json_rpc = acp_watcher._json_rpc
    acp_watcher._json_rpc = fake_json_rpc
    try:
        async def run_tick():
            engine = create_async_engine(_test_async_db_url(), pool_pre_ping=True)
            Session = async_sessionmaker(engine, expire_on_commit=False)
            try:
                async with Session() as session:
                    result = await acp_watcher.tick_acp_checkpoint(session)
                    await session.commit()
                    return result
            finally:
                await engine.dispose()
        result = anyio.run(run_tick)
    finally:
        acp_watcher._json_rpc = original_json_rpc

    assert result["confirmed_payouts"] == 1

    mine = client.get("/v1/bridge/intents/me")
    assert mine.status_code == 200, mine.text
    op = next(x for x in mine.json() if x["id"] == op_id)
    assert op["status"] == "COMPLETED"
    assert op["acp_tx_hash"] == payout_txid
