"""Off-chain reconciliation for wACP clearing rail (docs/bridge-spec-v1.md)."""
from __future__ import annotations

import logging
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation
from app.services.bridge_decimal import _SCALE

logger = logging.getLogger(__name__)


async def run_reconciliation(session: AsyncSession) -> dict:
    """Compare implied wACP from summed ACP smallest units vs recorded wACP wei for completed ACP→BSC ops."""
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
    payload = {
        "total_acp_smallest": total_acp_smallest,
        "total_wacp_wei": total_wacp_wei,
        "implied_wacp_wei_from_acp": implied_wacp,
        "delta_wacp_wei": delta,
        "ok": ok,
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
