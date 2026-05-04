"""ACP chain watcher: checkpoint + minimal deposit pickup for bridge reserve."""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation, BridgeWatcherCheckpoint
from app.services.bridge_orchestrator import append_transition

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


def _json_chain_amount_to_int(value: object) -> int:
    if value is None:
        return 0
    try:
        return int(str(value).strip())
    except Exception:
        try:
            return int(float(value))
        except Exception:
            return 0


async def _chain_transactions_for_address(rpc_url: str, address: str, best_height: int) -> list[dict[str, Any]]:
    out_index: dict[tuple[str, int], tuple[str, int]] = {}
    rows: list[dict[str, Any]] = []

    for height in range(1, best_height + 1):
        block_hash_payload = await _json_rpc(rpc_url, "getblockhash", {"height": height})
        if block_hash_payload.get("error"):
            continue
        block_hash = block_hash_payload.get("result")
        block_payload = await _json_rpc(rpc_url, "getblock", {"blockhash": block_hash, "verbose": 2})
        if block_payload.get("error"):
            continue
        block = block_payload.get("result") or {}
        txs = block.get("tx") or []

        for tx in txs:
            txid = str(tx.get("txid") or "")
            if not txid:
                continue
            sent_units = 0
            received_units = 0

            for vin in tx.get("vin") or []:
                prev_txid = vin.get("prev_txid")
                prev_vout = vin.get("vout")
                if prev_txid is None or prev_vout is None:
                    continue
                key = (str(prev_txid), int(prev_vout))
                prev_out = out_index.pop(key, None)
                if prev_out and prev_out[0] == address:
                    sent_units += int(prev_out[1])

            for idx, vout in enumerate(tx.get("vout") or []):
                out_addr = str(vout.get("recipient_address") or "")
                out_amount = _json_chain_amount_to_int(vout.get("amount"))
                out_index[(txid, idx)] = (out_addr, out_amount)
                if out_addr == address:
                    received_units += out_amount

            if sent_units == 0 and received_units == 0:
                continue

            net_units = received_units - sent_units
            direction = "in" if net_units >= 0 else "out"
            rows.append(
                {
                    "txid": txid,
                    "block_height": height,
                    "confirmations": best_height - height + 1,
                    "net_units": net_units,
                    "received_units": received_units,
                    "sent_units": sent_units,
                    "direction": direction,
                }
            )

    rows.sort(key=lambda x: (int(x["block_height"]), str(x["txid"])), reverse=True)
    return rows


async def tick_acp_checkpoint(session: AsyncSession) -> dict[str, Any]:
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

    matched = 0
    confirmed_payouts = 0
    reserve = (settings.bridge_reserve_acp_address or "").strip()
    if reserve:
        try:
            txs = await _chain_transactions_for_address(rpc, reserve, height)
            pending = (
                await session.execute(
                    select(BridgeOperation)
                    .where(
                        BridgeOperation.direction == "acp_to_bsc",
                        BridgeOperation.status == "PENDING_DEPOSIT",
                        BridgeOperation.acp_tx_hash.is_(None),
                    )
                    .order_by(BridgeOperation.created_at.asc())
                )
            ).scalars().all()

            used_txids: set[str] = set()
            for op in pending:
                target_units = int(op.amount_acp_smallest or 0)
                for tx in txs:
                    txid = str(tx["txid"])
                    if txid in used_txids:
                        continue
                    if tx.get("direction") != "in":
                        continue
                    if int(tx.get("net_units") or 0) != target_units:
                        continue
                    if int(tx.get("confirmations") or 0) < int(settings.bridge_acp_confirmations):
                        continue
                    dup = await session.scalar(
                        select(BridgeOperation.id).where(BridgeOperation.acp_tx_hash == txid)
                    )
                    if dup is not None:
                        used_txids.add(txid)
                        continue
                    op.acp_tx_hash = txid
                    op.acp_out_index = 0
                    session.add(
                        BridgeAuditEvent(
                            operation_id=op.id,
                            event_type="acp_deposit_detected",
                            payload_json={
                                "txid": txid,
                                "confirmations": int(tx.get("confirmations") or 0),
                                "net_units": int(tx.get("net_units") or 0),
                            },
                        )
                    )
                    await append_transition(
                        session,
                        op,
                        "CONFIRMED_ON_ACP",
                        metadata={
                            "txid": txid,
                            "confirmations": int(tx.get("confirmations") or 0),
                        },
                    )
                    used_txids.add(txid)
                    matched += 1
                    break

            reverse_ops = (
                await session.execute(
                    select(BridgeOperation)
                    .where(
                        BridgeOperation.direction == "bsc_to_acp",
                        BridgeOperation.status == "ACP_PAYOUT_SENT",
                        BridgeOperation.acp_tx_hash.is_not(None),
                    )
                    .order_by(BridgeOperation.created_at.asc())
                )
            ).scalars().all()
            tx_by_id = {str(tx.get("txid") or ""): tx for tx in txs}
            for op in reverse_ops:
                txid = str(op.acp_tx_hash or "")
                tx = tx_by_id.get(txid)
                if not tx:
                    continue
                if tx.get("direction") != "out":
                    continue
                payout_units = abs(int(tx.get("net_units") or 0))
                if payout_units != int(op.amount_acp_smallest or 0):
                    continue
                if int(tx.get("confirmations") or 0) < int(settings.bridge_acp_confirmations):
                    continue
                session.add(
                    BridgeAuditEvent(
                        operation_id=op.id,
                        event_type="acp_payout_confirmed",
                        payload_json={
                            "txid": txid,
                            "confirmations": int(tx.get("confirmations") or 0),
                            "sent_units": int(tx.get("sent_units") or 0),
                            "received_units": int(tx.get("received_units") or 0),
                            "payout_units": payout_units,
                        },
                    )
                )
                await append_transition(
                    session,
                    op,
                    "COMPLETED",
                    metadata={
                        "txid": txid,
                        "confirmations": int(tx.get("confirmations") or 0),
                    },
                )
                confirmed_payouts += 1
        except Exception as exc:
            logger.warning("acp deposit pickup failed: %s", exc)

    await session.flush()
    return {"ok": True, "chain_key": "acp", "last_block_height": height, "matched_deposits": matched, "confirmed_payouts": confirmed_payouts}
