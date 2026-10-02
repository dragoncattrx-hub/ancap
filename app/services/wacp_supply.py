"""Authoritative wACP ERC-20 supply reads from BSC."""
from __future__ import annotations

import re

import httpx

_TOTAL_SUPPLY_SELECTOR = "0x18160ddd"
_EVM_ADDRESS_RE = re.compile(r"0x[0-9a-fA-F]{40}")


async def erc20_total_supply_wei(
    rpc_url: str,
    contract_address: str,
    *,
    timeout_s: float = 12.0,
) -> int:
    """Read ERC-20 ``totalSupply()`` through an exact ``eth_call``."""
    rpc = (rpc_url or "").strip()
    contract = (contract_address or "").strip()
    if not rpc:
        raise ValueError("BSC RPC URL is not configured")
    if not _EVM_ADDRESS_RE.fullmatch(contract):
        raise ValueError("wACP contract address is invalid")

    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [{"to": contract, "data": _TOTAL_SUPPLY_SELECTOR}, "latest"],
    }
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        response = await client.post(rpc, json=request)
        response.raise_for_status()
        payload = response.json()

    if payload.get("error"):
        raise RuntimeError(f"BSC totalSupply RPC error: {payload['error']}")
    raw = payload.get("result")
    if not isinstance(raw, str) or not re.fullmatch(r"0x[0-9a-fA-F]+", raw):
        raise RuntimeError("BSC totalSupply RPC returned an invalid result")
    value = int(raw, 16)
    if value < 0 or value >= 1 << 256:
        raise RuntimeError("BSC totalSupply is outside uint256")
    return value
