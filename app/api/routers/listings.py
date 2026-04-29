from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException

from app.schemas import ListingCreateRequest, ListingPublic, Pagination, ListingStatus
from app.api.deps import DbSession
from app.config import get_settings
from app.db.models import Listing, ListingStatusEnum, Strategy, StrategyVersion
from app.services.ledger import get_or_create_account, append_event, balance_for_account
from app.db.models import LedgerEventTypeEnum
from app.constants import PLATFORM_ACCOUNT_OWNER_ID
from app.services.stakes import require_activated_if_stake_required
from app.services.participation_gates import evaluate_agent_gate
from app.services.decision_logs import log_reject_decision
from sqlalchemy import select

router = APIRouter(prefix="/listings", tags=["Listings"])


def _listing_price_from_fee_model(fee_model: dict) -> tuple[Decimal, str]:
    one_time = (fee_model or {}).get("one_time_price") or {}
    if one_time:
        return Decimal(str(one_time.get("amount") or "0")), str(one_time.get("currency") or "ACP")
    monthly = (fee_model or {}).get("subscription_price_monthly") or {}
    if monthly:
        return Decimal(str(monthly.get("amount") or "0")), str(monthly.get("currency") or "ACP")
    return Decimal(0), "ACP"


@router.post("", response_model=ListingPublic, status_code=201)
async def create_listing(body: ListingCreateRequest, session: DbSession):
    strategy_id = UUID(body.strategy_id)
    strat = await session.get(Strategy, strategy_id)
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found")
    version_id = UUID(body.strategy_version_id)
    ver = await session.get(StrategyVersion, version_id)
    if not ver:
        raise HTTPException(status_code=404, detail="Strategy version not found")
    if str(ver.strategy_id) != str(strategy_id):
        raise HTTPException(status_code=400, detail="Strategy version does not belong to strategy")
    await require_activated_if_stake_required(session, strat.owner_agent_id)
    gate = await evaluate_agent_gate(session, strat.owner_agent_id)
    if not gate.ok:
        await log_reject_decision(
            session,
            reason_code=gate.reason_code or "agent_gate_rejected",
            message=gate.detail,
            scope="listings.create",
            actor_type="agent",
            actor_id=strat.owner_agent_id,
            subject_type="agent",
            subject_id=strat.owner_agent_id,
            metadata=gate.metrics,
        )
        raise HTTPException(
            status_code=403,
            detail={
                "reason_code": gate.reason_code,
                "message": gate.detail,
                "metrics": gate.metrics,
            },
        )
    # L3: platform listing fee (% of listing price; fallback to static fee if configured)
    settings = get_settings()
    listing_price, listing_currency = _listing_price_from_fee_model(body.fee_model.model_dump())
    listing_fee_percent = Decimal(str(getattr(settings, "listing_fee_percent", "0") or "0"))
    fee_value = Decimal(0)
    fee_currency = listing_currency
    if listing_fee_percent > 0 and listing_price > 0:
        fee_value = (listing_price * listing_fee_percent / Decimal(100)).quantize(Decimal("0.00000001"))
    elif settings.listing_fee_amount and Decimal(settings.listing_fee_amount) > 0:
        fee_value = Decimal(settings.listing_fee_amount)
        fee_currency = settings.listing_fee_currency

    if fee_value > 0:
        acc_agent = await get_or_create_account(session, "agent", strat.owner_agent_id)
        acc_platform = await get_or_create_account(session, "system", PLATFORM_ACCOUNT_OWNER_ID)
        bal = await balance_for_account(session, acc_agent.id, fee_currency)
        if (bal.get(fee_currency) or Decimal(0)) < fee_value:
            raise HTTPException(status_code=402, detail="Insufficient balance for listing fee")
        await append_event(
            session,
            LedgerEventTypeEnum.fee,
            fee_currency,
            fee_value,
            src_account_id=acc_agent.id,
            dst_account_id=acc_platform.id,
            metadata={
                "type": "listing_fee",
                "strategy_id": str(strategy_id),
                "basis": "listing_price_percent" if listing_fee_percent > 0 and listing_price > 0 else "static",
                "listing_price": str(listing_price),
                "listing_fee_percent": str(listing_fee_percent),
            },
        )
    listing = Listing(
        strategy_id=strategy_id,
        strategy_version_id=version_id,
        fee_model=body.fee_model.model_dump(),
        status=ListingStatusEnum(body.status.value),
        terms_url=body.terms_url,
        notes=body.notes,
    )
    session.add(listing)
    await session.flush()
    await session.refresh(listing)
    return ListingPublic(
        id=str(listing.id),
        strategy_id=str(listing.strategy_id),
        strategy_version_id=str(listing.strategy_version_id) if listing.strategy_version_id else None,
        fee_model=listing.fee_model,
        status=ListingStatus(listing.status.value),
        created_at=listing.created_at,
    )


@router.get("", response_model=Pagination[ListingPublic])
async def list_listings(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    status: ListingStatus | None = Query(None),
    strategy_id: UUID | None = Query(None),
):
    q = select(Listing).order_by(Listing.created_at.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(Listing.id < UUID(cursor))
        except ValueError:
            pass
    if status:
        q = q.where(Listing.status == status.value)
    if strategy_id:
        q = q.where(Listing.strategy_id == strategy_id)
    r = await session.execute(q)
    rows = r.scalars().all()
    next_cursor = str(rows[-1].id) if len(rows) > limit else None
    items = rows[:limit]
    return Pagination(
        items=[
            ListingPublic(
                id=str(l.id),
                strategy_id=str(l.strategy_id),
                strategy_version_id=str(l.strategy_version_id) if l.strategy_version_id else None,
                fee_model=l.fee_model,
                status=ListingStatus(l.status.value),
                created_at=l.created_at,
            )
            for l in items
        ],
        next_cursor=next_cursor,
    )


@router.get("/{listing_id}", response_model=ListingPublic)
async def get_listing(listing_id: UUID, session: DbSession):
    q = select(Listing).where(Listing.id == listing_id)
    r = await session.execute(q)
    listing = r.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingPublic(
        id=str(listing.id),
        strategy_id=str(listing.strategy_id),
        strategy_version_id=str(listing.strategy_version_id) if listing.strategy_version_id else None,
        fee_model=listing.fee_model,
        status=ListingStatus(listing.status.value),
        created_at=listing.created_at,
    )
