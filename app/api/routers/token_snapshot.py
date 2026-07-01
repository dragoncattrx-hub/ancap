"""Free token risk snapshot (public lead magnet).

Performs a real first-pass check instead of a client-side demo score:
- For EVM contract addresses with a configured chain RPC, verifies contract
  code exists and reads the ERC-20 interface (name/symbol/decimals/totalSupply).
- Scores from observable evidence; anything unverifiable is reported as
  "needs_evidence" and pushed toward the paid Token Risk Report Pro workflow.
"""
from __future__ import annotations

import logging
import re

import httpx
from fastapi import APIRouter, Request

from app.config import get_settings
from app.schemas.token_snapshot import (
    TokenSnapshotCheck,
    TokenSnapshotRequest,
    TokenSnapshotResponse,
)
from app.services.rate_limit import enforce_rate_limit, get_request_ip

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/token-snapshot", tags=["Token snapshot"])

_EVM_ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")

# ERC-20 selectors
_SEL_NAME = "0x06fdde03"
_SEL_SYMBOL = "0x95d89b41"
_SEL_DECIMALS = "0x313ce567"
_SEL_TOTAL_SUPPLY = "0x18160ddd"

_DISCLAIMER = (
    "Free first-pass snapshot based on public on-chain evidence only. "
    "Not financial advice. Liquidity, holder concentration, and treasury "
    "controls require the full Token Risk Report Pro workflow."
)


def _rpc_url_for_chain(chain: str) -> str | None:
    s = get_settings()
    normalized = (chain or "").strip().lower()
    if normalized in ("bsc", "bnb", "binance", "binance smart chain", "bep20", "bep-20"):
        return s.bridge_bsc_rpc_url or None
    if normalized in ("eth", "ethereum", "mainnet", "erc20", "erc-20"):
        return s.ethereum_rpc_url or None
    return None


async def _eth_call(client: httpx.AsyncClient, rpc: str, to: str, data: str) -> str | None:
    try:
        r = await client.post(
            rpc,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "eth_call",
                "params": [{"to": to, "data": data}, "latest"],
            },
        )
        payload = r.json()
        result = payload.get("result")
        return result if isinstance(result, str) else None
    except Exception:
        return None


def _decode_string(hex_result: str | None) -> str | None:
    if not hex_result or not hex_result.startswith("0x") or len(hex_result) < 130:
        return None
    raw = bytes.fromhex(hex_result[2:])
    try:
        length = int.from_bytes(raw[32:64], "big")
        if length <= 0 or length > 256:
            return None
        return raw[64 : 64 + length].decode("utf-8", errors="replace").strip() or None
    except Exception:
        return None


def _decode_uint(hex_result: str | None) -> int | None:
    if not hex_result or not hex_result.startswith("0x"):
        return None
    try:
        return int(hex_result, 16)
    except ValueError:
        return None


async def _analyze_contract(rpc: str, address: str) -> dict:
    out: dict = {
        "has_code": False,
        "name": None,
        "symbol": None,
        "decimals": None,
        "total_supply": None,
        "rpc_reachable": False,
    }
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            r = await client.post(
                rpc,
                json={"jsonrpc": "2.0", "id": 1, "method": "eth_getCode", "params": [address, "latest"]},
            )
            code = r.json().get("result")
            out["rpc_reachable"] = True
            out["has_code"] = isinstance(code, str) and len(code) > 4
        except Exception:
            return out

        if not out["has_code"]:
            return out

        out["name"] = _decode_string(await _eth_call(client, rpc, address, _SEL_NAME))
        out["symbol"] = _decode_string(await _eth_call(client, rpc, address, _SEL_SYMBOL))
        decimals = _decode_uint(await _eth_call(client, rpc, address, _SEL_DECIMALS))
        if decimals is not None and 0 <= decimals <= 36:
            out["decimals"] = decimals
        supply = _decode_uint(await _eth_call(client, rpc, address, _SEL_TOTAL_SUPPLY))
        if supply is not None:
            out["total_supply"] = str(supply)
    return out


@router.post("", response_model=TokenSnapshotResponse)
async def token_snapshot(request: Request, body: TokenSnapshotRequest):
    ip = get_request_ip(request)
    await enforce_rate_limit(key=f"token-snapshot:{ip}", limit=20, window_seconds=60)

    subject = body.subject.strip()
    chain = body.chain.strip() or "bsc"
    is_address = bool(_EVM_ADDRESS_RE.match(subject))

    checks: list[TokenSnapshotCheck] = []
    score = 50
    onchain_verified = False
    token_name = token_symbol = None
    token_decimals = None
    total_supply = None

    if is_address:
        rpc = _rpc_url_for_chain(chain)
        if rpc:
            info = await _analyze_contract(rpc, subject.lower())
            if not info["rpc_reachable"]:
                checks.append(TokenSnapshotCheck(
                    key="onchain_lookup", label="On-chain lookup", status="needs_evidence",
                    note=f"Chain RPC for '{chain}' is unreachable right now; re-run or use the full report.",
                ))
            elif not info["has_code"]:
                score -= 30
                checks.append(TokenSnapshotCheck(
                    key="contract_code", label="Contract deployed", status="warn",
                    note="No contract bytecode found at this address on the selected chain — wrong chain or not a contract.",
                ))
            else:
                onchain_verified = True
                score += 15
                checks.append(TokenSnapshotCheck(
                    key="contract_code", label="Contract deployed", status="pass",
                    note="Contract bytecode verified on-chain.",
                ))
                token_name = info["name"]
                token_symbol = info["symbol"]
                token_decimals = info["decimals"]
                total_supply = info["total_supply"]
                erc20_ok = bool(token_symbol and token_decimals is not None and total_supply is not None)
                if erc20_ok:
                    score += 15
                    checks.append(TokenSnapshotCheck(
                        key="erc20_interface", label="ERC-20 interface", status="pass",
                        note=f"Readable token metadata: {token_symbol}, {token_decimals} decimals.",
                    ))
                else:
                    score -= 10
                    checks.append(TokenSnapshotCheck(
                        key="erc20_interface", label="ERC-20 interface", status="warn",
                        note="Standard ERC-20 metadata calls did not fully resolve — non-standard or proxy contract.",
                    ))
        else:
            checks.append(TokenSnapshotCheck(
                key="onchain_lookup", label="On-chain lookup", status="needs_evidence",
                note=f"No RPC configured for chain '{chain}'. BSC and Ethereum are supported for free on-chain checks.",
            ))
    else:
        checks.append(TokenSnapshotCheck(
            key="contract_address", label="Contract address", status="needs_evidence",
            note="Provide the 0x contract address for on-chain verification; name-only input cannot be verified.",
        ))
        score -= 5

    # Evidence areas the free snapshot cannot verify — the paid report covers these.
    for key, label in [
        ("holder_concentration", "Holder concentration"),
        ("liquidity_proof", "Liquidity proof"),
        ("treasury_controls", "Treasury controls"),
        ("campaign_disclosure", "Campaign disclosure"),
    ]:
        checks.append(TokenSnapshotCheck(
            key=key, label=label, status="needs_evidence",
            note="Requires the full Token Risk Report Pro analysis.",
        ))

    score = max(5, min(95, score))
    risk_level = "low" if score >= 70 else "medium" if score >= 45 else "high"

    return TokenSnapshotResponse(
        subject=subject,
        chain=chain,
        score=score,
        risk_level=risk_level,
        is_contract_address=is_address,
        onchain_verified=onchain_verified,
        token_name=token_name,
        token_symbol=token_symbol,
        token_decimals=token_decimals,
        total_supply=total_supply,
        checks=checks,
        disclaimer=_DISCLAIMER,
    )
