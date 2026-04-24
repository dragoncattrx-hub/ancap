from decimal import Decimal
from datetime import datetime, timezone, timedelta
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException, Header

from app.schemas import OrderPlaceRequest, OrderPublic, OrderStatus, Pagination, Money
from app.api.deps import DbSession
from app.config import get_settings
from app.db.models import Order, Listing, OrderStatusEnum, AccessGrant, AccessScopeEnum, Strategy, AgentLink, Agent
from app.services.ledger import get_or_create_account, append_event, balance_for_account
from app.db.models import LedgerEventTypeEnum
from app.constants import ORDER_ESCROW_ACCOUNT_OWNER_ID
from sqlalchemy import select, or_, func
from app.services.ledger import is_ledger_invariant_halted
from app.services.reputation_events import on_order_fulfilled, upsert_edge_daily
from app.db.models import EdgeTypeEnum
from app.services.participation_gates import evaluate_agent_gate

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderPublic, status_code=201)
async def place_order(
    body: OrderPlaceRequest,
    session: DbSession,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Missing Idempotency-Key header")
    from app.services.idempotency import get_idempotency_hit, store_idempotency_result
    hit = await get_idempotency_hit(session, scope="orders.place", key=idempotency_key, request_payload=body.model_dump())
    if hit:
        return hit.response_json
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger invariant violated; operations temporarily blocked")
    q = select(Listing).where(Listing.id == UUID(body.listing_id))
    r = await session.execute(q)
    listing = r.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    strat = await session.get(Strategy, listing.strategy_id)
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")
    owner_agent_id = strat.owner_agent_id
    buyer_id = UUID(body.buyer_id)

    # Anti-self-dealing: buyer must not be owner or linked to owner
    if body.buyer_type == "agent":
        gate = await evaluate_agent_gate(session, buyer_id)
        if not gate.ok:
            raise HTTPException(
                status_code=403,
                detail={
                    "reason_code": gate.reason_code,
                    "message": gate.detail,
                    "metrics": gate.metrics,
                },
            )
        if str(buyer_id) == str(owner_agent_id):
            raise HTTPException(status_code=403, detail="Self-dealing: buyer cannot be strategy owner")
        link_q = select(AgentLink).where(
            or_(
                (AgentLink.agent_id == buyer_id) & (AgentLink.linked_agent_id == owner_agent_id),
                (AgentLink.agent_id == owner_agent_id) & (AgentLink.linked_agent_id == buyer_id),
            ),
            AgentLink.confidence >= 0.8,
        ).limit(1)
        link_r = await session.execute(link_q)
        if link_r.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Self-dealing: buyer is linked to strategy owner")

        # Quarantine: agents created < 24h have a limit on orders per day
        settings = get_settings()
        agent = await session.get(Agent, buyer_id)
        if agent and agent.created_at:
            now_utc = datetime.now(timezone.utc)
            created = agent.created_at
            if getattr(created, "tzinfo", None) is None:
                created = created.replace(tzinfo=timezone.utc)
            if (now_utc - created) < timedelta(hours=settings.quarantine_hours):
                # Count orders by this agent today (UTC)
                today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
                count_q = select(func.count(Order.id)).where(
                    Order.buyer_type == "agent",
                    Order.buyer_id == buyer_id,
                    Order.created_at >= today_start,
                )
                count_r = await session.execute(count_q)
                order_count_today = count_r.scalar() or 0
                if order_count_today >= settings.quarantine_max_orders_per_day:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Quarantine: agent created less than {settings.quarantine_hours}h ago is limited to {settings.quarantine_max_orders_per_day} orders per day",
                    )

    fee = listing.fee_model
    amount_value = fee.get("one_time_price", {}).get("amount") or "0"
    amount_currency = fee.get("one_time_price", {}).get("currency") or "USD"
    # L3: order escrow — buyer -> escrow -> seller (ledger)
    amount_decimal = Decimal(amount_value) if amount_value else Decimal(0)
    if amount_decimal > 0:
        acc_buyer = await get_or_create_account(session, body.buyer_type, buyer_id)
        acc_seller = await get_or_create_account(session, "agent", owner_agent_id)
        acc_escrow = await get_or_create_account(session, "order_escrow", ORDER_ESCROW_ACCOUNT_OWNER_ID)
        bal = await balance_for_account(session, acc_buyer.id, amount_currency)
        if (bal.get(amount_currency) or Decimal(0)) < amount_decimal:
            raise HTTPException(status_code=402, detail="Insufficient balance for order")
        await append_event(
            session,
            LedgerEventTypeEnum.transfer,
            amount_currency,
            amount_decimal,
            src_account_id=acc_buyer.id,
            dst_account_id=acc_escrow.id,
            metadata={"order_escrow": True},
        )
        await append_event(
            session,
            LedgerEventTypeEnum.transfer,
            amount_currency,
            amount_decimal,
            src_account_id=acc_escrow.id,
            dst_account_id=acc_seller.id,
            metadata={"order_settlement": True, "listing_id": str(listing.id)},
        )
    order = Order(
        listing_id=listing.id,
        buyer_type=body.buyer_type,
        buyer_id=UUID(body.buyer_id),
        status=OrderStatusEnum.paid,  # MVP: auto-paid for test
        amount_currency=amount_currency,
        amount_value=amount_value,
        payment_method=body.payment_method,
        note=body.note,
    )
    session.add(order)
    await session.flush()
    grant = AccessGrant(
        strategy_id=listing.strategy_id,
        grantee_type=body.buyer_type,
        grantee_id=UUID(body.buyer_id),
        scope=AccessScopeEnum.execute,
    )
    session.add(grant)
    await session.flush()

    # Reputation 2.0: seller +1.0 (order_fulfilled), edge buyer -> seller
    try:
        await on_order_fulfilled(
            session,
            order_id=order.id,
            buyer_id=buyer_id,
            seller_agent_id=owner_agent_id,
            amount_value=amount_value or "0",
            amount_currency=amount_currency,
            created_at=order.created_at,
        )
        today = datetime.now(timezone.utc).date()
        await upsert_edge_daily(
            session,
            day=today,
            src_type="agent",
            src_id=buyer_id,
            dst_type="agent",
            dst_id=owner_agent_id,
            edge_type=EdgeTypeEnum.order,
            count_delta=1,
            amount_delta=float(amount_value) if amount_value else 0.0,
            unique_ref_id=order.id,
        )
    except Exception:
        pass  # non-fatal: reputation events best-effort

    await session.refresh(order)
    out = OrderPublic(
        id=str(order.id),
        listing_id=str(order.listing_id),
        buyer_type=order.buyer_type,
        buyer_id=str(order.buyer_id),
        status=OrderStatus(order.status.value),
        amount=Money(amount=str(order.amount_value), currency=order.amount_currency or "USD"),
        created_at=order.created_at,
    )
    await store_idempotency_result(
        session,
        scope="orders.place",
        key=idempotency_key,
        request_payload=body.model_dump(),
        status_code=201,
        response_json=out.model_dump(),
    )
    return out


@router.get("", response_model=Pagination[OrderPublic])
async def list_orders(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    buyer_type: str | None = Query(None),
    buyer_id: UUID | None = Query(None),
):
    q = select(Order).order_by(Order.created_at.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(Order.id < UUID(cursor))
        except ValueError:
            pass
    if buyer_type:
        q = q.where(Order.buyer_type == buyer_type)
    if buyer_id:
        q = q.where(Order.buyer_id == buyer_id)
    r = await session.execute(q)
    rows = r.scalars().all()
    next_cursor = str(rows[-1].id) if len(rows) > limit else None
    items = rows[:limit]
    return Pagination(
        items=[
            OrderPublic(
                id=str(o.id),
                listing_id=str(o.listing_id),
                buyer_type=o.buyer_type,
                buyer_id=str(o.buyer_id),
                status=OrderStatus(o.status.value),
                amount=Money(amount=str(o.amount_value), currency=o.amount_currency or "USD") if o.amount_value is not None else None,
                created_at=o.created_at,
            )
            for o in items
        ],
        next_cursor=next_cursor,
    )
