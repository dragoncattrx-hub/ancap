from __future__ import annotations

import secrets
from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Agent,
    ReferralCode,
    ReferralAttribution,
    ReferralRewardEvent,
    LedgerEventTypeEnum,
)
from app.services.ledger import (
    get_or_create_account,
    append_event,
    is_ledger_invariant_halted,
)


SYSTEM_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")


@dataclass(frozen=True)
class ReferralRewardResult:
    created: bool
    reward_event_id: str | None


def _new_code(prefix: str = "acp") -> str:
    return f"{prefix}_{secrets.token_urlsafe(12)}".replace("-", "").replace("_", "_")[:32]


async def create_referral_code(
    session: AsyncSession,
    *,
    owner_user_id: UUID | None,
    owner_agent_id: UUID | None,
) -> ReferralCode:
    if owner_user_id is None and owner_agent_id is None:
        raise ValueError("owner_user_id or owner_agent_id required")

    # small retry to avoid rare collisions with unique(code)
    for _ in range(5):
        code = _new_code()
        rc = ReferralCode(
            owner_user_id=owner_user_id,
            owner_agent_id=owner_agent_id,
            code=code,
            is_active=True,
        )
        session.add(rc)
        try:
            await session.flush()
            return rc
        except Exception:
            await session.rollback()
    raise HTTPException(status_code=409, detail="Could not generate unique referral code")


async def attribute_referral(
    session: AsyncSession,
    *,
    code: str,
    referred_user_id: UUID | None,
    referred_agent_id: UUID | None,
    source: str = "signup",
) -> ReferralAttribution:
    if referred_user_id is None and referred_agent_id is None:
        raise HTTPException(status_code=400, detail="referred_user_id or referred_agent_id required")

    r = await session.execute(select(ReferralCode).where(ReferralCode.code == code, ReferralCode.is_active.is_(True)))
    rc = r.scalar_one_or_none()
    if not rc:
        raise HTTPException(status_code=404, detail="Referral code not found")

    # basic self-referral reject: same user, or agent owned by the same user
    if referred_user_id is not None and rc.owner_user_id is not None and referred_user_id == UUID(str(rc.owner_user_id)):
        raise HTTPException(status_code=400, detail="Self-referral is not allowed")
    if referred_agent_id is not None:
        rr = await session.execute(select(Agent).where(Agent.id == referred_agent_id))
        referred_agent = rr.scalar_one_or_none()
        if referred_agent and rc.owner_user_id and referred_agent.owner_user_id == rc.owner_user_id:
            raise HTTPException(status_code=400, detail="Self-referral is not allowed")

    # uniqueness enforced by partial unique indexes; rely on DB for idempotency.
    ra = ReferralAttribution(
        referral_code_id=rc.id,
        referred_user_id=referred_user_id,
        referred_agent_id=referred_agent_id,
        source=source,
        status="pending",
    )
    session.add(ra)
    try:
        await session.flush()
    except Exception as e:
        raise HTTPException(status_code=409, detail="Referral already attributed") from e
    return ra


async def issue_referral_reward_idempotent(
    session: AsyncSession,
    *,
    referral_attribution_id: UUID,
    beneficiary_user_id: UUID | None,
    beneficiary_agent_id: UUID | None,
    trigger_type: str,
    trigger_ref_type: str,
    trigger_ref_id: UUID,
    currency: str,
    amount_value: Decimal,
    ledger_metadata: dict | None = None,
) -> ReferralRewardResult:
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger invariant violated; operations temporarily blocked")
    if beneficiary_user_id is None and beneficiary_agent_id is None:
        raise HTTPException(status_code=400, detail="beneficiary_user_id or beneficiary_agent_id required")
    if amount_value <= 0:
        raise HTTPException(status_code=400, detail="amount must be positive")

    # Insert reward event with unique dedupe key (idempotency).
    stmt = (
        insert(ReferralRewardEvent)
        .values(
            referral_attribution_id=referral_attribution_id,
            beneficiary_user_id=beneficiary_user_id,
            beneficiary_agent_id=beneficiary_agent_id,
            trigger_type=trigger_type,
            trigger_ref_type=trigger_ref_type,
            trigger_ref_id=trigger_ref_id,
            currency=currency,
            amount_value=amount_value,
        )
        .on_conflict_do_nothing(
            index_elements=["referral_attribution_id", "trigger_type", "trigger_ref_type", "trigger_ref_id"]
        )
        .returning(ReferralRewardEvent.id)
    )
    res = await session.execute(stmt)
    new_id = res.scalar_one_or_none()
    if not new_id:
        return ReferralRewardResult(created=False, reward_event_id=None)

    # Ledger: mint via system debit + beneficiary credit (keeps invariant 0).
    sys_acc = await get_or_create_account(session, "system", SYSTEM_OWNER_ID)
    if beneficiary_agent_id is not None:
        dst_acc = await get_or_create_account(session, "agent", beneficiary_agent_id)
    else:
        dst_acc = await get_or_create_account(session, "user", beneficiary_user_id)  # type: ignore[arg-type]

    meta = {"type": "referral_reward", "referral_attribution_id": str(referral_attribution_id)}
    if ledger_metadata:
        meta.update(ledger_metadata)

    await append_event(
        session,
        LedgerEventTypeEnum.transfer,
        currency,
        -amount_value,
        src_account_id=sys_acc.id,
        metadata={**meta, "leg": "system_debit"},
    )
    ev2 = await append_event(
        session,
        LedgerEventTypeEnum.transfer,
        currency,
        amount_value,
        dst_account_id=dst_acc.id,
        metadata={**meta, "leg": "beneficiary_credit", "reward_event_id": str(new_id)},
    )

    await session.execute(
        sa.update(ReferralRewardEvent).where(ReferralRewardEvent.id == new_id).values(ledger_tx_id=ev2.id)  # type: ignore[name-defined]
    )
    return ReferralRewardResult(created=True, reward_event_id=str(new_id))

