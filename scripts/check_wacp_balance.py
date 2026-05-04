import argparse
import json
import os
from decimal import Decimal
from pathlib import Path

from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

ABI = [
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function",
    },
]


def load_env_file(path: str | None) -> dict[str, str]:
    data: dict[str, str] = {}
    if not path:
        return data
    p = Path(path)
    if not p.exists():
        raise SystemExit(f"env file not found: {p}")
    for raw in p.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        data[k.strip()] = v.strip().strip('"').strip("'")
    return data


def pick(name: str, cli_value: str | None, file_env: dict[str, str]) -> str | None:
    return cli_value or os.getenv(name) or file_env.get(name)


def humanize(raw: int, decimals: int) -> str:
    scale = Decimal(10) ** decimals
    return format(Decimal(raw) / scale, "f")


parser = argparse.ArgumentParser(description="Check wACP balance and total supply on BSC")
parser.add_argument("--env-file", help="Optional env file, e.g. Sicret/bridge-bsc/bridge.env")
parser.add_argument("--rpc", help="BSC RPC URL (fallback: BRIDGE_BSC_RPC_URL)")
parser.add_argument("--token", help="wACP token address (fallback: BRIDGE_WACP_CONTRACT)")
parser.add_argument("--address", help="Wallet address to inspect")
parser.add_argument("--json", action="store_true", help="Print JSON only")
args = parser.parse_args()

file_env = load_env_file(args.env_file)
rpc_url = pick("BRIDGE_BSC_RPC_URL", args.rpc, file_env)
token = pick("BRIDGE_WACP_CONTRACT", args.token, file_env)
address = args.address

if not rpc_url:
    raise SystemExit("missing BSC RPC URL; pass --rpc or set BRIDGE_BSC_RPC_URL")
if not token:
    raise SystemExit("missing wACP token address; pass --token or set BRIDGE_WACP_CONTRACT")
if not address:
    raise SystemExit("missing wallet address; pass --address")

w3 = Web3(Web3.HTTPProvider(rpc_url))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
contract = w3.eth.contract(address=Web3.to_checksum_address(token), abi=ABI)
wallet = Web3.to_checksum_address(address)

symbol = contract.functions.symbol().call()
decimals = int(contract.functions.decimals().call())
balance_raw = int(contract.functions.balanceOf(wallet).call())
total_supply_raw = int(contract.functions.totalSupply().call())
result = {
    "rpc": rpc_url,
    "token": Web3.to_checksum_address(token),
    "wallet": wallet,
    "symbol": symbol,
    "decimals": decimals,
    "balance_raw": str(balance_raw),
    "balance": humanize(balance_raw, decimals),
    "total_supply_raw": str(total_supply_raw),
    "total_supply": humanize(total_supply_raw, decimals),
}

if args.json:
    print(json.dumps(result, ensure_ascii=False))
else:
    print(f"wallet: {result['wallet']}")
    print(f"token: {result['token']} ({result['symbol']}, decimals={result['decimals']})")
    print(f"balance_raw: {result['balance_raw']}")
    print(f"balance: {result['balance']}")
    print(f"total_supply_raw: {result['total_supply_raw']}")
    print(f"total_supply: {result['total_supply']}")
