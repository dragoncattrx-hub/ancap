from decimal import Decimal, InvalidOperation
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from app.api.deps import DbSession, require_auth
from app.db.models import ChainReceipt, SettlementIntent
from app.schemas.common import Pagination
from app.schemas.settlements import (
    ChainReceiptPublic,
    SettlementIntentCreateRequest,
    SettlementIntentPublic,
)
from app.services.settlements import build_correlation_id, execute_settlement_intent


router = APIRouter(prefix="/settlements", tags=["Settlements"])


def _intent_public(row: SettlementIntent) -> SettlementIntentPublic:
    return SettlementIntentPublic(
        id=str(row.id),
        intent_type=row.intent_type,
        source_owner_type=row.source_owner_type,
        source_owner_id=str(row.source_owner_id),
        target_owner_type=row.target_owner_type,
        target_owner_id=str(row.target_owner_id),
        amount_currency=row.amount_currency,
        amount_value=str(row.amount_value),
        status=row.status,
        correlation_id=row.correlation_id,
        metadata_json=row.metadata_json,
        error_message=row.error_message,
        executed_at=row.executed_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _receipt_public(row: ChainReceipt) -> ChainReceiptPublic:
    return ChainReceiptPublic(
        id=str(row.id),
        settlement_intent_id=str(row.settlement_intent_id),
        chain_id=row.chain_id,
        tx_hash=row.tx_hash,
        node_signature=row.node_signature,
        node_public_key=row.node_public_key,
        status=row.status,
        correlation_id=row.correlation_id,
        payload_hash=row.payload_hash,
        receipt_json=row.receipt_json,
        error_message=row.error_message,
        finalized_at=row.finalized_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@router.post("/intents", response_model=SettlementIntentPublic, status_code=201)
async def create_settlement_intent(
    body: SettlementIntentCreateRequest,
    session: DbSession,
    _user_id: str = Depends(require_auth),
):
    correlation_id = build_correlation_id(body.correlation_id)
    existing = (
        await session.execute(
            select(SettlementIntent).where(SettlementIntent.correlation_id == correlation_id).limit(1)
        )
    ).scalar_one_or_none()
    if existing:
        return _intent_public(existing)

    try:
        amount_value = Decimal(body.amount_value)
        source_owner_id = UUID(body.source_owner_id)
        target_owner_id = UUID(body.target_owner_id)
    except (InvalidOperation, ValueError):
        raise HTTPException(status_code=400, detail="Invalid amount_value/source_owner_id/target_owner_id")
    if amount_value <= 0:
        raise HTTPException(status_code=400, detail="amount_value must be positive")

    intent = SettlementIntent(
        intent_type=body.intent_type,
        source_owner_type=body.source_owner_type,
        source_owner_id=source_owner_id,
        target_owner_type=body.target_owner_type,
        target_owner_id=target_owner_id,
        amount_currency=body.amount_currency.upper(),
        amount_value=amount_value,
        correlation_id=correlation_id,
        metadata_json=body.metadata_json,
    )
    session.add(intent)
    await session.flush()
    await execute_settlement_intent(session, intent)
    await session.refresh(intent)
    return _intent_public(intent)


@router.get("/intents", response_model=Pagination[SettlementIntentPublic])
async def list_settlement_intents(
    session: DbSession,
    status: str | None = Query(None),
    intent_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    q = select(SettlementIntent).order_by(SettlementIntent.created_at.desc()).limit(limit)
    if status:
        q = q.where(SettlementIntent.status == status)
    if intent_type:
        q = q.where(SettlementIntent.intent_type == intent_type)
    rows = (await session.execute(q)).scalars().all()
    return Pagination(items=[_intent_public(r) for r in rows], next_cursor=None)


@router.get("/receipts", response_model=Pagination[ChainReceiptPublic])
async def list_chain_receipts(
    session: DbSession,
    settlement_intent_id: UUID | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    q = select(ChainReceipt).order_by(ChainReceipt.created_at.desc()).limit(limit)
    if settlement_intent_id:
        q = q.where(ChainReceipt.settlement_intent_id == settlement_intent_id)
    if status:
        q = q.where(ChainReceipt.status == status)
    rows = (await session.execute(q)).scalars().all()
    return Pagination(items=[_receipt_public(r) for r in rows], next_cursor=None)
