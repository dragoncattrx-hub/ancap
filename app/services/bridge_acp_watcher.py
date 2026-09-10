"""ACP chain watcher: checkpoint + deposit pickup for bridge reserve.

Forward deposits are detected by scanning vouts to the reserve address
incrementally (no full-chain walk every tick). Reverse payouts are confirmed
via getrawtransaction on the known payout txid.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation, BridgeWatcherCheckpoint
from app.services.acp_rpc import acp_rpc_headers
from app.services.bridge_orchestrator import append_transition

logger = logging.getLogger(__name__)

_DEPOSIT_SCAN_KEY = "acp_deposit"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _norm_txid(txid: str) -> str:
    return str(txid or "").strip().lower()


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


async def _json_rpc(
    rpc_url: str,
    method: str,
    params: list | dict | None = None,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    headers = acp_rpc_headers()
    if client is not None:
        r = await client.post(rpc_url, json=body, headers=headers)
        r.raise_for_status()
        return r.json()
    async with httpx.AsyncClient(timeout=20.0) as owned:
        r = await owned.post(rpc_url, json=body, headers=headers)
        r.raise_for_status()
        return r.json()


async def _incoming_to_reserve(
    client: httpx.AsyncClient,
    rpc_url: str,
    address: str,
    from_height: int,
    to_height: int,
) -> list[dict[str, Any]]:
    """Scan inclusive height range for vouts paying `address` (received_units only)."""
    rows: list[dict[str, Any]] = []
    if from_height < 1 or to_height < from_height:
        return rows
    reserve = address.strip()
    for height in range(from_height, to_height + 1):
        block_hash_payload = await _json_rpc(rpc_url, "getblockhash", {"height": height}, client=client)
        if block_hash_payload.get("error"):
            continue
        block_hash = block_hash_payload.get("result")
        block_payload = await _json_rpc(
            rpc_url, "getblock", {"blockhash": block_hash, "verbose": 2}, client=client
        )
        if block_payload.get("error"):
            continue
        block = block_payload.get("result") or {}
        for tx in block.get("tx") or []:
            txid = _norm_txid(str(tx.get("txid") or ""))
            if not txid:
                continue
            received_units = 0
            for vout in tx.get("vout") or []:
                out_addr = str(vout.get("recipient_address") or "").strip()
                if out_addr == reserve:
                    received_units += _json_chain_amount_to_int(vout.get("amount"))
            if received_units <= 0:
                continue
            rows.append(
                {
                    "txid": txid,
                    "block_height": height,
                    "confirmations": to_height - height + 1,
                    "received_units": received_units,
                    "net_units": received_units,
                    "direction": "in",
                }
            )
    rows.sort(key=lambda x: (int(x["block_height"]), str(x["txid"])), reverse=True)
    return rows


async def reserve_deposit_units_for_tx(rpc_url: str, reserve_address: str, txid: str) -> dict[str, Any]:
    """Fetch a tx and return reserve-side deposit metadata for admin recovery."""
    normalized = _norm_txid(txid)
    payload = await _json_rpc(rpc_url, "getrawtransaction", {"txid": normalized, "verbose": 1})
    if payload.get("error"):
        raise ValueError(str(payload.get("error")))
    result = payload.get("result") or {}
    decoded = result.get("decoded") if isinstance(result, dict) else None
    if not isinstance(decoded, dict):
        raise ValueError("transaction not found")
    reserve = reserve_address.strip()
    received_units = sum(
        _json_chain_amount_to_int(vout.get("amount"))
        for vout in (decoded.get("vout") or [])
        if str(vout.get("recipient_address") or "").strip() == reserve
    )
    return {
        "txid": normalized,
        "received_units": received_units,
        "confirmations": int(decoded.get("confirmations") or 0),
    }


async def _payout_units_for_beneficiary(
    client: httpx.AsyncClient,
    rpc_url: str,
    txid: str,
    beneficiary: str,
) -> dict[str, Any] | None:
    normalized = _norm_txid(txid)
    payload = await _json_rpc(
        rpc_url, "getrawtransaction", {"txid": normalized, "verbose": 1}, client=client
    )
    if payload.get("error"):
        return None
    result = payload.get("result") or {}
    decoded = result.get("decoded") if isinstance(result, dict) else None
    if not isinstance(decoded, dict):
        return None
    target = beneficiary.strip()
    payout_units = sum(
        _json_chain_amount_to_int(vout.get("amount"))
        for vout in (decoded.get("vout") or [])
        if str(vout.get("recipient_address") or "").strip() == target
    )
    return {
        "txid": normalized,
        "payout_units": payout_units,
        "confirmations": int(decoded.get("confirmations") or 0),
    }


async def tick_acp_checkpoint(session: AsyncSession) -> dict[str, Any]:
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True, "reason": "bridge_rail_disabled"}

    rpc = (settings.acp_rpc_url or "").strip()
    if not rpc:
        return {"skipped": True, "reason": "no_acp_rpc"}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            payload = await _json_rpc(rpc, "getblockcount", {}, client=client)
            if payload.get("error"):
                return {"ok": False, "error": str(payload.get("error"))}
            tip = int(payload.get("result") or 0)

            tip_row = await session.get(BridgeWatcherCheckpoint, "acp")
            if tip_row is None:
                tip_row = BridgeWatcherCheckpoint(chain_key="acp", last_block_height=0)
                session.add(tip_row)
            tip_row.last_block_height = tip

            matched = 0
            confirmed_payouts = 0
            expired_pending = 0
            deposit_error: str | None = None
            reverse_error: str | None = None
            scanned_from = 0
            scanned_to = 0
            reserve = (settings.bridge_reserve_acp_address or "").strip()
            lookback = max(0, int(getattr(settings, "bridge_acp_scan_lookback", 12) or 12))
            max_blocks = max(1, int(getattr(settings, "bridge_acp_scan_max_blocks", 800) or 800))
            windows = max(1, int(getattr(settings, "bridge_acp_scan_windows_per_tick", 8) or 8))
            confirmations_needed = int(settings.bridge_acp_confirmations)
            ttl_hours = max(0, int(getattr(settings, "bridge_pending_deposit_ttl_hours", 72) or 0))

            if reserve:
                try:
                    if ttl_hours > 0:
                        cutoff = _utcnow() - timedelta(hours=ttl_hours)
                        stale = (
                            await session.execute(
                                select(BridgeOperation)
                                .where(
                                    BridgeOperation.direction == "acp_to_bsc",
                                    BridgeOperation.status == "PENDING_DEPOSIT",
                                    BridgeOperation.acp_tx_hash.is_(None),
                                    BridgeOperation.created_at < cutoff,
                                )
                                .order_by(BridgeOperation.created_at.asc())
                                .limit(100)
                            )
                        ).scalars().all()
                        for op in stale:
                            session.add(
                                BridgeAuditEvent(
                                    operation_id=op.id,
                                    event_type="pending_deposit_expired",
                                    payload_json={"ttl_hours": ttl_hours},
                                )
                            )
                            await append_transition(
                                session,
                                op,
                                "CANCELLED",
                                metadata={"reason": "pending_deposit_ttl_expired", "ttl_hours": ttl_hours},
                            )
                            expired_pending += 1

                    scan_row = await session.get(BridgeWatcherCheckpoint, _DEPOSIT_SCAN_KEY)
                    if scan_row is None:
                        scan_row = BridgeWatcherCheckpoint(chain_key=_DEPOSIT_SCAN_KEY, last_block_height=0)
                        session.add(scan_row)

                    txs: list[dict[str, Any]] = []
                    first_start: int | None = None
                    last_end = int(scan_row.last_block_height or 0)
                    for _ in range(windows):
                        prev = int(scan_row.last_block_height or 0)
                        if prev <= 0:
                            start = 1
                        else:
                            start = max(1, prev - lookback + 1)
                        end = min(tip, start + max_blocks - 1)
                        if end < start:
                            break
                        if first_start is None:
                            first_start = start
                        chunk = await _incoming_to_reserve(client, rpc, reserve, start, end)
                        txs.extend(chunk)
                        scan_row.last_block_height = end
                        last_end = end
                        if end >= tip:
                            break
                    scanned_from = int(first_start or 0)
                    scanned_to = int(last_end or 0)

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
                            txid = _norm_txid(str(tx["txid"]))
                            if txid in used_txids:
                                continue
                            if int(tx.get("received_units") or 0) != target_units:
                                continue
                            conf = tip - int(tx.get("block_height") or 0) + 1
                            if conf < confirmations_needed:
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
                                        "confirmations": conf,
                                        "received_units": int(tx.get("received_units") or 0),
                                    },
                                )
                            )
                            await append_transition(
                                session,
                                op,
                                "CONFIRMED_ON_ACP",
                                metadata={"txid": txid, "confirmations": conf},
                            )
                            used_txids.add(txid)
                            matched += 1
                            break
                except Exception as exc:
                    deposit_error = f"{type(exc).__name__}: {exc}"
                    logger.warning("acp deposit pickup failed: %s", exc, exc_info=True)

                # Reverse confirmations must not abort forward deposit matches.
                try:
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
                    for op in reverse_ops:
                        txid = str(op.acp_tx_hash or "")
                        user_acp_address = str(op.user_acp_address or "").strip()
                        expected_units = int(op.amount_acp_smallest or 0)
                        if not txid or not user_acp_address:
                            continue
                        meta = await _payout_units_for_beneficiary(
                            client, rpc, txid, user_acp_address
                        )
                        if not meta:
                            continue
                        if int(meta.get("payout_units") or 0) != expected_units:
                            continue
                        if int(meta.get("confirmations") or 0) < confirmations_needed:
                            continue
                        session.add(
                            BridgeAuditEvent(
                                operation_id=op.id,
                                event_type="acp_payout_confirmed",
                                payload_json={
                                    "txid": txid,
                                    "confirmations": int(meta.get("confirmations") or 0),
                                    "payout_units": int(meta.get("payout_units") or 0),
                                    "beneficiary_address": user_acp_address,
                                },
                            )
                        )
                        await append_transition(
                            session,
                            op,
                            "COMPLETED",
                            metadata={
                                "txid": txid,
                                "confirmations": int(meta.get("confirmations") or 0),
                            },
                        )
                        confirmed_payouts += 1
                except Exception as exc:
                    reverse_error = f"{type(exc).__name__}: {exc}"
                    logger.warning("acp reverse payout confirm failed: %s", exc, exc_info=True)

            await session.flush()
            out: dict[str, Any] = {
                "ok": deposit_error is None and reverse_error is None,
                "chain_key": "acp",
                "last_block_height": tip,
                "matched_deposits": matched,
                "confirmed_payouts": confirmed_payouts,
                "expired_pending_deposits": expired_pending,
                "scanned_from": scanned_from,
                "scanned_to": scanned_to,
            }
            if deposit_error:
                out["deposit_pickup_error"] = deposit_error
            if reverse_error:
                out["reverse_confirm_error"] = reverse_error
            return out
    except Exception as exc:
        logger.warning("acp watcher rpc failed: %s", exc)
        return {"ok": False, "error": str(exc)}
