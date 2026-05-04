"""ACP chain watcher: read-only RPC + checkpoint (see docs/bridge-spec-v1.md)."""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeWatcherCheckpoint

logger = logging.getLogger(__name__)


async def _json_rpc(rpc_url: str, method: str, params: list | dict | None = None) -> dict[str, Any]:
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    headers = {}
    token = os.getenv("ACP_RPC_TOKEN", "").strip()
    if token:
        headers["x-acp-rpc-token"] = token
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(rpc_url, json=body, headers=headers)
        r.raise_for_status()
        return r.json()


async def tick_acp_checkpoint(session: AsyncSession) -> dict[str, Any]:
    """Advance `acp` watcher checkpoint from node height (read-only)."""
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True, "reason": "bridge_rail_disabled"}

    rpc = (settings.acp_rpc_url or "").strip()
    if not rpc:
        return {"skipped": True, "reason": "no_acp_rpc"}

    try:
        payload = await _json_rpc(rpc, "getblockcount", {})
        if payload.get("error"):
            return {"ok": False, "error": str(payload.get("error"))}
        height = int(payload.get("result") or 0)
    except Exception as exc:
        logger.warning("acp watcher rpc failed: %s", exc)
        return {"ok": False, "error": str(exc)}

    row = await session.get(BridgeWatcherCheckpoint, "acp")
    if row is None:
        row = BridgeWatcherCheckpoint(chain_key="acp", last_block_height=0)
        session.add(row)
    row.last_block_height = height
    await session.flush()
    return {"ok": True, "chain_key": "acp", "last_block_height": height}
