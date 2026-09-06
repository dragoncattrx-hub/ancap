#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
OP_ID="34a32432-bc7f-4177-9fca-c63d220833b4"
$COMPOSE exec -T api python - <<'PY'
import asyncio
import traceback
from eth_account import Account
from eth_utils import keccak, to_hex
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation
from app.services.bridge_bsc_watcher import tick_bsc_checkpoint

GATEWAY_ABI = [{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32","name":"depositRef","type":"bytes32"}],"name":"mintWrapped","outputs":[],"stateMutability":"nonpayable","type":"function"}]

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == '34a32432-bc7f-4177-9fca-c63d220833b4'))).scalars().one()
        if op.bsc_tx_hash_mint:
            print('already minted', op.bsc_tx_hash_mint, op.status)
            return
        w3 = Web3(Web3.HTTPProvider(settings.bridge_bsc_rpc_url, request_kwargs={"timeout": 30}))
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        acct = Account.from_key(settings.bridge_bsc_private_key)
        gateway = w3.eth.contract(address=Web3.to_checksum_address(settings.bridge_gateway_contract), abi=GATEWAY_ABI)
        deposit_ref_hex = op.deposit_ref_hex or to_hex(keccak(text=f"{op.id}:{op.acp_tx_hash or ''}:{int(op.acp_out_index or 0)}"))
        op.deposit_ref_hex = deposit_ref_hex
        tx = gateway.functions.mintWrapped(
            Web3.to_checksum_address(op.user_bsc_address),
            int(op.amount_wacp_wei),
            bytes.fromhex(deposit_ref_hex[2:]),
        ).build_transaction({
            "from": acct.address,
            "nonce": w3.eth.get_transaction_count(acct.address, "pending"),
            "chainId": int(w3.eth.chain_id),
        })
        gas_estimate = w3.eth.estimate_gas(tx)
        tx["gas"] = int(gas_estimate * 12 // 10)
        priority = w3.to_wei(1, "gwei")
        tx.pop("gasPrice", None)
        tx["maxPriorityFeePerGas"] = priority
        tx["maxFeePerGas"] = int(w3.eth.gas_price) + priority
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        op.bsc_tx_hash_mint = tx_hash_hex
        session.add(BridgeAuditEvent(operation_id=op.id, event_type="bsc_mint_submitted", payload_json={"tx_hash": tx_hash_hex, "manual": True}))
        await session.commit()
        print('submitted', tx_hash_hex)
    async with Session() as session:
        result = await tick_bsc_checkpoint(session)
        await session.commit()
        print('bsc_confirm', result)
    async with Session() as session:
        op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == '34a32432-bc7f-4177-9fca-c63d220833b4'))).scalars().one()
        print('final', op.status, op.bsc_tx_hash_mint)

asyncio.run(main())
PY
