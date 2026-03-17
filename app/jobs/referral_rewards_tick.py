from __future__ import annotations

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ReferralAttribution


async def referral_rewards_tick(session: AsyncSession, *, max_items: int = 500) -> dict:
    # v1: mark pending attributions as eligible (actual reward issuance is trigger-driven + idempotent).
    r = await session.execute(
        select(ReferralAttribution).where(ReferralAttribution.status == "pending").limit(max_items)
    )
    rows = list(r.scalars().all())
    if not rows:
        return {"eligible_marked": 0}
    ids = [x.id for x in rows]
    await session.execute(update(ReferralAttribution).where(ReferralAttribution.id.in_(ids)).values(status="eligible"))
    return {"eligible_marked": len(ids)}

