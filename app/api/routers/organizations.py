from __future__ import annotations

import csv
import io
import re
import uuid
from datetime import datetime, timezone, timedelta, UTC

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import desc, select, func, or_ as sql_or
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.deps import DbSession, get_current_user_id
from app.db.models import (
    Agent,
    ApiKey,
    ApiUsageEvent,
    DecisionLog,
    Organization,
    OrganizationMember,
    OrgRoleEnum,
    User,
    WebhookEndpoint,
)


router = APIRouter(prefix="/organizations", tags=["Organizations"])


# --- Schemas ---

class OrgMemberPublic(BaseModel):
    user_id: str
    role: str
    joined_at: str | None = None
    user_email: str | None = None


class OrganizationPublic(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    billing_wallet_address: str | None = None
    member_count: int = 0
    user_role: str | None = None
    created_at: str | None = None


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    billing_wallet_address: str | None = None


class OrgInviteRequest(BaseModel):
    email: str
    role: str = "member"


class OrgRoleUpdateRequest(BaseModel):
    role: str


ASSIGNABLE_ORG_ROLES = {OrgRoleEnum.viewer, OrgRoleEnum.member, OrgRoleEnum.admin}


# --- Helpers ---

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return (text or "organization")[:80]


async def _get_member_role(session: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID) -> OrgRoleEnum | None:
    q = select(OrganizationMember).where(
        OrganizationMember.org_id == org_id,
        OrganizationMember.user_id == user_id,
    )
    r = await session.execute(q)
    member = r.scalar_one_or_none()
    return member.role if member else None


async def _require_role(session: AsyncSession, org_id: uuid.UUID, user_id: uuid.UUID, min_role: OrgRoleEnum) -> None:
    role = await _get_member_role(session, org_id, user_id)
    if role is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    hierarchy = [OrgRoleEnum.viewer, OrgRoleEnum.member, OrgRoleEnum.admin, OrgRoleEnum.owner]
    if hierarchy.index(role) < hierarchy.index(min_role):
        raise HTTPException(status_code=403, detail=f"Requires {min_role.value} role or higher")


# --- Endpoints ---

@router.get("", response_model=list[OrganizationPublic])
async def list_user_organizations(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)

    # Find orgs where user is a member
    q = (
        select(Organization)
        .join(OrganizationMember, OrganizationMember.org_id == Organization.id)
        .where(OrganizationMember.user_id == uid)
        .order_by(desc(Organization.created_at))
    )
    r = await session.execute(q)
    orgs = list(r.scalars().all())

    result: list[OrganizationPublic] = []
    for org in orgs:
        # Count members
        cnt_q = select(func.count()).select_from(OrganizationMember).where(OrganizationMember.org_id == org.id)
        cnt_r = await session.execute(cnt_q)
        member_count = cnt_r.scalar() or 0

        role_q = select(OrganizationMember.role).where(
            OrganizationMember.org_id == org.id,
            OrganizationMember.user_id == uid,
        )
        role_r = await session.execute(role_q)
        user_role = role_r.scalar_one_or_none()

        result.append(OrganizationPublic(
            id=str(org.id),
            name=org.name,
            slug=org.slug,
            description=org.description,
            billing_wallet_address=org.billing_wallet_address,
            member_count=member_count,
            user_role=user_role.value if user_role else None,
            created_at=org.created_at.isoformat() if org.created_at else None,
        ))
    return result


@router.post("", response_model=OrganizationPublic, status_code=201)
async def create_organization(
    body: OrganizationCreate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)

    # Generate unique slug
    base_slug = slugify(body.name)
    slug = base_slug
    for attempt in range(1, 1000):
        existing = await session.execute(
            select(Organization).where(Organization.slug == slug)
        )
        if existing.scalar_one_or_none() is None:
            break
        slug = f"{base_slug}-{attempt}"

    org = Organization(
        name=body.name,
        slug=slug,
        description=body.description,
        created_by_user_id=uid,
    )
    session.add(org)
    await session.flush()

    # Add creator as owner
    member = OrganizationMember(
        org_id=org.id,
        user_id=uid,
        role=OrgRoleEnum.owner,
    )
    session.add(member)
    await session.commit()
    await session.refresh(org)

    return OrganizationPublic(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        billing_wallet_address=org.billing_wallet_address,
        member_count=1,
        user_role="owner",
        created_at=org.created_at.isoformat() if org.created_at else None,
    )


@router.get("/{org_id}", response_model=OrganizationPublic)
async def get_organization(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)

    q = select(Organization).where(Organization.id == oid)
    r = await session.execute(q)
    org = r.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check membership
    user_role = await _get_member_role(session, oid, uid)
    if user_role is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    cnt_q = select(func.count()).select_from(OrganizationMember).where(OrganizationMember.org_id == oid)
    cnt_r = await session.execute(cnt_q)
    member_count = cnt_r.scalar() or 0

    return OrganizationPublic(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        billing_wallet_address=org.billing_wallet_address,
        member_count=member_count,
        user_role=user_role.value if user_role else None,
        created_at=org.created_at.isoformat() if org.created_at else None,
    )


@router.patch("/{org_id}", response_model=OrganizationPublic)
async def update_organization(
    org_id: str,
    body: OrganizationUpdate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)

    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    q = select(Organization).where(Organization.id == oid)
    r = await session.execute(q)
    org = r.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    fields_set = body.model_fields_set
    if "name" in fields_set:
        org.name = body.name or org.name
    if "description" in fields_set:
        org.description = body.description
    if "billing_wallet_address" in fields_set:
        org.billing_wallet_address = body.billing_wallet_address
    org.updated_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(org)

    user_role = await _get_member_role(session, oid, uid)
    cnt_q = select(func.count()).select_from(OrganizationMember).where(OrganizationMember.org_id == oid)
    cnt_r = await session.execute(cnt_q)

    return OrganizationPublic(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        billing_wallet_address=org.billing_wallet_address,
        member_count=cnt_r.scalar() or 0,
        user_role=user_role.value if user_role else None,
        created_at=org.created_at.isoformat() if org.created_at else None,
    )


@router.delete("/{org_id}", status_code=204)
async def delete_organization(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)

    await _require_role(session, oid, uid, OrgRoleEnum.owner)

    q = select(Organization).where(Organization.id == oid)
    r = await session.execute(q)
    org = r.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    await session.delete(org)
    await session.commit()


@router.get("/{org_id}/members", response_model=list[OrgMemberPublic])
async def list_organization_members(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)

    await _require_role(session, oid, uid, OrgRoleEnum.viewer)

    q = (
        select(OrganizationMember)
        .options(joinedload(OrganizationMember.user))
        .where(OrganizationMember.org_id == oid)
        .order_by(desc(OrganizationMember.created_at))
    )
    r = await session.execute(q)
    members = list(r.scalars().all())

    return [
        OrgMemberPublic(
            user_id=str(m.user_id),
            role=m.role.value,
            joined_at=m.created_at.isoformat() if m.created_at else None,
            user_email=m.user.email if m.user else None,
        )
        for m in members
    ]


@router.post("/{org_id}/members", status_code=201)
async def add_organization_member(
    org_id: str,
    body: OrgInviteRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)

    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    # Find user by email
    email_q = select(User).where(User.email == body.email.lower().strip())
    email_r = await session.execute(email_q)
    target_user = email_r.scalar_one_or_none()
    if target_user is None:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # Check if already member
    existing_q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == target_user.id,
    )
    existing_r = await session.execute(existing_q)
    if existing_r.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="User is already a member")

    # Validate role
    try:
        role = OrgRoleEnum(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role. Must be: admin, member, viewer")
    if role not in ASSIGNABLE_ORG_ROLES:
        raise HTTPException(status_code=400, detail="Owner role cannot be assigned via this endpoint")

    member = OrganizationMember(
        org_id=oid,
        user_id=target_user.id,
        role=role,
    )
    session.add(member)
    await session.commit()

    return OrgMemberPublic(
        user_id=str(target_user.id),
        role=role.value,
        joined_at=member.created_at.isoformat() if member.created_at else None,
        user_email=target_user.email,
    )


@router.delete("/{org_id}/members/{target_user_id}", status_code=204)
async def remove_organization_member(
    org_id: str,
    target_user_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)
    tid = uuid.UUID(target_user_id)

    # Can remove if: you're admin+ OR you're removing yourself
    if uid != tid:
        await _require_role(session, oid, uid, OrgRoleEnum.admin)

    # Can't remove owner
    target_q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == tid,
    )
    target_r = await session.execute(target_q)
    target_member = target_r.scalar_one_or_none()
    if target_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if target_member.role == OrgRoleEnum.owner:
        raise HTTPException(status_code=400, detail="Cannot remove organization owner")

    await session.delete(target_member)
    await session.commit()


@router.patch("/{org_id}/members/{target_user_id}/role", response_model=OrgMemberPublic)
async def update_member_role(
    org_id: str,
    target_user_id: str,
    body: OrgRoleUpdateRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)
    tid = uuid.UUID(target_user_id)

    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    try:
        new_role = OrgRoleEnum(body.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role. Must be: admin, member, viewer")
    if new_role not in ASSIGNABLE_ORG_ROLES:
        raise HTTPException(status_code=400, detail="Owner role cannot be assigned via this endpoint")

    target_q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == tid,
    )
    target_r = await session.execute(target_q)
    target_member = target_r.scalar_one_or_none()
    if target_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if target_member.role == OrgRoleEnum.owner:
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    target_member.role = new_role
    await session.commit()
    await session.refresh(target_member)

    return OrgMemberPublic(
        user_id=str(tid),
        role=target_member.role.value,
        joined_at=target_member.created_at.isoformat() if target_member.created_at else None,
    )


@router.post("/{org_id}/agents/{agent_id}", status_code=200)
async def transfer_agent_to_org(
    org_id: str,
    agent_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """Transfer an agent to be owned by an organization."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)
    aid = uuid.UUID(agent_id)

    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    agent_q = select(Agent).where(Agent.id == aid)
    agent_r = await session.execute(agent_q)
    agent = agent_r.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    org_q = select(Organization).where(Organization.id == oid)
    org_r = await session.execute(org_q)
    org = org_r.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    agent.owner_user_id = None
    agent.metadata_ = dict(agent.metadata_ or {})
    agent.metadata_["org_id"] = str(oid)
    await session.commit()

    return {"agent_id": str(aid), "org_id": str(oid), "transferred": True}


# ── Org-scoped audit export ────────────────────────────────────────────────────


class OrgAuditEvent(BaseModel):
    id: str
    event_type: str
    resource_type: str  # agent | api_key | webhook | member | usage
    resource_id: str | None
    message: str | None
    created_at: str | None


@router.get("/{org_id}/audit", response_model=list[OrgAuditEvent])
async def list_org_audit_events(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Org-scoped audit log: returns org's agents, API keys, webhooks, and usage events."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)
    await _require_role(session, oid, uid, OrgRoleEnum.viewer)  # even viewers can see audit

    since = datetime.now(UTC) - timedelta(days=days)
    events: list[OrgAuditEvent] = []

    # Agents owned by this org
    agent_q = select(Agent).where(
        Agent.metadata_["org_id"].astext == str(oid),
    )
    agent_r = await session.execute(agent_q)
    org_agent_ids = [a.id for a in agent_r.scalars().all()]

    # API keys for org's agents
    if org_agent_ids:
        key_q = (
            select(ApiKey)
            .where(ApiKey.agent_id.in_(org_agent_ids))
            .where(ApiKey.created_at >= since)
            .order_by(desc(ApiKey.created_at))
            .limit(limit)
        )
        key_r = await session.execute(key_q)
        for k in key_r.scalars().all():
            events.append(OrgAuditEvent(
                id=str(k.id),
                event_type="api_key.created",
                resource_type="api_key",
                resource_id=str(k.id),
                message=f"API key {k.key_prefix}*** created for agent {k.agent_id}",
                created_at=k.created_at.isoformat() if k.created_at else None,
            ))

    # API usage events for org's agents
    if org_agent_ids:
        usage_q = (
            select(ApiUsageEvent)
            .where(ApiUsageEvent.agent_id.in_(org_agent_ids))
            .where(ApiUsageEvent.created_at >= since)
            .order_by(desc(ApiUsageEvent.created_at))
            .limit(limit)
        )
        usage_r = await session.execute(usage_q)
        for u in usage_r.scalars().all():
            events.append(OrgAuditEvent(
                id=str(u.id),
                event_type="api_usage",
                resource_type="usage",
                resource_id=str(u.id),
                message=f"{u.endpoint} → {u.status} ({u.amount_currency} {u.amount_value})",
                created_at=u.created_at.isoformat() if u.created_at else None,
            ))

    # Decision log entries for org's agents
    if org_agent_ids:
        decision_q = (
            select(DecisionLog)
            .where(DecisionLog.actor_id.in_(org_agent_ids))
            .where(DecisionLog.created_at >= since)
            .order_by(desc(DecisionLog.created_at))
            .limit(limit)
        )
        decision_r = await session.execute(decision_q)
        for d in decision_r.scalars().all():
            events.append(OrgAuditEvent(
                id=str(d.id),
                event_type=d.reason_code or "decision",
                resource_type="agent",
                resource_id=str(d.actor_id),
                message=d.message,
                created_at=d.created_at.isoformat() if d.created_at else None,
            ))

    events.sort(key=lambda x: x.created_at or "", reverse=True)
    return events[offset:offset + limit]


@router.get("/{org_id}/audit/export")
async def export_org_audit_csv(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
    days: int = Query(30, ge=1, le=365),
):
    """Export org audit log as CSV (admin only)."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = uuid.UUID(user_id)
    oid = uuid.UUID(org_id)
    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    since = datetime.now(UTC) - timedelta(days=days)
    output = io.StringIO()
    writer = csv.writer(output)

    agent_q = select(Agent).where(
        Agent.metadata_["org_id"].astext == str(oid),
    )
    agent_r = await session.execute(agent_q)
    org_agent_ids = [a.id for a in agent_r.scalars().all()]

    writer.writerow(["id", "event_type", "resource_type", "resource_id", "message", "created_at"])

    if org_agent_ids:
        key_q = select(ApiKey).where(
            ApiKey.agent_id.in_(org_agent_ids), ApiKey.created_at >= since
        ).order_by(ApiKey.created_at)
        for k in (await session.execute(key_q)).scalars().all():
            writer.writerow([
                str(k.id), "api_key.created", "api_key", str(k.id),
                f"API key {k.key_prefix}*** created", k.created_at.isoformat() if k.created_at else "",
            ])

        usage_q = select(ApiUsageEvent).where(
            ApiUsageEvent.agent_id.in_(org_agent_ids), ApiUsageEvent.created_at >= since
        ).order_by(ApiUsageEvent.created_at).limit(10000)
        for u in (await session.execute(usage_q)).scalars().all():
            writer.writerow([
                str(u.id), "api_usage", "usage", str(u.id),
                f"{u.endpoint} → {u.status}", u.created_at.isoformat() if u.created_at else "",
            ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=org-audit-{org_id}-{datetime.now(UTC).strftime('%Y-%m-%d')}.csv"},
    )
