from __future__ import annotations

import re
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select

from app.api.deps import DbSession, require_auth
from app.db.models import (
    Agent,
    Listing,
    ListingStatusEnum,
    Order,
    OrderStatusEnum,
    PayoutRequest,
    PayoutRequestStatusEnum,
    Strategy,
)
from app.schemas import (
    CreatorConversionCountsPublic,
    CreatorConversionPeriodPublic,
    CreatorConversionsSummaryPublic,
    CreatorEarningsPeriodPublic,
    CreatorEarningsSummaryPublic,
    CreatorEarningsWorkflowBreakdownPublic,
    CreatorListingConversionPublic,
)

router = APIRouter(prefix="/creators", tags=["Creators"])

_SLUG_RE = re.compile(r"[^a-z0-9]+")
_ZERO = Decimal("0")


def _as_decimal(value: object) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if value is None:
        return _ZERO
    return Decimal(str(value))


def _normalize_currency(value: str | None) -> str:
    return (value or "").strip().upper()


def _category_from_tags(tags: object) -> str:
    if isinstance(tags, list):
        for item in tags:
            text = str(item or "").strip()
            if text:
                return text
    return "uncategorized"


def _workflow_slug(title: str, strategy_id: str) -> str:
    normalized = _SLUG_RE.sub("-", (title or "").strip().lower()).strip("-")
    return normalized or strategy_id


def _coerce_day(value: datetime | None) -> date | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.date()
    return value.astimezone(UTC).date()


async def _creator_listing_inventory(session: DbSession, user_id: str) -> list[dict[str, object]]:
    owner_user_id = UUID(user_id)
    agent_ids = [
        str(row[0])
        for row in (
            await session.execute(select(Agent.id).where(Agent.owner_user_id == owner_user_id))
        ).all()
    ]
    if not agent_ids:
        return []

    rows = (
        await session.execute(
            select(Listing, Strategy)
            .join(Strategy, Strategy.id == Listing.strategy_id)
            .where(Strategy.owner_agent_id.in_(agent_ids))
            .order_by(Listing.created_at.asc())
        )
    ).all()

    inventory: list[dict[str, object]] = []
    for listing, strategy in rows:
        strategy_id = str(strategy.id)
        title = str(strategy.name)
        inventory.append(
            {
                "listing_id": str(listing.id),
                "strategy_id": strategy_id,
                "title": title,
                "workflow_slug": _workflow_slug(title, strategy_id),
                "category": _category_from_tags(strategy.tags),
                "status": listing.status.value if hasattr(listing.status, "value") else str(listing.status),
            }
        )
    return inventory


@router.get("/me/earnings", response_model=CreatorEarningsSummaryPublic)
async def get_my_creator_earnings(
    session: DbSession,
    user_id: str = Depends(require_auth),
    days: int = Query(default=30, ge=1, le=365),
):
    now = datetime.now(UTC)
    since = now - timedelta(days=days)
    inventory = await _creator_listing_inventory(session, user_id)
    listing_ids = [str(item["listing_id"]) for item in inventory]
    listing_meta = {str(item["listing_id"]): item for item in inventory}
    active_listing_count = sum(1 for item in inventory if item["status"] == ListingStatusEnum.active.value)

    total_earnings = _ZERO
    window_earnings = _ZERO
    pending_payout = _ZERO
    paid_out = _ZERO
    completed_order_count = 0

    workflow_totals: dict[str, dict[str, object]] = {}
    period_totals: dict[date, dict[str, Decimal | int]] = defaultdict(
        lambda: {
            "earned_acp": _ZERO,
            "payout_requested_acp": _ZERO,
            "payout_completed_acp": _ZERO,
            "completed_orders": 0,
        }
    )

    if listing_ids:
        orders = (
            await session.execute(
                select(Order)
                .where(
                    Order.listing_id.in_(listing_ids),
                    Order.status == OrderStatusEnum.paid,
                )
                .order_by(Order.created_at.asc())
            )
        ).scalars().all()
        for row in orders:
            currency = _normalize_currency(row.amount_currency)
            amount = _as_decimal(row.amount_value)
            listing_id = str(row.listing_id)
            meta = listing_meta.get(listing_id)
            if meta is None:
                continue
            if currency == "ACP":
                total_earnings += amount
            if row.created_at >= since:
                completed_order_count += 1
                period_day = _coerce_day(row.created_at)
                if period_day is not None:
                    period_totals[period_day]["completed_orders"] = int(period_totals[period_day]["completed_orders"]) + 1
                if currency != "ACP":
                    continue
                window_earnings += amount
                if period_day is not None:
                    period_totals[period_day]["earned_acp"] = _as_decimal(period_totals[period_day]["earned_acp"]) + amount
                bucket = workflow_totals.setdefault(
                    str(meta["strategy_id"]),
                    {
                        "strategy_id": str(meta["strategy_id"]),
                        "workflow_slug": str(meta["workflow_slug"]),
                        "title": str(meta["title"]),
                        "category": str(meta["category"]),
                        "captured_amount_acp": _ZERO,
                        "order_count": 0,
                        "latest_order_at": None,
                    },
                )
                bucket["captured_amount_acp"] = _as_decimal(bucket["captured_amount_acp"]) + amount
                bucket["order_count"] = int(bucket["order_count"]) + 1
                latest_order_at = bucket.get("latest_order_at")
                if latest_order_at is None or row.created_at > latest_order_at:
                    bucket["latest_order_at"] = row.created_at

    payout_rows = (
        await session.execute(
            select(PayoutRequest)
            .where(PayoutRequest.user_id == UUID(user_id))
            .order_by(PayoutRequest.created_at.asc())
        )
    ).scalars().all()
    for row in payout_rows:
        if _normalize_currency(row.amount_currency) != "ACP":
            continue
        amount = _as_decimal(row.amount_value)
        status_value = row.status.value if hasattr(row.status, "value") else str(row.status)
        if status_value in {PayoutRequestStatusEnum.pending.value, PayoutRequestStatusEnum.approved.value}:
            pending_payout += amount
        if status_value == PayoutRequestStatusEnum.completed.value:
            paid_out += amount
        created_day = _coerce_day(row.created_at)
        if row.created_at >= since and created_day is not None:
            period_totals[created_day]["payout_requested_acp"] = _as_decimal(period_totals[created_day]["payout_requested_acp"]) + amount
        processed_day = _coerce_day(row.processed_at)
        if status_value == PayoutRequestStatusEnum.completed.value and row.processed_at and row.processed_at >= since and processed_day is not None:
            period_totals[processed_day]["payout_completed_acp"] = _as_decimal(period_totals[processed_day]["payout_completed_acp"]) + amount

    earnings_by_workflow = [
        CreatorEarningsWorkflowBreakdownPublic(
            strategy_id=str(item["strategy_id"]),
            workflow_slug=str(item["workflow_slug"]),
            title=str(item["title"]),
            category=str(item["category"]),
            captured_amount_acp=str(_as_decimal(item["captured_amount_acp"])),
            order_count=int(item["order_count"]),
            latest_order_at=item["latest_order_at"],
        )
        for item in sorted(
            workflow_totals.values(),
            key=lambda current: (
                _as_decimal(current["captured_amount_acp"]),
                int(current["order_count"]),
                current["title"],
            ),
            reverse=True,
        )
    ]

    earnings_by_period = [
        CreatorEarningsPeriodPublic(
            period_start=period_day,
            earned_acp=str(_as_decimal(values["earned_acp"])),
            payout_requested_acp=str(_as_decimal(values["payout_requested_acp"])),
            payout_completed_acp=str(_as_decimal(values["payout_completed_acp"])),
            completed_orders=int(values["completed_orders"]),
        )
        for period_day, values in sorted(period_totals.items(), key=lambda item: item[0])
    ]

    return CreatorEarningsSummaryPublic(
        generated_at=now,
        since=since,
        window_days=days,
        total_earnings_acp=str(total_earnings),
        window_earnings_acp=str(window_earnings),
        pending_payout_acp=str(pending_payout),
        paid_out_acp=str(paid_out),
        active_listing_count=active_listing_count,
        completed_order_count=completed_order_count,
        conversion_rate=None,
        conversion_rate_basis="awaiting_checkout_funnel_instrumentation",
        earnings_by_workflow=earnings_by_workflow,
        earnings_by_period=earnings_by_period,
    )


@router.get("/me/conversions", response_model=CreatorConversionsSummaryPublic)
async def get_my_creator_conversions(
    session: DbSession,
    user_id: str = Depends(require_auth),
    days: int = Query(default=30, ge=1, le=365),
):
    now = datetime.now(UTC)
    since = now - timedelta(days=days)
    inventory = await _creator_listing_inventory(session, user_id)
    listing_ids = [str(item["listing_id"]) for item in inventory]

    listing_counts: dict[str, CreatorConversionCountsPublic] = {
        str(item["listing_id"]): CreatorConversionCountsPublic() for item in inventory
    }
    totals = CreatorConversionCountsPublic()
    period_counts: dict[date, CreatorConversionCountsPublic] = defaultdict(CreatorConversionCountsPublic)

    if listing_ids:
        orders = (
            await session.execute(
                select(Order)
                .where(
                    Order.listing_id.in_(listing_ids),
                    Order.status == OrderStatusEnum.paid,
                    Order.created_at >= since,
                )
                .order_by(Order.created_at.asc())
            )
        ).scalars().all()
        for row in orders:
            listing_id = str(row.listing_id)
            counts = listing_counts.setdefault(listing_id, CreatorConversionCountsPublic())
            counts.completed += 1
            totals.completed += 1
            period_day = _coerce_day(row.created_at)
            if period_day is not None:
                period_counts[period_day].completed += 1

    listing_items = [
        CreatorListingConversionPublic(
            listing_id=str(item["listing_id"]),
            strategy_id=str(item["strategy_id"]),
            title=str(item["title"]),
            category=str(item["category"]),
            counts=listing_counts.get(str(item["listing_id"]), CreatorConversionCountsPublic()),
        )
        for item in inventory
    ]

    periods = [
        CreatorConversionPeriodPublic(period_start=period_day, counts=counts)
        for period_day, counts in sorted(period_counts.items(), key=lambda item: item[0])
    ]

    return CreatorConversionsSummaryPublic(
        generated_at=now,
        since=since,
        window_days=days,
        totals=totals,
        listings=listing_items,
        periods=periods,
    )
