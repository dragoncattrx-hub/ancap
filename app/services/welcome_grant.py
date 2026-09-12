"""Promotional 100 ACP access grant on registration.

This is a platform ledger credit (utility/accounting unit), not a charitable
donation, not USD cash, and not tax-deductible. See docs/WELCOME_GRANT.md.
"""
from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import LedgerEvent, LedgerEventTypeEnum
from app.services.ledger import append_event, get_or_create_account, is_ledger_invariant_halted


SYSTEM_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")
GRANT_TYPE = "welcome_grant"


def welcome_grant_acp() -> Decimal:
    try:
        value = Decimal(str(get_settings().welcome_grant_acp or "0"))
        return value if value > 0 else Decimal("0")
    except Exception:
        return Decimal("0")


async def issue_welcome_grant_idempotent(session: AsyncSession, *, user_id: UUID) -> bool:
    """Credit the new user's ledger once. Returns True if a new event was written.

    Registration must still succeed if the grant is skipped (halted ledger, zero
    amount, or a prior grant for the same user account).
    """
    amount = welcome_grant_acp()
    if amount <= 0:
        return False
    if await is_ledger_invariant_halted(session):
        return False

    dst_acc = await get_or_create_account(session, "user", user_id)
    existing = (
        await session.execute(
            select(LedgerEvent.id)
            .where(
                LedgerEvent.dst_account_id == dst_acc.id,
                LedgerEvent.metadata_["type"].astext == GRANT_TYPE,
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    if existing is not None:
        return False

    sys_acc = await get_or_create_account(session, "system", SYSTEM_OWNER_ID)
    await append_event(
        session,
        LedgerEventTypeEnum.transfer,
        "ACP",
        amount,
        src_account_id=sys_acc.id,
        dst_account_id=dst_acc.id,
        metadata={
            "type": GRANT_TYPE,
            "user_id": str(user_id),
            "legal": "promotional_access_grant_not_donation",
        },
    )
    return True
