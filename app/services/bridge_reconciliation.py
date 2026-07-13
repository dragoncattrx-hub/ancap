"""Off-chain reconciliation for wACP clearing rail (docs/bridge-spec-v1.md)."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation, BridgeReserveSnapshot
from app.services.bridge_decimal import _SCALE


_REVERSE_LIABILITY_STATUSES = ("BURN_CONFIRMED", "ACP_PAYOUT_SENT", "DISPUTED")

logger = logging.getLogger(__name__)


STALE_SNAPSHOT_THRESHOLD_MINUTES = 30


async def check_stale_snapshots(session: AsyncSession) -> dict | None:
    """Alert if the most recent reserve snapshot is older than STALE_SNAPSHOT_THRESHOLD_MINUTES.

    Returns an alert dict if stale, otherwise None.
    """
    from sqlalchemy import desc, select as sa_select

    row = await session.execute(
        sa_select(BridgeReserveSnapshot)
        .order_by(desc(BridgeReserveSnapshot.snapshot_at))
        .limit(1)
    )
    latest = row.scalar_one_or_none()
    if latest is None:
        return None

    from datetime import timedelta as td

    age_minutes = (datetime.now(timezone.utc) - latest.snapshot_at).total_seconds() / 60
    if age_minutes > STALE_SNAPSHOT_THRESHOLD_MINUTES:
        alert = {
            "alert": "stale_reserve_snapshot",
            "age_minutes": round(age_minutes, 1),
            "threshold_minutes": STALE_SNAPSHOT_THRESHOLD_MINUTES,
            "last_snapshot_at": latest.snapshot_at.isoformat(),
            "last_status": latest.status,
            "last_reserve_health": latest.reserve_health,
        }
        logger.warning("STALE SNAPSHOT ALERT: %s", alert)
        return alert
    return None


async def check_reconciliation_mismatch_alert(session: AsyncSession) -> dict | None:
    """Alert if the most recent snapshot shows a reconciliation mismatch.

    Returns an alert dict if mismatched, otherwise None.
    """
    from sqlalchemy import desc, select as sa_select

    row = await session.execute(
        sa_select(BridgeReserveSnapshot)
        .order_by(desc(BridgeReserveSnapshot.snapshot_at))
        .limit(1)
    )
    latest = row.scalar_one_or_none()
    if latest is None:
        return None

    if not latest.reconciliation_ok:
        alert = {
            "alert": "reconciliation_mismatch",
            "snapshot_at": latest.snapshot_at.isoformat(),
            "delta_wacp_wei": str(int(latest.delta_wacp_wei or 0)),
            "reserve_health": latest.reserve_health,
            "status": latest.status,
        }
        logger.error("RECONCILIATION MISMATCH ALERT: %s", alert)
        return alert
    return None


async def _write_reserve_snapshot(session: AsyncSession, payload: dict) -> None:
    """Persist a BridgeReserveSnapshot row each time reconciliation runs."""
    try:
        async with session.begin_nested():
            snapshot = BridgeReserveSnapshot(
                id=uuid.uuid4(),
                snapshot_at=datetime.now(timezone.utc),
                reserve_balance_acp_smallest=payload.get("reserve_balance_acp_smallest", 0),
                total_wacp_wei_completed=payload.get("total_wacp_wei", 0),
                total_wacp_wei_implied=payload.get("implied_wacp_wei_from_acp", 0),
                backing_ratio=Decimal(payload["backing_ratio"]) if payload.get("backing_ratio") else None,
                delta_wacp_wei=payload.get("delta_wacp_wei", 0),
                reconciliation_ok=payload.get("ok", False),
                acp_reserve_address=payload.get("acp_reserve_address"),
                wacp_contract=payload.get("wacp_contract"),
                status=payload.get("status", "pending"),
                reserve_health=payload.get("reserve_health", "pending"),
                notes=payload.get("notes", []),
                last_acp_block_height=payload.get("last_acp_block_height"),
                last_bsc_block_number=payload.get("last_bsc_block_number"),
            )
            session.add(snapshot)
            await session.flush()
    except Exception as exc:
        logger.warning("failed to write bridge reserve snapshot: %s", exc)


async def run_reconciliation(session: AsyncSession) -> dict:
    """Compare completed forward mint accounting and expose reverse outstanding liability totals."""
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True}

    q = select(
        func.coalesce(func.sum(BridgeOperation.amount_acp_smallest), 0),
        func.coalesce(func.sum(BridgeOperation.amount_wacp_wei), 0),
    ).where(
        BridgeOperation.direction == "acp_to_bsc",
        BridgeOperation.status == "COMPLETED",
    )
    row = (await session.execute(q)).one()
    total_acp_smallest = int(row[0] or 0)
    total_wacp_wei = int(row[1] or 0)
    implied_wacp = int(Decimal(total_acp_smallest) * _SCALE)
    delta = total_wacp_wei - implied_wacp
    ok = delta == 0

    reverse_row = (
        await session.execute(
            select(
                func.coalesce(func.sum(BridgeOperation.amount_acp_smallest), 0),
                func.coalesce(func.sum(BridgeOperation.amount_wacp_wei), 0),
            ).where(
                BridgeOperation.direction == "bsc_to_acp",
                BridgeOperation.status.in_(_REVERSE_LIABILITY_STATUSES),
            )
        )
    ).one()
    reverse_outstanding_acp_smallest = int(reverse_row[0] or 0)
    reverse_outstanding_wacp_wei = int(reverse_row[1] or 0)

    reverse_completed_row = (
        await session.execute(
            select(
                func.coalesce(func.sum(BridgeOperation.amount_acp_smallest), 0),
                func.coalesce(func.sum(BridgeOperation.amount_wacp_wei), 0),
            ).where(
                BridgeOperation.direction == "bsc_to_acp",
                BridgeOperation.status == "COMPLETED",
            )
        )
    ).one()
    reverse_completed_acp_smallest = int(reverse_completed_row[0] or 0)
    reverse_completed_wacp_wei = int(reverse_completed_row[1] or 0)

    payload = {
        "total_acp_smallest": total_acp_smallest,
        "total_wacp_wei": total_wacp_wei,
        "implied_wacp_wei_from_acp": implied_wacp,
        "delta_wacp_wei": delta,
        "ok": ok,
        "reverse_outstanding_liability_acp_smallest": reverse_outstanding_acp_smallest,
        "reverse_outstanding_liability_wacp_wei": reverse_outstanding_wacp_wei,
        "reverse_completed_acp_smallest": reverse_completed_acp_smallest,
        "reverse_completed_wacp_wei": reverse_completed_wacp_wei,
        "reverse_liability_statuses": list(_REVERSE_LIABILITY_STATUSES),
    }
    ev = BridgeAuditEvent(
        operation_id=None,
        event_type="reconciliation_ok" if ok else "reconciliation_mismatch",
        payload_json=payload,
    )
    session.add(ev)
    await session.flush()
    if not ok:
        logger.error("bridge reconciliation mismatch: %s", payload)

    # --- snapshot record for stale-data detection + mismatch alerting ---
    await _write_reserve_snapshot(session, {
        **payload,
        "acp_reserve_address": settings.bridge_reserve_acp_address,
        "wacp_contract": settings.bridge_wacp_contract,
        "status": "healthy" if ok else "critical",
        "reserve_health": "healthy" if ok else "critical",
        "notes": [],
        "last_acp_block_height": None,
        "last_bsc_block_number": None,
        "reserve_balance_acp_smallest": 0,
        "backing_ratio": None,
    })

    return payload
