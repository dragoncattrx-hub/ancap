#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
cid=$($COMPOSE ps -q api)
docker cp app/services/bridge_orchestrator.py "${cid}:/app/app/services/bridge_orchestrator.py"
$COMPOSE exec -T api python - <<'PY'
import traceback
from eth_account import Account
from eth_utils import keccak, to_hex
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from app.config import get_settings
from app.db.models import BridgeOperation

GATEWAY_ABI = [{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes32","name":"depositRef","type":"bytes32"}],"name":"mintWrapped","outputs":[],"stateMutability":"nonpayable","type":"function"}]

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == '34a32432-bc7f-4177-9fca-c63d220833b4'))).scalars().one()
    w3 = Web3(Web3.HTTPProvider(settings.bridge_bsc_rpc_url, request_kwargs={"timeout": 30}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    acct = Account.from_key(settings.bridge_bsc_private_key)
    gateway = w3.eth.contract(address=Web3.to_checksum_address(settings.bridge_gateway_contract), abi=GATEWAY_ABI)
    deposit_ref_hex = op.deposit_ref_hex or to_hex(keccak(text=f"{op.id}:{op.acp_tx_hash or ''}:{int(op.acp_out_index or 0)}"))
    print('signer', acct.address, 'balance', w3.eth.get_balance(acct.address))
    print('deposit_ref', deposit_ref_hex, 'amount', int(op.amount_wacp_wei))
    try:
        tx = gateway.functions.mintWrapped(
            Web3.to_checksum_address(op.user_bsc_address),
            int(op.amount_wacp_wei),
            bytes.fromhex(deposit_ref_hex[2:]),
        ).build_transaction({"from": acct.address, "nonce": w3.eth.get_transaction_count(acct.address, "pending"), "chainId": int(w3.eth.chain_id)})
        gas_estimate = w3.eth.estimate_gas(tx)
        print('gas_estimate', gas_estimate)
        tx['gas'] = int(gas_estimate * 12 // 10)
        tx['gasPrice'] = w3.eth.gas_price
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        print('mint_tx', tx_hash.hex())
    except Exception:
        traceback.print_exc()

import asyncio
asyncio.run(main())
PY
