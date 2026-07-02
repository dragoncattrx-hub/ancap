"""Project treasury: unified view of platform money.

Two layers:
- On-chain ACP wallet (settings.project_treasury_acp_address) — real coins.
  Seed/keystore are operator-held (Sicret storage), never in the repo or DB.
- Internal ledger platform account (owner_type=system) — all platform fees
  are credited here (revenue) and platform payouts are debited from here
  (referral bonuses, staking rewards, faucet) — i.e. expenses.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import String, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.constants import PLATFORM_ACCOUNT_OWNER_ID
from app.db.models import Account, LedgerEvent
from app.services.acp_wallet import _run_walletd
from app.services.ledger import balance_for_account

_Q = Decimal("0.00000001")


def onchain_treasury_balance() -> dict:
    settings = get_settings()
    address = (settings.project_treasury_acp_address or "").strip()
    result = {
        "address": address,
        "balance_acp": "0",
        "balance_units": "0",
        "utxo_count": 0,
        "rpc_ok": False,
        "error": None,
    }
    if not address:
        result["error"] = "project_treasury_acp_address is not configured"
        return result
    rpc_url = (settings.acp_rpc_url or "").strip()
    if not rpc_url:
        result["error"] = "ACP RPC URL is not configured"
        return result
    try:
        payload = _run_walletd(["balance", "--rpc", rpc_url, "--address", address], timeout_s=30)
        result["balance_acp"] = str(payload.get("acp") or "0")
        result["balance_units"] = str(payload.get("units") or "0")
        result["utxo_count"] = int(payload.get("utxo_count") or 0)
        result["rpc_ok"] = True
    except Exception as exc:
        result["error"] = str(exc)[:200]
    return result


async def _platform_account_id(session: AsyncSession):
    row = await session.execute(
        select(Account.id).where(
            Account.owner_type == "system", Account.owner_id == PLATFORM_ACCOUNT_OWNER_ID
        ).limit(1)
    )
    return row.scalar_one_or_none()


async def _sum_events(
    session: AsyncSession,
    *,
    account_id,
    direction: str,
    currency: str,
    since: datetime | None = None,
) -> Decimal:
    col = LedgerEvent.dst_account_id if direction == "in" else LedgerEvent.src_account_id
    q = select(func.coalesce(func.sum(func.abs(LedgerEvent.amount_value)), 0)).where(
        col == account_id, LedgerEvent.amount_currency == currency
    )
    if since is not None:
        q = q.where(LedgerEvent.ts >= since)
    return Decimal(str((await session.execute(q)).scalar_one() or 0))


async def _breakdown(
    session: AsyncSession,
    *,
    account_id,
    direction: str,
    currency: str,
    since: datetime,
) -> list[dict]:
    col = LedgerEvent.dst_account_id if direction == "in" else LedgerEvent.src_account_id
    source = func.coalesce(LedgerEvent.metadata_["type"].astext, LedgerEvent.type.cast(String))
    q = (
        select(
            source.label("source"),
            func.coalesce(func.sum(func.abs(LedgerEvent.amount_value)), 0).label("amount"),
            func.count(LedgerEvent.id).label("count"),
        )
        .where(col == account_id, LedgerEvent.amount_currency == currency, LedgerEvent.ts >= since)
        .group_by(source)
        .order_by(func.sum(func.abs(LedgerEvent.amount_value)).desc())
    )
    rows = (await session.execute(q)).all()
    return [
        {"source": str(r.source), "amount": str(Decimal(str(r.amount)).quantize(_Q)), "count": int(r.count)}
        for r in rows
    ]


async def treasury_status(session: AsyncSession, *, currency: str = "ACP") -> dict:
    settings = get_settings()
    onchain = onchain_treasury_balance()

    account_id = await _platform_account_id(session)
    since_30d = datetime.now(timezone.utc) - timedelta(days=30)

    if account_id is None:
        ledger = {
            "account_id": None,
            "currency": currency,
            "balance": "0",
            "revenue_total": "0",
            "expenses_total": "0",
            "revenue_30d": "0",
            "expenses_30d": "0",
        }
        revenue_breakdown: list[dict] = []
        expense_breakdown: list[dict] = []
    else:
        balances = await balance_for_account(session, account_id, currency)
        revenue_total = await _sum_events(session, account_id=account_id, direction="in", currency=currency)
        expenses_total = await _sum_events(session, account_id=account_id, direction="out", currency=currency)
        revenue_30d = await _sum_events(
            session, account_id=account_id, direction="in", currency=currency, since=since_30d
        )
        expenses_30d = await _sum_events(
            session, account_id=account_id, direction="out", currency=currency, since=since_30d
        )
        revenue_breakdown = await _breakdown(
            session, account_id=account_id, direction="in", currency=currency, since=since_30d
        )
        expense_breakdown = await _breakdown(
            session, account_id=account_id, direction="out", currency=currency, since=since_30d
        )
        ledger = {
            "account_id": str(account_id),
            "currency": currency,
            "balance": str((balances.get(currency) or Decimal(0)).quantize(_Q)),
            "revenue_total": str(revenue_total.quantize(_Q)),
            "expenses_total": str(expenses_total.quantize(_Q)),
            "revenue_30d": str(revenue_30d.quantize(_Q)),
            "expenses_30d": str(expenses_30d.quantize(_Q)),
        }

    return {
        "onchain": onchain,
        "ledger": ledger,
        "revenue_breakdown_30d": revenue_breakdown,
        "expense_breakdown_30d": expense_breakdown,
        "fee_policy": {
            "order_fee_percent": str(settings.order_fee_percent),
            "run_fee_percent": str(settings.run_fee_percent),
            "listing_fee_percent": str(settings.listing_fee_percent),
            "merchant_default_fee_bps": "100",
            "referral_signup_bonus_acp": str(settings.referral_signup_bonus_acp),
            "referral_commission_share_rate": str(settings.referral_commission_share_rate),
            "staking_rewards_fees_share_percent": str(settings.staking_rewards_fees_share_percent),
        },
    }
