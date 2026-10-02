#!/usr/bin/env python3
"""Read-only BSC checks for wACP / USDT / V3 pool."""

from __future__ import annotations

import argparse
import json
import os
import sys

WACP = "0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402"
USDT = "0x55d398326f99059fF775485246999027B3197955"

ERC20_ABI = [
    {"name": "decimals", "outputs": [{"type": "uint8"}], "inputs": [], "stateMutability": "view", "type": "function"},
    {"name": "symbol", "outputs": [{"type": "string"}], "inputs": [], "stateMutability": "view", "type": "function"},
]

POOL_ABI = [
    {"name": "token0", "outputs": [{"type": "address"}], "inputs": [], "stateMutability": "view", "type": "function"},
    {"name": "token1", "outputs": [{"type": "address"}], "inputs": [], "stateMutability": "view", "type": "function"},
    {"name": "fee", "outputs": [{"type": "uint24"}], "inputs": [], "stateMutability": "view", "type": "function"},
    {"name": "tickSpacing", "outputs": [{"type": "int24"}], "inputs": [], "stateMutability": "view", "type": "function"},
    {
        "name": "slot0",
        "outputs": [
            {"type": "uint160", "name": "sqrtPriceX96"},
            {"type": "int24", "name": "tick"},
            {"type": "uint16", "name": "observationIndex"},
            {"type": "uint16", "name": "observationCardinality"},
            {"type": "uint16", "name": "observationCardinalityNext"},
            {"type": "uint8", "name": "feeProtocol"},
            {"type": "bool", "name": "unlocked"},
        ],
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
    },
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rpc", default=os.environ.get("BSC_RPC_URL", "https://bsc-dataseed.binance.org"))
    parser.add_argument("--pool", default=os.environ.get("WACP_V3_POOL", ""))
    args = parser.parse_args()

    try:
        from web3 import Web3
    except ImportError:
        print(json.dumps({"ok": False, "error": "web3 not installed"}), file=sys.stderr)
        return 2

    w3 = Web3(Web3.HTTPProvider(args.rpc, request_kwargs={"timeout": 30}))
    if not w3.is_connected():
        print(json.dumps({"ok": False, "error": "RPC not connected"}), file=sys.stderr)
        return 2

    chain_id = w3.eth.chain_id
    wacp = Web3.to_checksum_address(WACP)
    usdt = Web3.to_checksum_address(USDT)
    wacp_c = w3.eth.contract(address=wacp, abi=ERC20_ABI)
    usdt_c = w3.eth.contract(address=usdt, abi=ERC20_ABI)

    out: dict = {
        "ok": True,
        "chain_id": chain_id,
        "wacp": wacp,
        "usdt": usdt,
        "wacp_decimals": int(wacp_c.functions.decimals().call()),
        "usdt_decimals": int(usdt_c.functions.decimals().call()),
        "pool": None,
    }

    if args.pool:
        pool_addr = Web3.to_checksum_address(args.pool)
        pool = w3.eth.contract(address=pool_addr, abi=POOL_ABI)
        slot0 = pool.functions.slot0().call()
        out["pool"] = {
            "address": pool_addr,
            "token0": pool.functions.token0().call(),
            "token1": pool.functions.token1().call(),
            "fee": int(pool.functions.fee().call()),
            "tickSpacing": int(pool.functions.tickSpacing().call()),
            "sqrtPriceX96": str(slot0[0]),
            "tick": int(slot0[1]),
        }

    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
