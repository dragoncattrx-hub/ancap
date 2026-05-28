from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AccessGrant,
    AccessScopeEnum,
    LedgerEventTypeEnum,
    Listing,
    ListingStatusEnum,
    Order,
    OrderStatusEnum,
    Strategy,
    Subscription,
    SubscriptionBillingPeriodEnum,
    SubscriptionStatusEnum,
)
from app.services.ledger import append_event, balance_for_account, get_or_create_account
from app.services.notifications import create_notification


_BILLING_PERIOD_DELTAS: dict[SubscriptionBillingPeriodEnum, timedelta] = {
    SubscriptionBillingPeriodEnum.monthly: timedelta(days=30),
    SubscriptionBillingPeriodEnum.quarterly: timedelta(days=90),
    SubscriptionBillingPeriodEnum.annual: timedelta(days=365),
}

_BILLING_PERIOD_LABELS: dict[SubscriptionBillingPeriodEnum, str] = {
    SubscriptionBillingPeriodEnum.monthly: "monthly",
    SubscriptionBillingPeriodEnum.quarterly: "quarterly",
    SubscriptionBillingPeriodEnum.annual: "annual",
}

_RETRY_DELAY = timedelta(days=3)
_MAX_RETRY_COUNT = 3


def _quantize_amount(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.000000000000000001"), rounding=ROUND_HALF_UP)



def _parse_subscription_price(listing: Listing, billing_period: SubscriptionBillingPeriodEnum) -> tuple[Decimal, str]:
    fee_model = listing.fee_model or {}
    if str(fee_model.get("type") or "") != "subscription":
        raise ValueError("Listing does not offer subscriptions")

    period_key = f"subscription_price_{_BILLING_PERIOD_LABELS[billing_period]}"
    price_block = fee_model.get(period_key) or {}
    if not price_block and billing_period == SubscriptionBillingPeriodEnum.monthly:
        price_block = fee_model.get("subscription_price") or fee_model.get("subscription_price_monthly") or {}
    elif not price_block:
        raise ValueError(f"Listing does not offer {billing_period.value} subscriptions")

    try:
        amount = Decimal(str(price_block.get("amount") or "0"))
    except Exception as exc:
        raise ValueError("Listing subscription price is invalid") from exc
    currency = str(price_block.get("currency") or "ACP").upper()
    if amount <= 0:
        raise ValueError("Listing subscription price must be greater than zero")
    if currency != "ACP":
        raise ValueError("Subscriptions currently support ACP only")
    return _quantize_amount(amount), currency


async def subscriptions_tick(session: AsyncSession, *, max_items: int = 500) -> dict:
    now = datetime.now(UTC)
    renewed = 0
    past_due = 0
    paused = 0
    errors = 0

    rows = (
        await session.execute(
            select(Subscription)
            .where(
                Subscription.auto_renew.is_(True),
                Subscription.status.in_([SubscriptionStatusEnum.active, SubscriptionStatusEnum.past_due]),
                Subscription.next_billing_at.is_not(None),
                Subscription.next_billing_at <= now,
            )
            .order_by(Subscription.next_billing_at.asc(), Subscription.created_at.asc())
            .limit(max_items)
        )
    ).scalars().all()

    for sub in rows:
        try:
            billing_period = sub.billing_period
            if not isinstance(billing_period, SubscriptionBillingPeriodEnum):
                billing_period = SubscriptionBillingPeriodEnum(str(billing_period))

            listing = await session.get(Listing, sub.listing_id)
            if listing is None or listing.status != ListingStatusEnum.active:
                sub.status = SubscriptionStatusEnum.paused
                sub.next_billing_at = None
                await create_notification(
                    session,
                    recipient_user_id=sub.user_id,
                    recipient_agent_id=None,
                    type="subscription.paused",
                    priority="high",
                    dedupe_key=f"subscription-paused-listing:{sub.id}",
                    payload={
                        "title": "Subscription paused",
                        "subscription_id": str(sub.id),
                        "listing_id": str(sub.listing_id),
                        "reason": "listing_unavailable",
                    },
                )
                paused += 1
                continue

            amount, currency = _parse_subscription_price(listing, billing_period)
            buyer_account = await get_or_create_account(session, "user", sub.user_id)
            balance = await balance_for_account(session, buyer_account.id, currency)
            available = balance.get(currency) or Decimal(0)

            if available < amount:
                sub.retry_count = int(sub.retry_count or 0) + 1
                if sub.retry_count >= _MAX_RETRY_COUNT:
                    sub.status = SubscriptionStatusEnum.paused
                    sub.next_billing_at = None
                    await create_notification(
                        session,
                        recipient_user_id=sub.user_id,
                        recipient_agent_id=None,
                        type="subscription.paused",
                        priority="high",
                        dedupe_key=f"subscription-paused-balance:{sub.id}",
                        payload={
                            "title": "Subscription paused",
                            "subscription_id": str(sub.id),
                            "listing_id": str(sub.listing_id),
                            "reason": "insufficient_balance",
                            "retry_count": sub.retry_count,
                        },
                    )
                    paused += 1
                else:
                    sub.status = SubscriptionStatusEnum.past_due
                    sub.next_billing_at = now + _RETRY_DELAY
                    await create_notification(
                        session,
                        recipient_user_id=sub.user_id,
                        recipient_agent_id=None,
                        type="payment.low_balance",
                        priority="high",
                        dedupe_key=f"subscription-low-balance:{sub.id}:{sub.retry_count}",
                        payload={
                            "title": "Subscription renewal requires ACP top-up",
                            "subscription_id": str(sub.id),
                            "listing_id": str(sub.listing_id),
                            "attempt": sub.retry_count,
                            "retry_at": sub.next_billing_at.isoformat() if sub.next_billing_at else None,
                        },
                    )
                    past_due += 1
                continue

            seller_account = None
            strategy = await session.get(Strategy, listing.strategy_id) if listing.strategy_id else None
            if strategy is not None and strategy.owner_agent_id:
                seller_account = await get_or_create_account(session, "agent", strategy.owner_agent_id)
                await append_event(
                    session,
                    LedgerEventTypeEnum.transfer,
                    currency,
                    amount,
                    src_account_id=buyer_account.id,
                    dst_account_id=seller_account.id,
                    metadata={
                        "subscription_billing": True,
                        "subscription_id": str(sub.id),
                        "listing_id": str(listing.id),
                        "billing_period": billing_period.value,
                        "renewal": True,
                    },
                )

            order = Order(
                listing_id=listing.id,
                buyer_type="user",
                buyer_id=sub.user_id,
                status=OrderStatusEnum.paid,
                amount_currency=currency,
                amount_value=amount,
                payment_method="subscription",
                note=f"subscription:{billing_period.value}:renewal",
            )
            session.add(order)
            await session.flush()

            next_billing_at = now + _BILLING_PERIOD_DELTAS[billing_period]
            sub.status = SubscriptionStatusEnum.active
            sub.price_acp = amount
            sub.retry_count = 0
            sub.last_order_id = order.id
            sub.next_billing_at = next_billing_at
            session.add(
                AccessGrant(
                    strategy_id=listing.strategy_id,
                    grantee_type="user",
                    grantee_id=sub.user_id,
                    scope=AccessScopeEnum.execute,
                    expires_at=next_billing_at,
                )
            )
            await create_notification(
                session,
                recipient_user_id=sub.user_id,
                recipient_agent_id=None,
                type="subscription.renewed",
                priority="normal",
                dedupe_key=f"subscription-renewed:{sub.id}:{order.id}",
                payload={
                    "title": "Subscription renewed",
                    "subscription_id": str(sub.id),
                    "listing_id": str(sub.listing_id),
                    "order_id": str(order.id),
                    "next_billing_at": next_billing_at.isoformat(),
                    "amount": {"amount": str(amount), "currency": currency},
                },
            )
            renewed += 1
        except Exception:
            errors += 1

    await session.flush()
    return {
        "processed": len(rows),
        "renewed": renewed,
        "past_due": past_due,
        "paused": paused,
        "errors": errors,
        "max_items": max_items,
    }
