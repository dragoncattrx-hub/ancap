from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy import func

from app.api.deps import DbSession, require_auth
from app.schemas import (
    ReferralCodeCreateRequest,
    ReferralCodePublic,
    ReferralAttributeRequest,
    ReferralAttributionPublic,
    ReferralSummaryPublic,
)
from app.db.models import ReferralCode, ReferralAttribution, ReferralRewardEvent
from app.services.referrals import create_referral_code, attribute_referral


router = APIRouter(prefix="/referrals", tags=["Growth Referrals"])


@router.post("/codes/create", response_model=ReferralCodePublic, status_code=201)
async def create_code(
    body: ReferralCodeCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    uid = UUID(user_id)
    owner_user_id = uid if body.owner_user_id is None else UUID(body.owner_user_id)
    if owner_user_id != uid:
        raise HTTPException(status_code=403, detail="Cannot create code for another user")
    rc = await create_referral_code(session, owner_user_id=owner_user_id, owner_agent_id=UUID(body.owner_agent_id) if body.owner_agent_id else None)
    return ReferralCodePublic(
        id=str(rc.id),
        code=rc.code,
        is_active=rc.is_active,
        owner_user_id=str(rc.owner_user_id) if rc.owner_user_id else None,
        owner_agent_id=str(rc.owner_agent_id) if rc.owner_agent_id else None,
        created_at=rc.created_at,
    )


@router.post("/attribute", response_model=ReferralAttributionPublic, status_code=201)
async def attribute(
    body: ReferralAttributeRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    uid = UUID(user_id)
    referred_user_id = uid if body.referred_user_id is None else UUID(body.referred_user_id)
    if referred_user_id != uid:
        raise HTTPException(status_code=403, detail="Cannot attribute referral for another user")
    ra = await attribute_referral(
        session,
        code=body.code,
        referred_user_id=referred_user_id,
        referred_agent_id=UUID(body.referred_agent_id) if body.referred_agent_id else None,
        source=body.source,
    )
    return ReferralAttributionPublic(
        id=str(ra.id),
        referral_code_id=str(ra.referral_code_id),
        referred_user_id=str(ra.referred_user_id) if ra.referred_user_id else None,
        referred_agent_id=str(ra.referred_agent_id) if ra.referred_agent_id else None,
        attributed_at=ra.attributed_at,
        source=ra.source,
        status=ra.status,
    )


@router.get("/me/attributions", response_model=list[ReferralAttributionPublic])
async def my_attributions(session: DbSession, user_id: str = Depends(require_auth), limit: int = 20):
    uid = UUID(user_id)
    r = await session.execute(
        select(ReferralAttribution).where(ReferralAttribution.referred_user_id == uid).order_by(desc(ReferralAttribution.attributed_at)).limit(limit)
    )
    items = []
    for ra in r.scalars().all():
        items.append(
            ReferralAttributionPublic(
                id=str(ra.id),
                referral_code_id=str(ra.referral_code_id),
                referred_user_id=str(ra.referred_user_id) if ra.referred_user_id else None,
                referred_agent_id=str(ra.referred_agent_id) if ra.referred_agent_id else None,
                attributed_at=ra.attributed_at,
                source=ra.source,
                status=ra.status,
            )
        )
    return items


@router.get("/me/summary", response_model=ReferralSummaryPublic)
async def my_referral_summary(session: DbSession, user_id: str = Depends(require_auth)):
    uid = UUID(user_id)
    rows = (
        await session.execute(
            select(ReferralAttribution.status, func.count(ReferralAttribution.id))
            .join(ReferralCode, ReferralCode.id == ReferralAttribution.referral_code_id)
            .where(ReferralCode.owner_user_id == uid)
            .group_by(ReferralAttribution.status)
        )
    ).all()
    status_map = {str(status): int(cnt) for status, cnt in rows}
    total_attributions = sum(status_map.values())

    reward_row = (
        await session.execute(
            select(func.coalesce(func.sum(ReferralRewardEvent.amount_value), 0), func.max(ReferralRewardEvent.currency))
            .where(ReferralRewardEvent.beneficiary_user_id == uid)
        )
    ).first()
    total_reward_amount = str(reward_row[0]) if reward_row else "0"
    reward_currency = str(reward_row[1]) if reward_row and reward_row[1] else "USD"
    return ReferralSummaryPublic(
        total_attributions=total_attributions,
        pending=status_map.get("pending", 0),
        eligible=status_map.get("eligible", 0),
        rewarded=status_map.get("rewarded", 0),
        rejected=status_map.get("rejected", 0),
        total_reward_amount=total_reward_amount,
        reward_currency=reward_currency,
    )

