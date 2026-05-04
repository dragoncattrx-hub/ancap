"""wACP / BSC custodial clearing rail HTTP surface (docs/bridge-spec-v1.md)."""
from __future__ import annotations

import re
from decimal import Decimal, ROUND_DOWN
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_auth
from app.config import get_settings
from app.db.models import (
    BridgeAllowlistAddress,
    BridgeAuditEvent,
    BridgeOperation,
    BridgeWatcherCheckpoint,
)
from app.db.session import get_db
from app.schemas.bridge_rail import (
    BridgeAllowlistAddRequest,
    BridgeIntentAcpToBscCreate,
    BridgeOperationPublic,
    BridgeReserveSummaryResponse,
    BridgeStatusResponse,
)
from app.services.bridge_decimal import acp_smallest_to_wacp_wei
from app.services.bridge_reconciliation import run_reconciliation

router = APIRouter(prefix="/bridge", tags=["Bridge (wACP)"])


def _norm_bsc(addr: str) -> str:
    a = addr.strip().lower()
    if not re.fullmatch(r"0x[a-f0-9]{40}", a):
        raise HTTPException(status_code=400, detail="Invalid BSC address (expected 0x + 40 hex)")
    return a


async def _allowlist_allows(session: AsyncSession, bsc_norm: str) -> bool:
    total = (
        await session.scalar(select(func.count()).select_from(BridgeAllowlistAddress))
    ) or 0
    if int(total) == 0:
        return True
    hit = await session.scalar(
        select(BridgeAllowlistAddress.id).where(BridgeAllowlistAddress.bsc_address == bsc_norm)
    )
    return hit is not None


@router.get("/status", response_model=BridgeStatusResponse)
async def bridge_status(session: AsyncSession = Depends(get_db)):
    s = get_settings()
    counts: dict[str, int] = {}
    if s.bridge_rail_enabled:
        rows = await session.execute(
            select(BridgeOperation.status, func.count())
            .group_by(BridgeOperation.status)
        )
        for st, c in rows.all():
            counts[str(st)] = int(c)

    cp_acp = await session.get(BridgeWatcherCheckpoint, "acp")
    cp_bsc = await session.get(BridgeWatcherCheckpoint, "bsc")
    last_recon = None
    if s.bridge_rail_enabled:
        r = await session.execute(
            select(BridgeAuditEvent.payload_json)
            .where(BridgeAuditEvent.event_type.in_(("reconciliation_ok", "reconciliation_mismatch")))
            .order_by(BridgeAuditEvent.created_at.desc())
            .limit(1)
        )
        row = r.first()
        if row:
            last_recon = row[0]

    return BridgeStatusResponse(
        bridge_rail_enabled=s.bridge_rail_enabled,
        bridge_rail_paused=s.bridge_rail_paused,
        dry_run=s.bridge_dry_run,
        wacp_contract=s.bridge_wacp_contract,
        gateway_contract=s.bridge_gateway_contract,
        reserve_acp_address=s.bridge_reserve_acp_address,
        confirmations_acp=s.bridge_acp_confirmations,
        confirmations_bsc=s.bridge_bsc_confirmations,
        bsc_explorer_base=s.bsc_explorer_base,
        acp_explorer_tx_base=s.acp_explorer_tx_base,
        counts_by_status=counts,
        checkpoint_acp=int(cp_acp.last_block_height) if cp_acp else None,
        checkpoint_bsc=int(cp_bsc.last_block_height) if cp_bsc else None,
        last_reconciliation=last_recon,
    )


@router.get("/reserve-summary", response_model=BridgeReserveSummaryResponse)
async def bridge_reserve_summary(session: AsyncSession = Depends(get_db)):
    s = get_settings()
    if not s.bridge_rail_enabled:
        raise HTTPException(status_code=503, detail="Bridge rail is disabled")

    pending = await session.scalar(
        select(func.count())
        .select_from(BridgeOperation)
        .where(
            BridgeOperation.direction == "acp_to_bsc",
            BridgeOperation.status != "COMPLETED",
        )
    )
    completed = await session.scalar(
        select(func.count())
        .select_from(BridgeOperation)
        .where(
            BridgeOperation.direction == "acp_to_bsc",
            BridgeOperation.status == "COMPLETED",
        )
    )
    total_acp = await session.scalar(
        select(func.coalesce(func.sum(BridgeOperation.amount_acp_smallest), 0)).where(
            BridgeOperation.direction == "acp_to_bsc",
        )
    )
    total_wacp = await session.scalar(
        select(func.coalesce(func.sum(BridgeOperation.amount_wacp_wei), 0)).where(
            BridgeOperation.direction == "acp_to_bsc",
            BridgeOperation.status == "COMPLETED",
        )
    )
    return BridgeReserveSummaryResponse(
        total_acp_smallest_locked_intent=str(int(total_acp or 0)),
        total_wacp_wei_completed_mints=str(int(total_wacp or 0)),
        operations_pending=int(pending or 0),
        operations_completed=int(completed or 0),
    )


@router.post("/intents/acp-to-bsc", response_model=BridgeOperationPublic)
async def create_intent_acp_to_bsc(
    body: BridgeIntentAcpToBscCreate,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    s = get_settings()
    if not s.bridge_rail_enabled:
        raise HTTPException(status_code=503, detail="Bridge rail is disabled")
    if s.bridge_rail_paused:
        raise HTTPException(status_code=503, detail="Bridge rail is paused")

    bsc = _norm_bsc(body.user_bsc_address)
    if not await _allowlist_allows(session, bsc):
        raise HTTPException(status_code=403, detail="BSC address not on bridge allowlist")

    try:
        raw = Decimal(str(body.amount_acp).strip())
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid amount_acp") from exc
    if raw <= 0:
        raise HTTPException(status_code=400, detail="amount_acp must be positive")
    smallest = int((raw * Decimal(10) ** 8).to_integral_value(rounding=ROUND_DOWN))
    if smallest <= 0:
        raise HTTPException(status_code=400, detail="amount too small after 8dp quantization")
    wacp_wei = acp_smallest_to_wacp_wei(smallest)

    op = BridgeOperation(
        id=uuid4(),
        user_id=UUID(user_id),
        direction="acp_to_bsc",
        status="PENDING_DEPOSIT",
        user_bsc_address=bsc,
        user_acp_address=(body.user_acp_address or "").strip() or None,
        amount_acp_smallest=smallest,
        amount_wacp_wei=wacp_wei,
        remainder_wacp_wei=0,
    )
    session.add(op)
    session.add(
        BridgeAuditEvent(
            operation_id=op.id,
            event_type="intent_created",
            payload_json={"direction": "acp_to_bsc", "amount_acp_smallest": smallest},
        )
    )
    await session.flush()
    await session.refresh(op)
    return BridgeOperationPublic(
        id=str(op.id),
        direction=op.direction,
        status=op.status,
        user_bsc_address=op.user_bsc_address,
        user_acp_address=op.user_acp_address,
        amount_acp_smallest=str(op.amount_acp_smallest),
        amount_wacp_wei=str(op.amount_wacp_wei),
        created_at=op.created_at,
    )


@router.get("/intents/me", response_model=list[BridgeOperationPublic])
async def list_my_intents(
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    s = get_settings()
    if not s.bridge_rail_enabled:
        raise HTTPException(status_code=503, detail="Bridge rail is disabled")
    lim = max(1, min(limit, 200))
    r = await session.execute(
        select(BridgeOperation)
        .where(BridgeOperation.user_id == UUID(user_id))
        .order_by(BridgeOperation.created_at.desc())
        .limit(lim)
    )
    out: list[BridgeOperationPublic] = []
    for op in r.scalars().all():
        out.append(
            BridgeOperationPublic(
                id=str(op.id),
                direction=op.direction,
                status=op.status,
                user_bsc_address=op.user_bsc_address,
                user_acp_address=op.user_acp_address,
                amount_acp_smallest=str(op.amount_acp_smallest),
                amount_wacp_wei=str(op.amount_wacp_wei),
                created_at=op.created_at,
            )
        )
    return out


@router.post("/admin/reconcile", response_model=dict)
async def admin_reconcile(
    session: AsyncSession = Depends(get_db),
    x_bridge_operator_secret: str | None = Header(None, alias="X-Bridge-Operator-Secret"),
):
    s = get_settings()
    if not s.bridge_rail_enabled:
        raise HTTPException(status_code=503, detail="Bridge rail is disabled")
    secret = (s.bridge_operator_secret or "").strip()
    if not secret or (x_bridge_operator_secret or "").strip() != secret:
        raise HTTPException(status_code=403, detail="Invalid bridge operator secret")
    return await run_reconciliation(session)


@router.post("/admin/allowlist", response_model=dict)
async def admin_allowlist_add(
    body: BridgeAllowlistAddRequest,
    session: AsyncSession = Depends(get_db),
    x_bridge_operator_secret: str | None = Header(None, alias="X-Bridge-Operator-Secret"),
):
    s = get_settings()
    secret = (s.bridge_operator_secret or "").strip()
    if not secret or (x_bridge_operator_secret or "").strip() != secret:
        raise HTTPException(status_code=403, detail="Invalid bridge operator secret")
    bsc = _norm_bsc(body.bsc_address)
    dup = await session.scalar(
        select(BridgeAllowlistAddress.id).where(BridgeAllowlistAddress.bsc_address == bsc)
    )
    if dup is not None:
        raise HTTPException(status_code=409, detail="Allowlist entry already exists")
    row = BridgeAllowlistAddress(id=uuid4(), bsc_address=bsc, note=body.note)
    session.add(row)
    await session.flush()
    return {"ok": True, "bsc_address": bsc}
