"""BSC JSON-RPC watcher checkpoint (eth_blockNumber)."""
from __future__ import annotations

import logging
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeWatcherCheckpoint

logger = logging.getLogger(__name__)


async def _eth_block_number(rpc_url: str) -> int:
    body = {"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": []}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(rpc_url, json=body)
        r.raise_for_status()
        data = r.json()
        if data.get("error"):
            raise RuntimeError(str(data["error"]))
        return int(data["result"], 16)


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
    await session.flush()
    return {"ok": True, "chain_key": "bsc", "last_block_height": height}
