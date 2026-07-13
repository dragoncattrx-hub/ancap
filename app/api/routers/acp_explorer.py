from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.services.acp_rpc import acp_rpc_call
from app.services.acp_tokenomics import _address_balance_acp

router = APIRouter(prefix="/acp/explorer", tags=["ACP Explorer"])


@router.get("/status")
async def explorer_status():
    try:
        height = await acp_rpc_call("getblockcount", [])
        best_hash = await acp_rpc_call("getbestblockhash", [])
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "status": "ok",
        "chain_id": 1001,
        "block_height": int(height or 0),
        "best_block_hash": best_hash,
    }


@router.get("/blocks")
async def list_blocks(limit: int = 10):
    limit = max(1, min(limit, 50))
    try:
        height = int(await acp_rpc_call("getblockcount", []) or 0)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    blocks = []
    for h in range(height, max(-1, height - limit), -1):
        if h < 0:
            break
        try:
            block_hash = await acp_rpc_call("getblockhash", {"height": h})
            block = await acp_rpc_call("getblock", {"blockhash": block_hash, "verbose": True})
            tx_list = block.get("tx", []) if isinstance(block, dict) else []
            blocks.append({"height": h, "hash": block_hash, "tx_count": len(tx_list)})
        except RuntimeError:
            blocks.append({"height": h, "hash": None, "tx_count": 0})
    return {"block_height": height, "items": blocks}


@router.get("/tx/{txid}")
async def get_transaction(txid: str):
    try:
        tx = await acp_rpc_call("getrawtransaction", {"txid": txid.strip().lower(), "verbose": 1})
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    decoded = tx.get("decoded") if isinstance(tx, dict) else None
    return {"txid": txid.strip().lower(), "transaction": decoded or tx}


@router.get("/tokenomics/snapshot")
async def tokenomics_snapshot():
    try:
        from app.services.acp_tokenomics import build_tokenomics_snapshot

        return await build_tokenomics_snapshot()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/address/{address}")
async def get_address_summary(address: str):
    target = address.strip()
    if not target:
        raise HTTPException(status_code=400, detail="address is required")
    try:
        balance, utxo_count = await _address_balance_acp(target)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "address": target,
        "balance_acp": format(balance.quantize(Decimal("0.00000001")), "f").rstrip("0").rstrip(".") or "0",
        "utxo_count": utxo_count,
    }
