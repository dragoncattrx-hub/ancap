from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException

from app.schemas import (
    DepositRequest,
    WithdrawRequest,
    AllocateRequest,
    LedgerEventPublic,
    LedgerEventType,
    LedgerAccountPublic,
    BalanceResponse,
    Money,
    Pagination,
    BalanceItem,
)
from app.api.deps import DbSession
from app.db.models import LedgerEvent, LedgerEventTypeEnum, Account
from app.services.ledger import get_or_create_account, append_event, balance_for_account, is_ledger_invariant_halted
from sqlalchemy import select

router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.get("/accounts", response_model=Pagination[LedgerAccountPublic])
async def list_accounts(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    owner_type: str | None = Query(None),
    owner_id: UUID | None = Query(None),
):
    q = select(Account).order_by(Account.created_at.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(Account.id < UUID(cursor))
        except ValueError:
            pass
    if owner_type:
        q = q.where(Account.owner_type == owner_type)
    if owner_id:
        q = q.where(Account.owner_id == owner_id)
    r = await session.execute(q)
    rows = r.scalars().all()
    next_cursor = str(rows[-1].id) if len(rows) > limit else None
    items = rows[:limit]
    return Pagination(
        items=[
            LedgerAccountPublic(
                id=str(a.id),
                owner_type=a.owner_type,
                owner_id=str(a.owner_id),
                account_kind=a.account_kind,
                created_at=a.created_at,
            )
            for a in items
        ],
        next_cursor=next_cursor,
    )


@router.get("/accounts/{account_id}", response_model=LedgerAccountPublic)
async def get_account(account_id: UUID, session: DbSession):
    acc = await session.get(Account, account_id)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return LedgerAccountPublic(
        id=str(acc.id),
        owner_type=acc.owner_type,
        owner_id=str(acc.owner_id),
        account_kind=acc.account_kind,
        created_at=acc.created_at,
    )


@router.post("/deposit", response_model=LedgerEventPublic, status_code=201)
async def deposit(body: DepositRequest, session: DbSession):
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger invariant violated; operations temporarily blocked")
    acc = await get_or_create_account(session, body.account_owner_type, UUID(body.account_owner_id))
    value = Decimal(body.amount.amount)
    ev = await append_event(
        session,
        LedgerEventTypeEnum.deposit,
        body.amount.currency,
        value,
        dst_account_id=acc.id,
        metadata={"reference": body.reference} if body.reference else None,
    )
    return LedgerEventPublic(
        id=str(ev.id),
        ts=ev.ts,
        type=LedgerEventType(ev.type.value),
        amount=Money(amount=str(ev.amount_value), currency=ev.amount_currency),
        src_account_id=None,
        dst_account_id=str(ev.dst_account_id),
        metadata=ev.metadata_,
    )


@router.post("/withdraw", response_model=LedgerEventPublic, status_code=201)
async def withdraw(body: WithdrawRequest, session: DbSession):
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger invariant violated; operations temporarily blocked")
    acc = await get_or_create_account(session, body.account_owner_type, UUID(body.account_owner_id))
    value = -Decimal(body.amount.amount)
    ev = await append_event(
        session,
        LedgerEventTypeEnum.withdraw,
        body.amount.currency,
        value,
        src_account_id=acc.id,
        metadata={"reference": body.reference} if body.reference else None,
    )
    return LedgerEventPublic(
        id=str(ev.id),
        ts=ev.ts,
        type=LedgerEventType(ev.type.value),
        amount=Money(amount=str(ev.amount_value), currency=ev.amount_currency),
        src_account_id=str(ev.src_account_id),
        dst_account_id=None,
        metadata=ev.metadata_,
    )


@router.post("/allocate", response_model=LedgerEventPublic, status_code=201)
async def allocate(body: AllocateRequest, session: DbSession):
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger invariant violated; operations temporarily blocked")
    from app.db.models import Pool, Account
    q = select(Pool).where(Pool.id == UUID(body.pool_id))
    r = await session.execute(q)
    pool = r.scalar_one_or_none()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    pool_acc = await get_or_create_account(session, "pool_treasury", pool.id)
    value = Decimal(body.amount.amount)
    ev = await append_event(
        session,
        LedgerEventTypeEnum.allocate,
        body.amount.currency,
        value,
        src_account_id=pool_acc.id,
        metadata={"strategy_id": body.strategy_id, "run_params": body.run_params},
    )
    return LedgerEventPublic(
        id=str(ev.id),
        ts=ev.ts,
        type=LedgerEventType(ev.type.value),
        amount=Money(amount=str(ev.amount_value), currency=ev.amount_currency),
        src_account_id=str(ev.src_account_id),
        dst_account_id=str(ev.dst_account_id) if ev.dst_account_id else None,
        metadata=ev.metadata_,
    )


@router.get("/events", response_model=Pagination[LedgerEventPublic])
async def list_events(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    account_id: UUID | None = Query(None),
    type: LedgerEventType | None = Query(None),
):
    q = select(LedgerEvent).order_by(LedgerEvent.ts.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(LedgerEvent.id < UUID(cursor))
        except ValueError:
            pass
    if account_id:
        q = q.where((LedgerEvent.src_account_id == account_id) | (LedgerEvent.dst_account_id == account_id))
    if type:
        q = q.where(LedgerEvent.type == type.value)
    r = await session.execute(q)
    rows = r.scalars().all()
    next_cursor = str(rows[-1].id) if len(rows) > limit else None
    items = rows[:limit]
    return Pagination(
        items=[
            LedgerEventPublic(
                id=str(e.id),
                ts=e.ts,
                type=LedgerEventType(e.type.value),
                amount=Money(amount=str(e.amount_value), currency=e.amount_currency),
                src_account_id=str(e.src_account_id) if e.src_account_id else None,
                dst_account_id=str(e.dst_account_id) if e.dst_account_id else None,
                metadata=e.metadata_,
            )
            for e in items
        ],
        next_cursor=next_cursor,
    )


@router.get("/balance", response_model=BalanceResponse)
async def get_balance(
    session: DbSession,
    owner_type: str,
    owner_id: UUID,
):
    acc = await get_or_create_account(session, owner_type, owner_id)
    balances = await balance_for_account(session, acc.id)
    return BalanceResponse(
        account_id=str(acc.id),
        balances=[BalanceItem(currency=c, amount=str(v)) for c, v in balances.items()],
    )
