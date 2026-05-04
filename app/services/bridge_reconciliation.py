"""Off-chain reconciliation for wACP clearing rail (docs/bridge-spec-v1.md)."""
from __future__ import annotations

import logging
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation
from app.services.bridge_decimal import _SCALE


_REVERSE_LIABILITY_STATUSES = ("BURN_CONFIRMED", "ACP_PAYOUT_SENT", "DISPUTED")

logger = logging.getLogger(__name__)


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
    return payload
