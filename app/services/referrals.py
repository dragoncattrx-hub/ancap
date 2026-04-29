from __future__ import annotations

import secrets
from dataclasses import dataclass
from decimal import Decimal
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.services.acp_wallet import _run_walletd

from app.db.models import (
    Agent,
    ReferralCode,
    ReferralAttribution,
    ReferralRewardEvent,
    LedgerEventTypeEnum,
    UserAcpWallet,
    ReferralOnchainPayoutJob,
)
from app.services.ledger import (
    get_or_create_account,
    append_event,
    is_ledger_invariant_halted,
)


SYSTEM_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")
REFERRAL_SIGNUP_BONUS_ACP = Decimal("100")
REFERRAL_COMMISSION_SHARE_RATE = Decimal("0.30")


@dataclass(frozen=True)
class ReferralRewardResult:
    created: bool
    reward_event_id: str | None


async def _beneficiary_wallet_address(
    session: AsyncSession,
    *,
    beneficiary_user_id: UUID | None,
    beneficiary_agent_id: UUID | None,
) -> str | None:
    target_user_id = beneficiary_user_id
    if target_user_id is None and beneficiary_agent_id is not None:
        agent = await session.get(Agent, beneficiary_agent_id)
        if agent and agent.owner_user_id:
            target_user_id = UUID(str(agent.owner_user_id))
    if target_user_id is None:
        return None
    row = await session.execute(select(UserAcpWallet).where(UserAcpWallet.user_id == str(target_user_id)))
    wallet = row.scalar_one_or_none()
    if wallet is None:
        return None
    return str(wallet.address or "").strip() or None


def _is_positive_decimal(text: str) -> bool:
    try:
        return Decimal(text) > 0
    except Exception:
        return False


def _build_onchain_referral_payout_args(*, to_address: str, amount_value: Decimal) -> list[str]:
    settings = get_settings()
    if not settings.referral_onchain_payout_enabled:
        return []
    keystore_file = (settings.referral_onchain_payout_keystore_file or "").strip()
    if not keystore_file:
        raise HTTPException(status_code=503, detail="Referral on-chain payout wallet is not configured")
    rpc_url = (settings.acp_rpc_url or "").strip()
    if not rpc_url:
        raise HTTPException(status_code=503, detail="ACP RPC URL is not configured")
    args = [
        "transfer",
        "--rpc",
        rpc_url,
        "--keystore-file",
        keystore_file,
        "--to",
        to_address,
        "--amount-acp",
        str(amount_value),
    ]
    fee_text = (settings.referral_onchain_payout_fee_acp or "").strip()
    if fee_text:
        if not _is_positive_decimal(fee_text):
            raise HTTPException(status_code=500, detail="Invalid referral_onchain_payout_fee_acp setting")
        args.extend(["--fee-acp", fee_text])
    return args


async def process_referral_onchain_payout_jobs(
    session: AsyncSession,
    *,
    max_items: int = 100,
) -> dict[str, int]:
    settings = get_settings()
    if not settings.referral_onchain_payout_enabled:
        return {"processed": 0, "sent": 0, "failed": 0}
    rows = (
        await session.execute(
            select(ReferralOnchainPayoutJob)
            .where(ReferralOnchainPayoutJob.status == "pending")
            .order_by(ReferralOnchainPayoutJob.created_at.asc())
            .limit(max_items)
        )
    ).scalars().all()
    sent = 0
    failed = 0
    for job in rows:
        job.attempts = int(job.attempts or 0) + 1
        try:
            args = _build_onchain_referral_payout_args(
                to_address=str(job.to_address),
                amount_value=Decimal(str(job.amount_value)),
            )
            if not args:
                continue
            res = _run_walletd(args, timeout_s=180)
            if not bool(res.get("accepted")):
                raise RuntimeError(str(res.get("reason") or "unknown"))
            job.txid = str(res.get("txid") or "")
            job.status = "sent"
            job.sent_at = datetime.now(timezone.utc)
            job.last_error = None
            sent += 1
        except Exception as exc:
            job.status = "failed" if job.attempts >= 5 else "pending"
            job.last_error = str(exc)
            failed += 1
    await session.flush()
    return {"processed": len(rows), "sent": sent, "failed": failed}


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

    # Optional real ACP transfer for automatic referral payouts from site wallet.
    if currency.upper() == "ACP":
        payout_to = await _beneficiary_wallet_address(
            session,
            beneficiary_user_id=beneficiary_user_id,
            beneficiary_agent_id=beneficiary_agent_id,
        )
        if payout_to:
            args = _build_onchain_referral_payout_args(to_address=payout_to, amount_value=amount_value)
            if args:
                session.add(
                    ReferralOnchainPayoutJob(
                        reward_event_id=new_id,
                        to_address=payout_to,
                        amount_value=amount_value,
                        status="pending",
                    )
                )

    await session.execute(
        sa.update(ReferralRewardEvent).where(ReferralRewardEvent.id == new_id).values(ledger_tx_id=ev2.id)  # type: ignore[name-defined]
    )
    return ReferralRewardResult(created=True, reward_event_id=str(new_id))


async def issue_referral_rewards_for_order(
    session: AsyncSession,
    *,
    order_id: UUID,
    buyer_type: str,
    buyer_id: UUID,
    amount_currency: str,
    amount_value: Decimal,
) -> dict[str, str]:
    if buyer_type not in {"user", "agent"}:
        return {"status": "skipped", "reason": "unsupported_buyer_type"}

    referred_filter = (
        ReferralAttribution.referred_user_id == buyer_id
        if buyer_type == "user"
        else ReferralAttribution.referred_agent_id == buyer_id
    )
    row = (
        await session.execute(
            select(ReferralAttribution, ReferralCode)
            .join(ReferralCode, ReferralCode.id == ReferralAttribution.referral_code_id)
            .where(referred_filter, ReferralCode.is_active.is_(True))
            .order_by(ReferralAttribution.attributed_at.asc())
            .limit(1)
        )
    ).first()
    if not row:
        return {"status": "skipped", "reason": "no_attribution"}

    attribution, code = row
    beneficiary_user_id = code.owner_user_id
    beneficiary_agent_id = code.owner_agent_id
    if beneficiary_user_id is None and beneficiary_agent_id is None:
        return {"status": "skipped", "reason": "invalid_referral_owner"}

    created_any = False
    trigger_ref_type = "user" if buyer_type == "user" else "agent"
    signup_res = await issue_referral_reward_idempotent(
        session,
        referral_attribution_id=attribution.id,
        beneficiary_user_id=beneficiary_user_id,
        beneficiary_agent_id=beneficiary_agent_id,
        trigger_type="referral_signup_bonus",
        trigger_ref_type=trigger_ref_type,
        trigger_ref_id=buyer_id,
        currency="ACP",
        amount_value=REFERRAL_SIGNUP_BONUS_ACP,
        ledger_metadata={"order_id": str(order_id)},
    )
    created_any = created_any or signup_res.created

    if amount_currency.upper() == "ACP" and amount_value > 0:
        commission_amount = (amount_value * REFERRAL_COMMISSION_SHARE_RATE).quantize(Decimal("0.00000001"))
        if commission_amount > 0:
            commission_res = await issue_referral_reward_idempotent(
                session,
                referral_attribution_id=attribution.id,
                beneficiary_user_id=beneficiary_user_id,
                beneficiary_agent_id=beneficiary_agent_id,
                trigger_type="referral_commission_share",
                trigger_ref_type="order",
                trigger_ref_id=order_id,
                currency="ACP",
                amount_value=commission_amount,
                ledger_metadata={"buyer_type": buyer_type, "buyer_id": str(buyer_id)},
            )
            created_any = created_any or commission_res.created

    if created_any:
        await session.execute(
            sa.update(ReferralAttribution)
            .where(ReferralAttribution.id == attribution.id)
            .values(status="rewarded")
        )
        return {"status": "rewarded"}

    return {"status": "skipped", "reason": "already_rewarded_for_trigger"}

