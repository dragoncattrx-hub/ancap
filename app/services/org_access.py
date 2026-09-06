"""Org membership helpers shared by advanced capital / fleet routers."""
from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OrganizationMember, OrgRoleEnum

_ROLE_RANK = {
    OrgRoleEnum.viewer: 1,
    OrgRoleEnum.member: 2,
    OrgRoleEnum.admin: 3,
    OrgRoleEnum.owner: 4,
}


async def get_member_role(
    session: AsyncSession,
    org_id: uuid.UUID | str,
    user_id: uuid.UUID | str,
) -> OrgRoleEnum | None:
    q = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.org_id == str(org_id),
            OrganizationMember.user_id == str(user_id),
        )
    )
    row = q.scalar_one_or_none()
    return row.role if row else None


async def require_org_role(
    session: AsyncSession,
    org_id: uuid.UUID | str,
    user_id: uuid.UUID | str,
    min_role: OrgRoleEnum,
) -> OrgRoleEnum:
    role = await get_member_role(session, org_id, user_id)
    if role is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    if _ROLE_RANK.get(role, 0) < _ROLE_RANK.get(min_role, 0):
        raise HTTPException(status_code=403, detail="Insufficient organization role")
    return role
