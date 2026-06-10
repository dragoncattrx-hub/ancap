from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import desc, func, select

from app.api.deps import DbSession, require_auth, require_platform_admin
from app.db.models import ClaimCode, MerchantAccount, PaymentLink, RampWaitlistEntry
from app.services.merchant_pay import get_or_create_merchant_account

router = APIRouter(prefix="/commerce", tags=["Commerce"])

COMMERCE_PLANS = [
    {
        "tier": "free",
        "label": "Free",
        "monthly_price_acp": "0",
        "payment_links_limit": 5,
        "mcp_enabled": False,
        "api_monthly_cap_acp": "10",
    },
    {
        "tier": "pro",
        "label": "Pro",
        "monthly_price_acp": "49",
        "payment_links_limit": 50,
        "mcp_enabled": True,
        "api_monthly_cap_acp": "100",
    },
    {
        "tier": "merchant",
        "label": "Merchant",
        "monthly_price_acp": "149",
        "payment_links_limit": 500,
        "mcp_enabled": True,
        "api_monthly_cap_acp": "500",
    },
    {
        "tier": "developer",
        "label": "Developer",
        "monthly_price_acp": "199",
        "payment_links_limit": 100,
        "mcp_enabled": True,
        "api_monthly_cap_acp": "2000",
    },
]


class RampWaitlistRequest(BaseModel):
    email: EmailStr
    interest: str = Field(default="stablecoin_topup", max_length=64)
    region: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=500)


class PlanSelectRequest(BaseModel):
    tier: str = Field(pattern="^(free|pro|merchant|developer|starter)$")


@router.get("/plans")
async def list_commerce_plans():
    return {"items": COMMERCE_PLANS}


@router.post("/plans/select")
async def select_commerce_plan(body: PlanSelectRequest, session: DbSession, user_id: str = Depends(require_auth)):
    tier = body.tier if body.tier != "starter" else "free"
    if tier not in {plan["tier"] for plan in COMMERCE_PLANS}:
        raise HTTPException(status_code=400, detail="Unknown plan tier")
    account = await get_or_create_merchant_account(session, UUID(user_id))
    account.plan_tier = tier
    account.updated_at = datetime.now(UTC)
    await session.flush()
    return {"status": "ok", "plan_tier": account.plan_tier}


@router.post("/ramp-waitlist", status_code=201)
async def join_ramp_waitlist(body: RampWaitlistRequest, session: DbSession):
    existing = await session.scalar(
        select(RampWaitlistEntry).where(
            RampWaitlistEntry.email == body.email.strip().lower(),
            RampWaitlistEntry.interest == body.interest,
        )
    )
    if existing:
        return {
            "status": "already_registered",
            "id": str(existing.id),
            "created_at": existing.created_at,
        }
    row = RampWaitlistEntry(
        email=body.email.strip().lower(),
        interest=body.interest,
        region=(body.region or "").strip() or None,
        notes=(body.notes or "").strip() or None,
        status="pending",
    )
    session.add(row)
    await session.flush()
    return {"status": "registered", "id": str(row.id), "created_at": row.created_at}


@router.get("/ramp-waitlist")
async def list_ramp_waitlist(session: DbSession, _admin: str = Depends(require_platform_admin)):
    rows = (
        await session.scalars(select(RampWaitlistEntry).order_by(desc(RampWaitlistEntry.created_at)).limit(500))
    ).all()
    return {
        "items": [
            {
                "id": str(row.id),
                "email": row.email,
                "interest": row.interest,
                "region": row.region,
                "notes": row.notes,
                "status": row.status,
                "created_at": row.created_at,
            }
            for row in rows
        ]
    }


@router.get("/metrics")
async def commerce_metrics(session: DbSession, _admin: str = Depends(require_platform_admin)):
    payment_links = int(await session.scalar(select(func.count()).select_from(PaymentLink)) or 0)
    active_merchants = int(
        await session.scalar(
            select(func.count(func.distinct(PaymentLink.owner_user_id))).where(PaymentLink.status == "active")
        )
        or 0
    )
    claim_redemptions = int(
        await session.scalar(select(func.coalesce(func.sum(ClaimCode.redemption_count), 0))) or 0
    )
    claim_codes_active = int(
        await session.scalar(select(func.count()).select_from(ClaimCode).where(ClaimCode.status == "active")) or 0
    )
    ramp_waitlist = int(await session.scalar(select(func.count()).select_from(RampWaitlistEntry)) or 0)
    return {
        "payment_links_total": payment_links,
        "active_merchants_estimate": active_merchants,
        "claim_codes_active": claim_codes_active,
        "claim_redemptions_total": claim_redemptions,
        "ramp_waitlist_signups": ramp_waitlist,
        "exported_at": datetime.now(UTC).isoformat(),
    }


def plan_limit_for_tier(tier: str, key: str) -> int | Decimal:
    for plan in COMMERCE_PLANS:
        if plan["tier"] == tier:
            return plan.get(key, 0)
    return COMMERCE_PLANS[0].get(key, 0)


async def enforce_payment_link_plan_limit(session: DbSession, account: MerchantAccount) -> None:
    limit = int(plan_limit_for_tier(account.plan_tier or "free", "payment_links_limit"))
    active_count = int(
        await session.scalar(
            select(func.count())
            .select_from(PaymentLink)
            .where(PaymentLink.owner_user_id == account.owner_user_id, PaymentLink.status == "active")
        )
        or 0
    )
    if active_count >= limit:
        raise HTTPException(
            status_code=402,
            detail=f"Payment link limit reached for plan '{account.plan_tier}' ({limit}). Upgrade at /commerce/plans.",
        )
