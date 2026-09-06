#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
GW="0x57c24FF77B23a82328cb88914D4FD4EEBd93321b"
$COMPOSE exec -T api python - <<'PY'
from web3 import Web3
from app.config import get_settings
s = get_settings()
w3 = Web3(Web3.HTTPProvider(s.bridge_bsc_rpc_url, request_kwargs={"timeout": 30}))
gw = Web3.to_checksum_address(s.bridge_gateway_contract)
abi = [
    {"inputs":[],"name":"maxSingleMint","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"mintCapPerDay","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"mintedToday","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
]
c = w3.eth.contract(address=gw, abi=abi)
print("maxSingleMint", c.functions.maxSingleMint().call())
print("mintCapPerDay", c.functions.mintCapPerDay().call())
print("mintedToday", c.functions.mintedToday().call())
PY
