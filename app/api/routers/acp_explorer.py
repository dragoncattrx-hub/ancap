from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.acp_rpc import acp_rpc_call

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
            block_hash = await acp_rpc_call("getblockhash", [h])
            block = await acp_rpc_call("getblock", [block_hash, 1])
            blocks.append({"height": h, "hash": block_hash, "tx_count": len(block.get("tx", [])) if isinstance(block, dict) else 0})
        except RuntimeError:
            blocks.append({"height": h, "hash": None, "tx_count": 0})
    return {"block_height": height, "items": blocks}


@router.get("/tx/{txid}")
async def get_transaction(txid: str):
    try:
        tx = await acp_rpc_call("getrawtransaction", [txid, 1])
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"txid": txid, "transaction": tx}


@router.get("/address/{address}")
async def get_address_summary(address: str):
    try:
        utxos = await acp_rpc_call("listunspent", [0, 9999999, [address]])
        balance = sum(float(item.get("amount", 0)) for item in (utxos or []) if isinstance(item, dict))
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"address": address, "balance_acp": balance, "utxo_count": len(utxos or [])}
