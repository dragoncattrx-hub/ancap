"""Exponential network growth — compounding referral / passport levers."""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import (
    Agent,
    DigitalPassport,
    DigitalPassportStatusEnum,
    ReferralAttribution,
    ReferralCode,
)
from app.schemas.exponential_growth import (
    ExponentialCompoundQuoteRequest,
    ExponentialCompoundQuoteResponse,
    ExponentialGrowthPublic,
)

_Q = Decimal("0.00000001")


def _dec(raw: str, *, fallback: str) -> Decimal:
    try:
        value = Decimal(str(raw or fallback))
    except Exception:
        value = Decimal(fallback)
    return value if value >= 0 else Decimal(fallback)


def _fmt(value: Decimal) -> str:
    return format(value.quantize(_Q, rounding=ROUND_HALF_UP), "f")


async def _direct_referral_count(session: AsyncSession, user_id: UUID) -> int:
    q = (
        select(func.count())
        .select_from(ReferralAttribution)
        .join(ReferralCode, ReferralCode.id == ReferralAttribution.referral_code_id)
        .where(ReferralCode.owner_user_id == user_id)
    )
    return int((await session.execute(q)).scalar_one() or 0)


async def _passport_verified_referrals(session: AsyncSession, user_id: UUID) -> int:
    """Count referred users who hold an active digital passport."""
    referred = (
        select(ReferralAttribution.referred_user_id)
        .join(ReferralCode, ReferralCode.id == ReferralAttribution.referral_code_id)
        .where(
            ReferralCode.owner_user_id == user_id,
            ReferralAttribution.referred_user_id.is_not(None),
        )
    )
    q = (
        select(func.count(func.distinct(DigitalPassport.user_id)))
        .where(
            DigitalPassport.user_id.in_(referred),
            DigitalPassport.status == DigitalPassportStatusEnum.active,
        )
    )
    return int((await session.execute(q)).scalar_one() or 0)


async def _active_agent_count(session: AsyncSession, user_id: UUID) -> int:
    q = select(func.count()).select_from(Agent).where(Agent.owner_user_id == user_id)
    return int((await session.execute(q)).scalar_one() or 0)


async def compute_growth(session: AsyncSession, *, user_id: str) -> ExponentialGrowthPublic:
    settings = get_settings()
    if not settings.ff_exponential_growth:
        raise HTTPException(status_code=404, detail="Exponential growth feature disabled")

    uid = UUID(user_id)
    base_rate = _dec(settings.exponential_growth_base_rate, fallback="0.08")
    max_depth = max(1, int(settings.exponential_growth_max_depth or 8))
    passport_boost = _dec(settings.exponential_growth_passport_boost, fallback="0.25")

    direct = await _direct_referral_count(session, uid)
    passport_verified = await _passport_verified_referrals(session, uid)
    agents = await _active_agent_count(session, uid)

    # Effective depth uses square-root of network size (smooth, not linear gaming).
    network_nodes = direct + agents
    depth = min(max_depth, int(network_nodes**0.5) + (1 if network_nodes else 0))
    verified_ratio = (Decimal(passport_verified) / Decimal(direct)) if direct > 0 else Decimal("0")
    network_multiplier = (Decimal("1") + base_rate) ** depth
    passport_multiplier = Decimal("1") + (passport_boost * verified_ratio)
    total = (network_multiplier * passport_multiplier).quantize(_Q, rounding=ROUND_HALF_UP)

    periods = [1, 3, 6, 12]
    compound_preview = {
        str(p): _fmt(total ** p)
        for p in periods
    }

    return ExponentialGrowthPublic(
        user_id=user_id,
        direct_referrals=direct,
        passport_verified_referrals=passport_verified,
        active_agents=agents,
        effective_depth=depth,
        base_rate=_fmt(base_rate),
        network_multiplier=_fmt(network_multiplier),
        passport_multiplier=_fmt(passport_multiplier),
        total_multiplier=_fmt(total),
        compound_preview=compound_preview,
        formula="total = (1+r)^depth * (1 + passport_boost * verified_ratio)",
        note=(
            "Exponential lever for ACP rewards / fee discounts. "
            "Does not move ledger balances by itself — apply via referral or fee adapters."
        ),
    )


async def quote_compound(
    session: AsyncSession,
    *,
    user_id: str,
    body: ExponentialCompoundQuoteRequest,
) -> ExponentialCompoundQuoteResponse:
    growth = await compute_growth(session, user_id=user_id)
    principal = _dec(body.principal_acp, fallback="0")
    if principal <= 0:
        raise HTTPException(status_code=400, detail="principal_acp must be positive")
    periods = max(1, min(int(body.periods or 12), 120))
    mult = Decimal(growth.total_multiplier)
    projected = (principal * (mult ** periods)).quantize(_Q, rounding=ROUND_HALF_UP)
    return ExponentialCompoundQuoteResponse(
        principal_acp=_fmt(principal),
        periods=periods,
        period_multiplier=growth.total_multiplier,
        projected_acp=_fmt(projected),
        growth=growth,
    )
