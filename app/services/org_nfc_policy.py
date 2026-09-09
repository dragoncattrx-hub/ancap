"""Organization NFC policy enforcement helpers."""
from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OrganizationMember, OrganizationNfcPolicy, OrgRoleEnum, UserNfcCredential


async def get_org_nfc_policy(session: AsyncSession, org_id: uuid.UUID) -> OrganizationNfcPolicy | None:
    q = select(OrganizationNfcPolicy).where(OrganizationNfcPolicy.org_id == org_id)
    return (await session.execute(q)).scalar_one_or_none()


async def user_has_active_nfc(session: AsyncSession, user_id: uuid.UUID) -> bool:
    q = select(UserNfcCredential.id).where(
        UserNfcCredential.user_id == user_id,
        UserNfcCredential.revoked_at.is_(None),
    )
    return (await session.execute(q)).scalar_one_or_none() is not None


async def require_nfc_for_admin_actions(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    member: OrganizationMember | None = None,
) -> None:
    """Enforce require_nfc_for_admins on sensitive org admin routes."""
    policy = await get_org_nfc_policy(session, org_id)
    if policy is None or not policy.require_nfc_for_admins:
        return

    if member is None:
        q = select(OrganizationMember).where(
            OrganizationMember.org_id == org_id,
            OrganizationMember.user_id == user_id,
        )
        member = (await session.execute(q)).scalar_one_or_none()

    if member is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    admin_roles = {OrgRoleEnum.admin, OrgRoleEnum.owner}
    if member.role not in admin_roles:
        return

    if not await user_has_active_nfc(session, user_id):
        raise HTTPException(
            status_code=403,
            detail="Organization policy requires an enrolled NFC credential for admin actions",
        )


async def require_nfc_for_payments(
    session: AsyncSession,
    *,
    org_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """Enforce require_nfc_for_payments when org policy demands NFC-bound spenders."""
    policy = await get_org_nfc_policy(session, org_id)
    if policy is None or not policy.require_nfc_for_payments:
        return
    if not await user_has_active_nfc(session, user_id):
        raise HTTPException(
            status_code=403,
            detail="Organization policy requires an enrolled NFC credential for payments",
        )
