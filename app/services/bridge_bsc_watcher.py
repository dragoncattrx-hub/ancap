"""BSC JSON-RPC watcher checkpoint + mint confirmation progression."""
from __future__ import annotations

import logging
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation, BridgeWatcherCheckpoint
from app.services.bridge_orchestrator import append_transition

logger = logging.getLogger(__name__)


async def _rpc(rpc_url: str, method: str, params: list[Any]) -> Any:
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(rpc_url, json=body)
        r.raise_for_status()
        data = r.json()
        if data.get("error"):
            raise RuntimeError(str(data["error"]))
        return data["result"]


async def _eth_block_number(rpc_url: str) -> int:
    return int(await _rpc(rpc_url, "eth_blockNumber", []), 16)


async def _eth_get_transaction_receipt(rpc_url: str, tx_hash: str) -> dict[str, Any] | None:
    normalized = (tx_hash or "").strip()
    if normalized and not normalized.startswith("0x"):
        normalized = f"0x{normalized}"
    res = await _rpc(rpc_url, "eth_getTransactionReceipt", [normalized])
    return res


async def tick_bsc_checkpoint(session: AsyncSession) -> dict[str, Any]:
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True, "reason": "bridge_rail_disabled"}
    rpc = (settings.bridge_bsc_rpc_url or "").strip()
    if not rpc:
        return {"skipped": True, "reason": "no_bsc_rpc"}
    try:
        height = await _eth_block_number(rpc)
    except Exception as exc:
        logger.warning("bsc watcher rpc failed: %s", exc)
        return {"ok": False, "error": str(exc)}

    row = await session.get(BridgeWatcherCheckpoint, "bsc")
    if row is None:
        row = BridgeWatcherCheckpoint(chain_key="bsc", last_block_height=0)
        session.add(row)
    row.last_block_height = height

    confirmed = 0
    ops = (
        await session.execute(
            select(BridgeOperation).where(
                BridgeOperation.direction == "acp_to_bsc",
                BridgeOperation.status == "MINT_REQUESTED",
                BridgeOperation.bsc_tx_hash_mint.is_not(None),
            )
        )
    ).scalars().all()

    for op in ops:
        try:
            receipt = await _eth_get_transaction_receipt(rpc, str(op.bsc_tx_hash_mint))
            if not receipt:
                continue
            status_hex = receipt.get("status")
            if int(status_hex, 16) != 1:
                session.add(
                    BridgeAuditEvent(
                        operation_id=op.id,
                        event_type="bsc_mint_failed",
                        payload_json={"tx_hash": op.bsc_tx_hash_mint, "receipt": receipt},
                    )
                )
                await append_transition(
                    session,
                    op,
                    "FAILED",
                    metadata={"reason": "bsc_mint_failed", "tx_hash": op.bsc_tx_hash_mint},
                )
                continue
            block_number = int(receipt.get("blockNumber"), 16)
            confirmations = max(0, height - block_number + 1)
            if confirmations < int(settings.bridge_bsc_confirmations):
                continue
            logs = receipt.get("logs") or []
            if logs:
                try:
                    op.bsc_log_index = int(logs[0].get("logIndex"), 16)
                except Exception:
                    pass
            await append_transition(
                session,
                op,
                "MINTED_ON_BSC",
                metadata={
                    "tx_hash": op.bsc_tx_hash_mint,
                    "confirmations": confirmations,
                    "block_number": block_number,
                },
            )
            session.add(
                BridgeAuditEvent(
                    operation_id=op.id,
                    event_type="bsc_mint_confirmed",
                    payload_json={
                        "tx_hash": op.bsc_tx_hash_mint,
                        "confirmations": confirmations,
                        "block_number": block_number,
                        "log_index": op.bsc_log_index,
                    },
                )
            )
            await append_transition(
                session,
                op,
                "COMPLETED",
                metadata={
                    "tx_hash": op.bsc_tx_hash_mint,
                    "confirmations": confirmations,
                    "block_number": block_number,
                },
            )
            confirmed += 1
        except Exception as exc:
            logger.warning("bsc mint confirmation failed for %s: %s", op.id, exc)

    await session.flush()
    return {"ok": True, "chain_key": "bsc", "last_block_height": height, "confirmed_mints": confirmed}
