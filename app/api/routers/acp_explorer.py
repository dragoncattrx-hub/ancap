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
    lean = {
        "protocol_profile": "lean-v1.4",
        "energy_model": "ultra-light-assembler",
        "signing_security": "hybrid-ed25519-dilithium2",
        "encryption_security": "xwing-draft10-ml-kem-768-x25519-hkdf-sha256-xchacha20poly1305-v1",
        "encryption_status": "experimental-off-chain-envelope",
        "privacy_profile": "unlinkable-subaddr-v1",
        "target_block_time_sec": 5,
        "max_block_bytes": 2 * 1024 * 1024,
        "design_tps_hint": 102,
        "pow": False,
    }
    try:
        net = await acp_rpc_call("getnetworkinfo", [])
        if isinstance(net, dict):
            for key in (
                "protocol_profile",
                "energy_model",
                "signing_security",
                "encryption_security",
                "encryption_status",
                "privacy_profile",
                "target_block_time_sec",
                "max_block_bytes",
                "max_txs_per_block",
                "design_tps_hint",
                "miner_interval_secs",
                "miner_heartbeat_enabled",
                "pow",
                "mempool_size",
                "version",
            ):
                if key in net:
                    lean[key] = net[key]
    except RuntimeError:
        pass
    return {
        "status": "ok",
        "chain_id": 1001,
        "block_height": int(height or 0),
        "best_block_hash": best_hash,
        "lean": lean,
    }


@router.get("/efficiency")
async def explorer_efficiency():
    """Public lean-chain scorecard vs 2026 market themes (security / speed / energy)."""
    status = await explorer_status()
    lean = status.get("lean") if isinstance(status, dict) else {}
    mempool = None
    try:
        mempool = await acp_rpc_call("getmempoolinfo", [])
    except RuntimeError:
        mempool = None
    return {
        "status": "ok",
        "block_height": status.get("block_height"),
        "lean": lean,
        "mempool": mempool,
        "market_alignment_2026": {
            "security": [
                "Hybrid Ed25519 + Dilithium2 signatures (post-quantum ready)",
                (
                    "X-Wing draft-10 (X25519 + FIPS 203 ML-KEM-768) off-chain envelopes "
                    "(experimental; independent review pending)"
                ),
                "No PoW hash race / ASIC arms race attack surface",
                "Fee floor + packed-block anti-spam",
            ],
            "speed": [
                "Target 5s block cadence (aligned miner interval)",
                "Fee-prioritized multi-tx packing up to 512 txs / 2 MB",
                "Design capacity hint ~100 TPS under full packs",
            ],
            "energy": [
                "Ultra-light assembler (orders of magnitude below Bitcoin PoW)",
                "Idle heartbeat throttled (~60s) — no continuous hash burn",
                "Comparable philosophy to post-Merge PoS efficiency without heavy validator re-execution yet",
            ],
            "privacy": [
                "Unlinkable receive subaddresses (never reuse recommended)",
                "Explorer/wallet redaction by default",
                "Transparent ledger honesty: amounts still auditable by full nodes — not a mixer",
            ],
            "vs_peers_note": (
                "Ethereum focuses L1 zkEVM / energy-efficient PoS; Solana optimizes monolithic TPS; "
                "privacy coins hide amounts. ACP Lean targets AI-workflow settlement: PQC-ready security, "
                "low energy, packed throughput, unlinkable receives."
            ),
        },
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
async def get_transaction(txid: str, view: str = "redacted"):
    try:
        tx = await acp_rpc_call("getrawtransaction", {"txid": txid.strip().lower(), "verbose": 1})
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    decoded = tx.get("decoded") if isinstance(tx, dict) else None
    mode = (view or "redacted").strip().lower()
    if mode in ("redacted", "privacy", "summary"):
        from app.services.acp_privacy import explorer_tx_redacted, PRIVACY_PROFILE

        return {
            "txid": txid.strip().lower(),
            "view": "redacted",
            "privacy_profile": PRIVACY_PROFILE,
            "summary": explorer_tx_redacted(decoded or tx),
            "hint": "Pass ?view=full to reveal decoded wire (on-chain data is still public to full nodes).",
        }
    return {"txid": txid.strip().lower(), "view": "full", "transaction": decoded or tx}


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
