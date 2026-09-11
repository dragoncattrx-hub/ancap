"""Exchange-office ticket auth-settle + rail sync.

Closes the ACP-first monetization friction loop for mobile exchange:
quote → ticket → auth-settle (opens linked swap/OTC rail) → sync/complete.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import AcpExchangeTicket, AcpOtcIntakeOrder, AcpSwapOrder


_TERMINAL = frozenset({"completed", "cancelled", "rejected", "expired"})
_SETTLEABLE = frozenset({"opened", "awaiting_user", "pending_review", "settling"})


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _api_str(v: Decimal) -> str:
    s = format(v, "f")
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s or "0"


async def auth_settle_ticket(
    session: AsyncSession,
    ticket: AcpExchangeTicket,
    *,
    user_id: str,
    tron_txid: str | None = None,
) -> AcpExchangeTicket:
    """User confirms settlement intent and opens/links the underlying rail."""
    if str(ticket.user_id) != str(user_id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status in _TERMINAL:
        raise HTTPException(status_code=409, detail=f"Ticket is already {ticket.status}")
    if ticket.status not in _SETTLEABLE:
        raise HTTPException(status_code=409, detail=f"Ticket cannot settle from status {ticket.status}")

    now = _utcnow()
    rail = str(ticket.rail or "")

    if rail == "swap_desk":
        if ticket.from_asset != "usdt_trc20" or ticket.to_asset != "acp":
            raise HTTPException(
                status_code=400,
                detail="auth-settle swap_desk currently supports usdt_trc20 → acp only",
            )
        payout = (ticket.payout_acp_address or "").strip().lower()
        if not payout.startswith("acp1") or len(payout) < 20:
            raise HTTPException(status_code=400, detail="Ticket missing valid payout_acp_address")

        if ticket.rail_ref_type == "swap_order" and ticket.rail_ref_id:
            order = await session.get(AcpSwapOrder, ticket.rail_ref_id)
            if order is None or str(order.user_id) != str(user_id):
                raise HTTPException(status_code=409, detail="Linked swap order missing")
        else:
            settings = get_settings()
            order = AcpSwapOrder(
                id=uuid4(),
                user_id=user_id,
                status="awaiting_deposit",
                usdt_trc20_amount=Decimal(str(ticket.from_amount)),
                rate_acp_per_usdt=(
                    Decimal(str(ticket.acp_hub_amount)) / Decimal(str(ticket.from_amount))
                    if Decimal(str(ticket.from_amount)) > 0
                    else Decimal("1")
                ),
                estimated_acp_amount=Decimal(str(ticket.acp_hub_amount)),
                payout_acp_address=payout,
                deposit_trc20_address=str(
                    getattr(settings, "usdt_trc20_deposit_address", None)
                    or "TNAbqPprJmqRa33UoRvYnUsVfDSgrJc3W1"
                ),
                deposit_reference=ticket.intake_reference or f"XO-{uuid4().hex[:8].upper()}",
                note=f"exchange_ticket:{ticket.id}",
                idempotency_key=f"xo-ticket-{ticket.id}",
            )
            session.add(order)
            await session.flush()
            ticket.rail_ref_type = "swap_order"
            ticket.rail_ref_id = str(order.id)

        if tron_txid:
            order.status = "pending_review"
            order.tron_txid = tron_txid.strip()
            order.updated_at = now
            ticket.status = "pending_review"
            ticket.next_step = (
                f"USDT deposit reported ({tron_txid.strip()[:16]}…). "
                "Desk will credit ACP after confirmation, then call sync."
            )
        else:
            ticket.status = "settling"
            dep = order.deposit_trc20_address or "desk deposit address"
            ticket.next_step = (
                f"Send { _api_str(Decimal(str(ticket.from_amount))) } USDT TRC-20 to {dep} "
                f"with reference {order.deposit_reference}, then confirm txid and sync this ticket."
            )
        ticket.updated_at = now
        await session.flush()
        return ticket

    if rail == "bridge":
        ticket.status = "settling"
        ticket.next_step = (
            "Open Bridge intent (ACP↔wACP) matching this quote, then sync this ticket after intent completes. "
            f"Reference {ticket.intake_reference}."
        )
        ticket.updated_at = now
        await session.flush()
        return ticket

    if rail in ("otc_metal", "otc_goods", "otc_commodity", "otc_real_estate", "otc_space", "otc_ip"):
        ticket.status = "pending_review"
        ticket.next_step = (
            "Physical/title handoff is with the OTC desk. "
            f"Keep reference {ticket.intake_reference}; ticket completes when intake settles."
        )
        ticket.updated_at = now
        await session.flush()
        return ticket

    if rail in ("dex_deep_link", "hub_cross", "fiat_onramp", "stablecoin", "ledger"):
        ticket.status = "settling"
        ticket.next_step = (
            f"Execute rail `{rail}` per quote next_step, then sync or ask desk to complete. "
            f"Reference {ticket.intake_reference}."
        )
        ticket.updated_at = now
        await session.flush()
        return ticket

    raise HTTPException(status_code=400, detail=f"auth-settle not supported for rail {rail}")


async def sync_ticket_from_rail(
    session: AsyncSession,
    ticket: AcpExchangeTicket,
    *,
    user_id: str,
) -> AcpExchangeTicket:
    """Pull linked rail status into the exchange ticket."""
    if str(ticket.user_id) != str(user_id):
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.status in _TERMINAL and ticket.status == "completed":
        return ticket

    now = _utcnow()
    if ticket.rail_ref_type == "swap_order" and ticket.rail_ref_id:
        order = await session.get(AcpSwapOrder, ticket.rail_ref_id)
        if order is None or str(order.user_id) != str(user_id):
            raise HTTPException(status_code=409, detail="Linked swap order missing")
        if order.status == "completed":
            ticket.status = "completed"
            ticket.next_step = "Swap desk credited ACP. Ticket closed."
            ticket.updated_at = now
            await session.flush()
            return ticket
        if order.status in ("cancelled", "rejected"):
            ticket.status = order.status
            ticket.next_step = f"Linked swap order is {order.status}."
            ticket.updated_at = now
            await session.flush()
            return ticket
        if order.status == "pending_review":
            ticket.status = "pending_review"
            ticket.next_step = "Swap order pending desk review."
        elif order.status == "awaiting_deposit":
            ticket.status = "settling"
            ticket.next_step = "Awaiting USDT TRC-20 deposit on swap desk."
        ticket.updated_at = now
        await session.flush()
        return ticket

    if ticket.rail_ref_type == "otc_intake" and ticket.rail_ref_id:
        order = await session.get(AcpOtcIntakeOrder, ticket.rail_ref_id)
        if order is None:
            raise HTTPException(status_code=409, detail="Linked OTC order missing")
        if order.status == "completed":
            ticket.status = "completed"
            ticket.next_step = "OTC intake settled. Ticket closed."
        elif order.status in ("cancelled", "rejected"):
            ticket.status = order.status
            ticket.next_step = f"Linked OTC order is {order.status}."
        else:
            ticket.status = "pending_review"
            ticket.next_step = f"OTC intake status: {order.status}."
        ticket.updated_at = now
        await session.flush()
        return ticket

    raise HTTPException(
        status_code=400,
        detail="No linked rail to sync — call auth-settle first or wait for desk complete",
    )


async def admin_complete_ticket(
    session: AsyncSession,
    ticket: AcpExchangeTicket,
    *,
    note: str | None = None,
) -> AcpExchangeTicket:
    if ticket.status in _TERMINAL and ticket.status != "completed":
        raise HTTPException(status_code=409, detail=f"Cannot complete ticket in status {ticket.status}")
    if ticket.status == "completed":
        return ticket
    ticket.status = "completed"
    extra = (note or "").strip()
    ticket.next_step = "Desk marked settled." + (f" {extra}" if extra else "")
    ticket.updated_at = _utcnow()
    await session.flush()
    return ticket


async def mark_tickets_for_completed_swap(
    session: AsyncSession,
    *,
    swap_order_id: str,
) -> int:
    """When a swap order completes, close linked exchange tickets."""
    rows = (
        await session.execute(
            select(AcpExchangeTicket).where(
                AcpExchangeTicket.rail_ref_type == "swap_order",
                AcpExchangeTicket.rail_ref_id == str(swap_order_id),
                AcpExchangeTicket.status.notin_(list(_TERMINAL)),
            )
        )
    ).scalars().all()
    now = _utcnow()
    for ticket in rows:
        ticket.status = "completed"
        ticket.next_step = "Swap desk credited ACP. Ticket closed."
        ticket.updated_at = now
    if rows:
        await session.flush()
    return len(rows)
