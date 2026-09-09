from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, get_current_user_id
from app.db.models import (
    MemberVerificationStatusEnum,
    OrganizationMember,
    OrganizationNfcPolicy,
    OrgRoleEnum,
    User,
    UserNfcCredential,
)
from app.schemas.digital_passport import DigitalPassportIssueRequest, DigitalPassportPublic
from app.schemas.org_identity import (
    MemberVerificationPublic,
    MemberVerificationStatusUpdate,
    MemberVerifyRequest,
    NfcCredentialPublic,
    NfcCredentialRegisterRequest,
    OrganizationNfcPolicyPublic,
    OrganizationNfcPolicyUpdate,
)
from app.services.digital_passport import (
    explorer_url,
    issue_passport,
    resolve_nfc_credential,
    revoke_passport_for_member,
)
from app.services.org_nfc_policy import require_nfc_for_admin_actions

router = APIRouter(prefix="/organizations/{org_id}/identity", tags=["Organization Identity"])


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


def _parse_org_id(org_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(org_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid org_id") from exc


def _parse_user_id(user_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user_id") from exc


def _require_auth_user_id(user_id: str | None) -> uuid.UUID:
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return uuid.UUID(user_id)


def _nfc_credential_public(credential: UserNfcCredential) -> NfcCredentialPublic:
    return NfcCredentialPublic(
        id=str(credential.id),
        label=credential.label,
        uid_hash=credential.uid_hash,
        vendor=credential.vendor,
        created_at=credential.created_at,
        revoked_at=credential.revoked_at,
        is_active=credential.revoked_at is None,
    )


def _member_verification_public(member: OrganizationMember, user_email: str | None = None) -> MemberVerificationPublic:
    return MemberVerificationPublic(
        user_id=str(member.user_id),
        role=member.role.value,
        employee_code=member.employee_code,
        verification_status=member.verification_status.value,
        nfc_uid_hash=member.nfc_uid_hash,
        verified_at=member.verified_at,
        verified_by_user_id=str(member.verified_by_user_id) if member.verified_by_user_id else None,
        joined_at=member.created_at,
        user_email=user_email,
    )


async def _get_or_create_policy(session: AsyncSession, org_id: uuid.UUID) -> OrganizationNfcPolicy:
    q = select(OrganizationNfcPolicy).where(OrganizationNfcPolicy.org_id == org_id)
    r = await session.execute(q)
    policy = r.scalar_one_or_none()
    if policy is not None:
        return policy
    policy = OrganizationNfcPolicy(org_id=org_id)
    session.add(policy)
    await session.flush()
    return policy


@router.post("/nfc/register", response_model=NfcCredentialPublic, status_code=201)
async def register_nfc_credential(
    org_id: str,
    body: NfcCredentialRegisterRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.member)

    existing_q = select(UserNfcCredential).where(UserNfcCredential.uid_hash == body.uid_hash)
    existing_r = await session.execute(existing_q)
    if existing_r.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="NFC credential with this uid_hash already registered")

    credential = UserNfcCredential(
        user_id=uid,
        label=body.label,
        uid_hash=body.uid_hash,
    )
    session.add(credential)
    await session.flush()
    return _nfc_credential_public(credential)


@router.get("/nfc", response_model=list[NfcCredentialPublic])
async def list_nfc_credentials(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.member)

    q = (
        select(UserNfcCredential)
        .where(UserNfcCredential.user_id == uid)
        .order_by(UserNfcCredential.created_at.desc())
    )
    r = await session.execute(q)
    credentials = list(r.scalars().all())
    return [_nfc_credential_public(c) for c in credentials]


@router.delete("/nfc/{credential_id}", response_model=NfcCredentialPublic)
async def revoke_nfc_credential(
    org_id: str,
    credential_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.member)

    try:
        cid = uuid.UUID(credential_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid credential_id") from exc

    q = select(UserNfcCredential).where(UserNfcCredential.id == cid, UserNfcCredential.user_id == uid)
    r = await session.execute(q)
    credential = r.scalar_one_or_none()
    if credential is None:
        raise HTTPException(status_code=404, detail="NFC credential not found")

    if credential.revoked_at is None:
        credential.revoked_at = datetime.now(timezone.utc)
        await session.flush()

    return _nfc_credential_public(credential)


@router.post("/members/{member_user_id}/verify", response_model=MemberVerificationPublic)
async def verify_organization_member(
    org_id: str,
    member_user_id: str,
    body: MemberVerifyRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.admin)
    await require_nfc_for_admin_actions(session, org_id=oid, user_id=uid)

    target_uid = _parse_user_id(member_user_id)
    q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == target_uid,
    )
    r = await session.execute(q)
    member = r.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Organization member not found")

    if body.nfc_uid_hash is not None:
        member.nfc_uid_hash = body.nfc_uid_hash
    if body.employee_code is not None:
        member.employee_code = body.employee_code

    member.verification_status = MemberVerificationStatusEnum.verified
    member.verified_at = datetime.now(timezone.utc)
    member.verified_by_user_id = uid
    await session.flush()

    user_q = select(User.email).where(User.id == target_uid)
    user_r = await session.execute(user_q)
    user_email = user_r.scalar_one_or_none()
    return _member_verification_public(member, user_email=user_email)


@router.post(
    "/members/{member_user_id}/passport",
    response_model=DigitalPassportPublic,
    status_code=201,
)
async def issue_member_passport_from_identity(
    org_id: str,
    member_user_id: str,
    body: DigitalPassportIssueRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.admin)
    await require_nfc_for_admin_actions(session, org_id=oid, user_id=uid)

    target_uid = _parse_user_id(member_user_id)
    q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == target_uid,
    )
    member = (await session.execute(q)).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Organization member not found")

    nfc_cred = None
    if body.nfc_credential_id:
        try:
            cid = uuid.UUID(body.nfc_credential_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid nfc_credential_id") from exc
        nfc_cred = await resolve_nfc_credential(session, user_id=target_uid, nfc_credential_id=cid)
        if nfc_cred is None:
            raise HTTPException(status_code=404, detail="NFC credential not found")

    try:
        rec = await issue_passport(
            session,
            user_id=target_uid,
            org_id=oid,
            wallet_address=body.wallet_address,
            nfc_credential_id=nfc_cred.id if nfc_cred else None,
            member=member,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return DigitalPassportPublic(
        id=str(rec.id),
        user_id=str(rec.user_id),
        org_id=str(rec.org_id) if rec.org_id else None,
        wallet_address=rec.wallet_address,
        token_id=int(rec.token_id),
        claim_hash=rec.claim_hash,
        chain_id=rec.chain_id,
        contract_address=rec.contract_address,
        tx_hash=rec.tx_hash,
        token_uri=rec.token_uri,
        status=rec.status.value,
        nfc_credential_id=str(rec.nfc_credential_id) if rec.nfc_credential_id else None,
        issued_at=rec.issued_at,
        revoked_at=rec.revoked_at,
        created_at=rec.created_at,
        explorer_url=explorer_url(rec.tx_hash),
    )


@router.patch("/members/{member_user_id}/status", response_model=MemberVerificationPublic)
async def update_member_verification_status(
    org_id: str,
    member_user_id: str,
    body: MemberVerificationStatusUpdate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    target_uid = _parse_user_id(member_user_id)
    q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == target_uid,
    )
    r = await session.execute(q)
    member = r.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Organization member not found")

    await require_nfc_for_admin_actions(session, org_id=oid, user_id=uid)

    member.verification_status = body.verification_status
    if body.verification_status == MemberVerificationStatusEnum.verified:
        member.verified_at = datetime.now(timezone.utc)
        member.verified_by_user_id = uid
    else:
        member.verified_at = None
        member.verified_by_user_id = None
        if body.verification_status in (
            MemberVerificationStatusEnum.suspended,
            MemberVerificationStatusEnum.revoked,
        ):
            await revoke_passport_for_member(session, user_id=target_uid, org_id=oid)

    await session.flush()

    user_q = select(User.email).where(User.id == target_uid)
    user_r = await session.execute(user_q)
    user_email = user_r.scalar_one_or_none()
    return _member_verification_public(member, user_email=user_email)


@router.get("/members/verification", response_model=list[MemberVerificationPublic])
async def list_member_verifications(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.admin)

    q = (
        select(OrganizationMember, User.email)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.org_id == oid)
        .order_by(OrganizationMember.created_at.asc())
    )
    r = await session.execute(q)
    rows = r.all()
    return [_member_verification_public(member, user_email=email) for member, email in rows]


@router.get("/policy", response_model=OrganizationNfcPolicyPublic)
async def get_organization_nfc_policy(
    org_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.viewer)

    policy = await _get_or_create_policy(session, oid)
    return OrganizationNfcPolicyPublic(
        org_id=str(policy.org_id),
        require_nfc_for_admins=policy.require_nfc_for_admins,
        require_nfc_for_payments=policy.require_nfc_for_payments,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )


@router.put("/policy", response_model=OrganizationNfcPolicyPublic)
async def update_organization_nfc_policy(
    org_id: str,
    body: OrganizationNfcPolicyUpdate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    oid = _parse_org_id(org_id)
    uid = _require_auth_user_id(user_id)
    await _require_role(session, oid, uid, OrgRoleEnum.admin)
    await require_nfc_for_admin_actions(session, org_id=oid, user_id=uid)

    policy = await _get_or_create_policy(session, oid)
    if body.require_nfc_for_admins is not None:
        policy.require_nfc_for_admins = body.require_nfc_for_admins
    if body.require_nfc_for_payments is not None:
        policy.require_nfc_for_payments = body.require_nfc_for_payments
    policy.updated_at = datetime.now(timezone.utc)
    await session.flush()

    return OrganizationNfcPolicyPublic(
        org_id=str(policy.org_id),
        require_nfc_for_admins=policy.require_nfc_for_admins,
        require_nfc_for_payments=policy.require_nfc_for_payments,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
    )
