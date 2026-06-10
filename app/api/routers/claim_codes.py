from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select

from app.api.deps import DbSession, require_auth
from app.config import get_settings
from app.db.models import ClaimCode, LedgerEventTypeEnum
from app.schemas.claim_codes import (
    ClaimCodeCreateRequest,
    ClaimCodeCreateResponse,
    ClaimCodePublic,
    ClaimCodeRedeemRequest,
    ClaimCodeRedeemResponse,
)
from app.services.ledger import append_event, balance_for_account, get_or_create_account, is_ledger_invariant_halted
from app.services.rate_limit import check_rate_limit

router = APIRouter(prefix="/claim-codes", tags=["Claim Codes"])


def _hash_secret(code: str, pepper: str) -> str:
    return hashlib.sha256(f"{pepper}:{code.strip().upper()}".encode()).hexdigest()


def _hash_pin(pin: str, pepper: str) -> str:
    return hashlib.sha256(f"{pepper}:pin:{pin.strip()}".encode()).hexdigest()


def _generate_code() -> str:
    return f"ACP-{secrets.token_hex(4).upper()}-{secrets.token_hex(2).upper()}"


@router.post("/create", response_model=ClaimCodeCreateResponse, status_code=201)
async def create_claim_code(
    body: ClaimCodeCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    if await is_ledger_invariant_halted(session):
        raise HTTPException(status_code=503, detail="Ledger operations temporarily blocked")

    try:
        amount = Decimal(str(body.amount).strip())
    except (InvalidOperation, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Invalid amount") from exc
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    currency = body.currency.strip().upper()
    total_lock = amount * Decimal(body.max_redemptions)
    user_uuid = UUID(user_id)
    user_acc = await get_or_create_account(session, "user", user_uuid)
    balances = await balance_for_account(session, user_acc.id, currency)
    available = balances.get(currency) or Decimal(0)
    if available < total_lock:
        raise HTTPException(status_code=402, detail="Insufficient balance to lock claim code funds")

    settings = get_settings()
    pepper = settings.secret_key or "ancap-claim-pepper"
    plain_code = _generate_code()
    secret_hash = _hash_secret(plain_code, pepper)
    expires_at = None
    if body.expires_in_hours:
        expires_at = datetime.now(UTC) + timedelta(hours=body.expires_in_hours)

    escrow_acc = await get_or_create_account(session, "claim_code", user_uuid)
    ev = await append_event(
        session,
        LedgerEventTypeEnum.transfer,
        currency,
        total_lock,
        src_account_id=user_acc.id,
        dst_account_id=escrow_acc.id,
        metadata={"type": "claim_code_lock", "campaign": body.campaign_label},
    )

    row = ClaimCode(
        owner_user_id=user_uuid,
        secret_hash=secret_hash,
        code_hint=plain_code[-4:],
        amount_currency=currency,
        amount_value=amount,
        status="active",
        max_redemptions=body.max_redemptions,
        expires_at=expires_at,
        campaign_label=body.campaign_label,
        pin_hash=_hash_pin(body.pin, pepper) if body.pin else None,
        lock_ledger_event_id=ev.id,
    )
    session.add(row)
    await session.flush()

    base = (settings.public_app_url or "https://ancap.cloud").rstrip("/")
    return ClaimCodeCreateResponse(
        id=str(row.id),
        code=plain_code,
        code_hint=row.code_hint,
        amount=str(amount),
        currency=currency,
        max_redemptions=row.max_redemptions,
        expires_at=expires_at,
        campaign_label=body.campaign_label,
        redeem_url=f"{base}/claim/{plain_code}",
    )


@router.post("/redeem", response_model=ClaimCodeRedeemResponse)
async def redeem_claim_code(body: ClaimCodeRedeemRequest, session: DbSession, user_id: str = Depends(require_auth)):
    allowed = await check_rate_limit(f"claim_redeem:{user_id}", limit=20, window_seconds=3600)
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many redeem attempts")

    settings = get_settings()
    pepper = settings.secret_key or "ancap-claim-pepper"
    secret_hash = _hash_secret(body.code, pepper)
    row = await session.scalar(select(ClaimCode).where(ClaimCode.secret_hash == secret_hash))
    if row is None:
        raise HTTPException(status_code=404, detail="Invalid claim code")
    if row.status != "active":
        raise HTTPException(status_code=410, detail="Claim code is not active")
    if row.expires_at and row.expires_at < datetime.now(UTC):
        row.status = "expired"
        await session.flush()
        raise HTTPException(status_code=410, detail="Claim code expired")
    if row.redemption_count >= row.max_redemptions:
        row.status = "redeemed"
        await session.flush()
        raise HTTPException(status_code=410, detail="Claim code fully redeemed")
    if row.pin_hash and (not body.pin or _hash_pin(body.pin, pepper) != row.pin_hash):
        raise HTTPException(status_code=403, detail="Invalid PIN")

    redeemer_uuid = UUID(user_id)
    if redeemer_uuid == row.owner_user_id:
        raise HTTPException(status_code=400, detail="Cannot redeem your own claim code")

    currency = row.amount_currency
    amount = Decimal(str(row.amount_value))
    escrow_acc = await get_or_create_account(session, "claim_code", row.owner_user_id)
    redeemer_acc = await get_or_create_account(session, "user", redeemer_uuid)
    ev = await append_event(
        session,
        LedgerEventTypeEnum.transfer,
        currency,
        amount,
        src_account_id=escrow_acc.id,
        dst_account_id=redeemer_acc.id,
        metadata={"type": "claim_code_redeem", "claim_code_id": str(row.id)},
    )

    row.redemption_count += 1
    if row.redemption_count >= row.max_redemptions:
        row.status = "redeemed"
    row.updated_at = datetime.now(UTC)
    await session.flush()

    base = (settings.public_app_url or "https://ancap.cloud").rstrip("/")
    return ClaimCodeRedeemResponse(
        status="redeemed",
        amount=str(amount),
        currency=currency,
        ledger_event_id=str(ev.id),
        proof_url=f"{base}/proof-center?ledger_event={ev.id}",
    )


@router.get("/mine")
async def list_my_claim_codes(session: DbSession, user_id: str = Depends(require_auth)):
    rows = await session.scalars(
        select(ClaimCode).where(ClaimCode.owner_user_id == UUID(user_id)).order_by(desc(ClaimCode.created_at))
    )
    return {
        "items": [
            ClaimCodePublic(
                id=str(row.id),
                code_hint=row.code_hint,
                amount=str(row.amount_value),
                currency=row.amount_currency,
                status=row.status,
                max_redemptions=row.max_redemptions,
                redemption_count=row.redemption_count,
                expires_at=row.expires_at,
                campaign_label=row.campaign_label,
                created_at=row.created_at,
            )
            for row in rows
        ]
    }
