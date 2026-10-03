"""Incremental full-chain indexer for public ACP explorer address history."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AcpExplorerAddressEvent,
    AcpExplorerBlock,
    AcpExplorerIndexerState,
    AcpExplorerTx,
)
from app.services.acp_amounts import rpc_amount_units
from app.services.acp_rpc import acp_rpc_call

logger = logging.getLogger("acp_explorer_index")

_UNITS = Decimal(100_000_000)


def _units_to_acp_str(units: int) -> str:
    acp = (Decimal(int(units)) / _UNITS).quantize(Decimal("0.00000001"))
    s = format(acp, "f").rstrip("0").rstrip(".")
    return s or "0"


async def _ensure_state(session: AsyncSession) -> AcpExplorerIndexerState:
    row = await session.execute(
        select(AcpExplorerIndexerState).where(AcpExplorerIndexerState.id == 1)
    )
    state = row.scalar_one_or_none()
    if state is None:
        state = AcpExplorerIndexerState(id=1, last_scanned_height=0)
        session.add(state)
        await session.flush()
    return state


def _extract_tx_records(block: dict, height: int, block_hash: str, block_time: int | None) -> tuple[list[dict], list[dict]]:
    """Return (tx_rows, event_rows) from a verbose=2 block."""
    txs_out: list[dict] = []
    events: list[dict] = []
    for tx in block.get("tx") or []:
        if not isinstance(tx, dict):
            # verbose=1 style: list of txids only — skip detail
            continue
        txid = str(tx.get("txid") or "").strip().lower()
        if not txid:
            continue
        vin = tx.get("vin") or []
        vout = tx.get("vout") or []
        in_units = 0
        out_units = 0
        for idx, out in enumerate(vout):
            if not isinstance(out, dict):
                continue
            amt = rpc_amount_units(out.get("amount"))
            out_units += amt
            addr = str(out.get("recipient_address") or "").strip()
            if addr:
                events.append(
                    {
                        "address": addr,
                        "txid": txid,
                        "direction": "in",
                        "amount_units": amt,
                        "vout": idx,
                        "vin": None,
                        "height": height,
                    }
                )
        for idx, inp in enumerate(vin):
            if not isinstance(inp, dict):
                continue
            # Prefer coinbase / amount fields when present
            amt = rpc_amount_units(inp.get("amount") or inp.get("value") or 0)
            in_units += amt
            addr = str(inp.get("address") or inp.get("recipient_address") or "").strip()
            if addr and amt:
                events.append(
                    {
                        "address": addr,
                        "txid": txid,
                        "direction": "out",
                        "amount_units": amt,
                        "vout": None,
                        "vin": idx,
                        "height": height,
                    }
                )
        fee = max(0, in_units - out_units) if in_units else 0
        txs_out.append(
            {
                "txid": txid,
                "block_height": height,
                "block_hash": block_hash,
                "block_time": block_time,
                "fee_units": fee,
                "input_count": len(vin),
                "output_count": len(vout),
            }
        )
    return txs_out, events


async def acp_explorer_index_tick(
    session: AsyncSession,
    *,
    max_blocks: int = 50,
) -> dict:
    """Index up to `max_blocks` new heights into explorer tables."""
    state = await _ensure_state(session)
    try:
        tip = int(await acp_rpc_call("getblockcount", []) or 0)
    except RuntimeError as exc:
        return {"ok": False, "error": str(exc)[:200], "last_scanned_height": state.last_scanned_height}

    start = int(state.last_scanned_height or 0) + 1
    if tip < 1 or start > tip:
        return {
            "ok": True,
            "indexed_blocks": 0,
            "tip": tip,
            "last_scanned_height": state.last_scanned_height,
        }

    end = min(tip, start + max(1, max_blocks) - 1)
    indexed = 0
    events_n = 0
    txs_n = 0

    for height in range(start, end + 1):
        try:
            block_hash = str(await acp_rpc_call("getblockhash", {"height": height}) or "")
            block = await acp_rpc_call("getblock", {"blockhash": block_hash, "verbose": 2}) or {}
        except RuntimeError as exc:
            logger.warning("explorer index height %s failed: %s", height, exc)
            break
        if not isinstance(block, dict):
            break
        header = block.get("header") if isinstance(block.get("header"), dict) else {}
        block_time = header.get("time") or block.get("time")
        try:
            block_time_i = int(block_time) if block_time is not None else None
        except (TypeError, ValueError):
            block_time_i = None
        tx_list = block.get("tx") or []
        size = block.get("size") or block.get("bytes")
        try:
            size_i = int(size) if size is not None else None
        except (TypeError, ValueError):
            size_i = None

        await session.execute(
            pg_insert(AcpExplorerBlock)
            .values(
                height=height,
                hash=block_hash,
                time=block_time_i,
                tx_count=len(tx_list),
                size=size_i,
            )
            .on_conflict_do_update(
                index_elements=[AcpExplorerBlock.height],
                set_={
                    "hash": block_hash,
                    "time": block_time_i,
                    "tx_count": len(tx_list),
                    "size": size_i,
                },
            )
        )

        tx_rows, event_rows = _extract_tx_records(block, height, block_hash, block_time_i)
        for row in tx_rows:
            await session.execute(
                pg_insert(AcpExplorerTx)
                .values(**row)
                .on_conflict_do_update(
                    index_elements=[AcpExplorerTx.txid],
                    set_={
                        "block_height": row["block_height"],
                        "block_hash": row["block_hash"],
                        "block_time": row["block_time"],
                        "fee_units": row["fee_units"],
                        "input_count": row["input_count"],
                        "output_count": row["output_count"],
                    },
                )
            )
            txs_n += 1

        # Replace events for this height (reorg-safe-ish for tip rewind small)
        await session.execute(
            delete(AcpExplorerAddressEvent).where(AcpExplorerAddressEvent.height == height)
        )
        for ev in event_rows:
            session.add(AcpExplorerAddressEvent(**ev))
            events_n += 1

        state.last_scanned_height = height
        state.last_scanned_at = datetime.now(timezone.utc)
        indexed += 1
        await session.flush()

    return {
        "ok": True,
        "indexed_blocks": indexed,
        "indexed_txs": txs_n,
        "indexed_events": events_n,
        "tip": tip,
        "last_scanned_height": state.last_scanned_height,
        "range": [start, end] if indexed else None,
    }


async def explorer_index_status(session: AsyncSession) -> dict:
    state = await _ensure_state(session)
    blocks = int(
        (await session.execute(select(func.count()).select_from(AcpExplorerBlock))).scalar() or 0
    )
    txs = int((await session.execute(select(func.count()).select_from(AcpExplorerTx))).scalar() or 0)
    events = int(
        (await session.execute(select(func.count()).select_from(AcpExplorerAddressEvent))).scalar()
        or 0
    )
    return {
        "last_scanned_height": state.last_scanned_height,
        "last_scanned_at": state.last_scanned_at.isoformat() if state.last_scanned_at else None,
        "blocks": blocks,
        "txs": txs,
        "address_events": events,
    }


async def address_history(
    session: AsyncSession,
    address: str,
    *,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    target = (address or "").strip()
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    total = int(
        (
            await session.execute(
                select(func.count())
                .select_from(AcpExplorerAddressEvent)
                .where(AcpExplorerAddressEvent.address == target)
            )
        ).scalar()
        or 0
    )
    rows = (
        await session.execute(
            select(AcpExplorerAddressEvent)
            .where(AcpExplorerAddressEvent.address == target)
            .order_by(
                AcpExplorerAddressEvent.height.desc().nullslast(),
                AcpExplorerAddressEvent.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
    ).scalars().all()
    out = []
    for r in rows:
        out.append(
            {
                "txid": r.txid,
                "direction": r.direction,
                "amount_units": str(int(r.amount_units or 0)),
                "amount_acp": _units_to_acp_str(int(r.amount_units or 0)),
                "height": r.height,
                "vout": r.vout,
                "vin": r.vin,
            }
        )
    return out, total


# re-export helper for routers
units_to_acp_str = _units_to_acp_str
