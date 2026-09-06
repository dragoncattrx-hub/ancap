#!/usr/bin/env bash
# Raise BridgeGateway mint caps so large forward bridges (e.g. 500k wACP) can mint.
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
MAX_SINGLE="${1:-600000000000000000000000}"   # 600k wACP wei default
CAP_PER_DAY="${2:-1200000000000000000000000}" # 1.2M wACP/day default
$COMPOSE exec -T api python - <<PY
import os
from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from app.config import get_settings

max_single = int("${MAX_SINGLE}")
cap_per_day = int("${CAP_PER_DAY}")
s = get_settings()
pk = (s.bridge_bsc_private_key or "").strip()
rpc = (s.bridge_bsc_rpc_url or "").strip()
gw_addr = (s.bridge_gateway_contract or "").strip()
if not pk or not rpc or not gw_addr:
    raise SystemExit("missing BSC bridge config")
w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 30}))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
acct = Account.from_key(pk)
abi = [
    {"inputs":[{"name":"maxSingle","type":"uint256"},{"name":"perDay","type":"uint256"}],"name":"setCaps","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"name":"maxSingleMint","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"mintCapPerDay","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"owner","outputs":[{"type":"address"}],"stateMutability":"view","type":"function"},
]
gw = w3.eth.contract(address=Web3.to_checksum_address(gw_addr), abi=abi)
owner = gw.functions.owner().call()
print("owner", owner, "signer", acct.address)
if owner.lower() != acct.address.lower():
    raise SystemExit("bridge signer is not gateway owner")
print("before maxSingleMint", gw.functions.maxSingleMint().call())
print("before mintCapPerDay", gw.functions.mintCapPerDay().call())
tx = gw.functions.setCaps(max_single, cap_per_day).build_transaction({
    "from": acct.address,
    "nonce": w3.eth.get_transaction_count(acct.address, "pending"),
    "chainId": int(w3.eth.chain_id),
    "gas": 120000,
    "gasPrice": w3.eth.gas_price,
})
signed = acct.sign_transaction(tx)
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
print("setCaps tx", tx_hash.hex())
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
print("status", receipt.status)
print("after maxSingleMint", gw.functions.maxSingleMint().call())
print("after mintCapPerDay", gw.functions.mintCapPerDay().call())
PY

$COMPOSE exec -T api sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick -H "content-type: application/json" -d "{}"' || true
