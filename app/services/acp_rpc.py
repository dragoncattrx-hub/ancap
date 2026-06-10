"""Shared ACP node JSON-RPC helpers."""
from __future__ import annotations

import os
from typing import Any

import httpx

from app.config import get_settings


async def acp_rpc_call(method: str, params: list | dict | None = None) -> Any:
    settings = get_settings()
    rpc_url = (settings.acp_rpc_url or "").strip()
    if not rpc_url:
        raise RuntimeError("ACP RPC URL is not configured")
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or []}
    headers: dict[str, str] = {"Content-Type": "application/json"}
    token = os.getenv("ACP_RPC_TOKEN", "").strip()
    if token:
        headers["x-acp-rpc-token"] = token
    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(rpc_url, json=body, headers=headers)
    payload = response.json()
    if payload.get("error"):
        raise RuntimeError(str(payload["error"]))
    return payload.get("result")
