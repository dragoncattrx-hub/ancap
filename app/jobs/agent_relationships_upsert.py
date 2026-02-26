"""
Agent Graph Index (ROADMAP 2.1): incremental fill of agent_relationships from orders.
One row per paid order: source=buyer, target=seller, relation_type=order, weight=amount.
Anti-self-dealing: skip when buyer_id == seller_id.
"""
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, and_, or_, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.jobs.watermark import get_ts_id_watermark, set_ts_id_watermark, TsIdWatermark
from app.db.models import (
    Order,
    OrderStatusEnum,
    Listing,
    Strategy,
    AgentRelationship,
)

WATERMARK_KEY = "agent_relationships_orders_v2"


async def upsert_agent_relationships_from_orders(
    session: AsyncSession,
    batch_size: int = 2000,
    commit: bool = True,
) -> int:
    """
    Incremental: paid Order (buyer -> seller) -> agent_relationships.
    Seller = strategy owner (Order -> Listing -> Strategy -> owner_agent_id).
    Only agent buyers. Skip when buyer_id == seller_id.
    Returns number of orders processed.
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

        if order.buyer_type != "agent" or not order.buyer_id or not owner_agent_id:
            continue
        src_id = order.buyer_id
        dst_id = owner_agent_id
        if src_id == dst_id:
            continue

        weight = float(order.amount_value or 1.0)
        if weight <= 0:
            weight = 1.0

        rel = AgentRelationship(
            source_agent_id=src_id,
            target_agent_id=dst_id,
            relation_type="order",
            weight=weight,
            ref_type="order",
            ref_id=order.id,
        )
        session.add(rel)

    if last_wm:
        await set_ts_id_watermark(session, WATERMARK_KEY, last_wm)

    if commit:
        await session.commit()
    return processed
