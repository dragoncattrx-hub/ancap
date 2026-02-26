"""
Incremental aggregation of Order (buyer -> seller) into relationship_edges_daily.
Watermark v2: (created_at, id) — stable for UUID PK. ASC order: next batch after watermark.
Anti-self-dealing: skip edge when buyer_id == seller_id (same agent); extend with owner_user_id when available.
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import select, and_, or_, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.jobs.watermark import get_ts_id_watermark, set_ts_id_watermark, TsIdWatermark
from app.db.models import (
    Order,
    OrderStatusEnum,
    Listing,
    Strategy,
    RelationshipEdgeDaily,
)
from app.db.models import EdgeTypeEnum

WATERMARK_KEY = "edges_daily_orders_v2"


async def upsert_edges_daily_from_orders(
    session: AsyncSession,
    batch_size: int = 2000,
    commit: bool = True,
) -> int:
    """
    Incremental aggregation: Order buyer -> seller into relationship_edges_daily.
    Seller = strategy owner (Order -> Listing -> Strategy -> owner_agent_id).
    Only orders with status paid. Watermark by (created_at, id); filter:
      created_at > wm.ts OR (created_at == wm.ts AND id > wm.id)
    with ASC order. Returns number of orders processed.
    """
    wm = await get_ts_id_watermark(session, WATERMARK_KEY)

    q = (
        select(Order, Strategy.owner_agent_id)
        .join(Listing, Order.listing_id == Listing.id)
        .join(Strategy, Listing.strategy_id == Strategy.id)
        .where(Order.status == OrderStatusEnum.paid)
        .order_by(asc(Order.created_at), asc(Order.id))
        .limit(batch_size)
    )
    if wm:
        q = q.where(
            or_(
                Order.created_at > wm.ts,
                and_(Order.created_at == wm.ts, Order.id > UUID(wm.id)),
            )
        )

    r = await session.execute(q)
    rows = r.all()
    if not rows:
        return 0

    processed = 0
    last_wm: TsIdWatermark | None = None

    for order, owner_agent_id in rows:
        processed += 1
        last_wm = TsIdWatermark(ts=order.created_at, id=str(order.id))

        d = order.created_at.date() if order.created_at else date.today()
        src_id = order.buyer_id
        dst_id = owner_agent_id
        if order.buyer_type != "agent" or not dst_id:
            continue
        # Anti-self-dealing: same agent buying from self (e.g. own listing) -> skip
        if src_id == dst_id:
            continue
        # Optional: if Agent.owner_user_id exists, skip when buyer_owner == seller_owner
        # if buyer_owner_id == seller_owner_id: continue

        amount = float(order.amount_value or 0.0)
        meta = {}
        if order.amount_currency:
            meta["currency"] = order.amount_currency

        stmt = insert(RelationshipEdgeDaily).values(
            day=d,
            src_type="agent",
            src_id=src_id,
            dst_type="agent",
            dst_id=dst_id,
            edge_type=EdgeTypeEnum.order.value,
            count=1,
            amount_sum=amount,
            unique_refs=1,
            meta=meta,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["day", "src_type", "src_id", "dst_type", "dst_id", "edge_type"],
            set_={
                "count": RelationshipEdgeDaily.count + 1,
                "amount_sum": (RelationshipEdgeDaily.amount_sum or 0) + amount,
                "unique_refs": RelationshipEdgeDaily.unique_refs + 1,
            },
        )
        await session.execute(stmt)

    if last_wm:
        await set_ts_id_watermark(session, WATERMARK_KEY, last_wm)

    if commit:
        await session.commit()
    return processed
