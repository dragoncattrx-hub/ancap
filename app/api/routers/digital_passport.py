"""Digital passport HTTP surface."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.api.deps import DbSession, get_current_user_id
from app.db.models import DigitalPassport, OrganizationMember, OrgRoleEnum
from app.schemas.digital_passport import (
    DigitalPassportIssueRequest,
    DigitalPassportListResponse,
    DigitalPassportPublic,
    PassportEducationCipherInfo,
    PassportEducationDocCreate,
    PassportEducationDocListResponse,
    PassportEducationDocPublic,
    PassportEducationDocSummary,
)
from app.services import passport_crypto
from app.services import passport_education as edu_svc
from app.services.digital_passport import explorer_url, issue_passport, resolve_nfc_credential, revoke_passport

router = APIRouter(prefix="/passports", tags=["Digital Passport"])


def _require_auth_user_id(user_id: str | None) -> uuid.UUID:
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return uuid.UUID(user_id)


def _passport_public(rec: DigitalPassport) -> DigitalPassportPublic:
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


def _edu_summary(rec) -> PassportEducationDocSummary:
    return PassportEducationDocSummary(
        id=str(rec.id),
        passport_id=str(rec.passport_id),
        doc_type=rec.doc_type,
        title_hint=rec.title_hint,
        institution_hint=rec.institution_hint,
        cipher_id=rec.cipher_id,
        content_hash=rec.content_hash,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.get("/education/cipher", response_model=PassportEducationCipherInfo)
async def education_cipher_info():
    return PassportEducationCipherInfo(**edu_svc.cipher_info())


@router.get("/me", response_model=DigitalPassportListResponse)
async def list_my_passports(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    q = (
        select(DigitalPassport)
        .where(DigitalPassport.user_id == uid)
        .order_by(DigitalPassport.created_at.desc())
    )
    rows = list((await session.execute(q)).scalars().all())
    return DigitalPassportListResponse(items=[_passport_public(r) for r in rows])


@router.get("/{passport_id}", response_model=DigitalPassportPublic)
async def get_passport(
    passport_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        pid = uuid.UUID(passport_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid passport_id") from exc

    rec = await session.get(DigitalPassport, str(pid))
    if rec is None or str(rec.user_id) != str(uid):
        raise HTTPException(status_code=404, detail="Passport not found")
    return _passport_public(rec)


@router.get("/{passport_id}/metadata")
async def get_passport_metadata(passport_id: str, session: DbSession):
    """Public metadata URI referenced by on-chain tokenURI."""
    try:
        pid = uuid.UUID(passport_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid passport_id") from exc

    rec = await session.get(DigitalPassport, str(pid))
    if rec is None:
        raise HTTPException(status_code=404, detail="Passport not found")

    return {
        "name": f"ANCAP Digital Passport #{rec.token_id}",
        "description": "Soulbound org identity attestation. No PII on-chain.",
        "external_url": f"https://ancap.cloud/passport/{rec.id}",
        "attributes": [
            {"trait_type": "status", "value": rec.status.value},
            {"trait_type": "chain_id", "value": rec.chain_id},
            {"trait_type": "claim_hash", "value": rec.claim_hash},
        ],
    }


@router.get("/{passport_id}/education-docs", response_model=PassportEducationDocListResponse)
async def list_education_docs(
    passport_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        pid = uuid.UUID(passport_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid passport_id") from exc
    try:
        rows = await edu_svc.list_docs(session, passport_id=pid, user_id=uid)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return PassportEducationDocListResponse(
        items=[_edu_summary(r) for r in rows],
        cipher_id=edu_svc.cipher_info()["cipher_id"],
    )


@router.post(
    "/{passport_id}/education-docs",
    response_model=PassportEducationDocPublic,
    status_code=201,
)
async def create_education_doc(
    passport_id: str,
    body: PassportEducationDocCreate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        pid = uuid.UUID(passport_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid passport_id") from exc
    try:
        rec = await edu_svc.add_doc(session, passport_id=pid, user_id=uid, body=body)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    payload = passport_crypto.decrypt_payload(
        ciphertext_b64=rec.ciphertext_b64,
        nonce_b64=rec.nonce_b64,
    )
    return PassportEducationDocPublic(**_edu_summary(rec).model_dump(), payload=payload)


@router.get(
    "/{passport_id}/education-docs/{doc_id}",
    response_model=PassportEducationDocPublic,
)
async def get_education_doc(
    passport_id: str,
    doc_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        pid = uuid.UUID(passport_id)
        did = uuid.UUID(doc_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    try:
        rec, payload = await edu_svc.get_doc(
            session, passport_id=pid, doc_id=did, user_id=uid, decrypt=True
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Failed to decrypt document") from exc
    return PassportEducationDocPublic(**_edu_summary(rec).model_dump(), payload=payload or {})


@router.delete("/{passport_id}/education-docs/{doc_id}", status_code=204)
async def delete_education_doc(
    passport_id: str,
    doc_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        pid = uuid.UUID(passport_id)
        did = uuid.UUID(doc_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc
    try:
        await edu_svc.delete_doc(session, passport_id=pid, doc_id=did, user_id=uid)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return None


@router.post(
    "/organizations/{org_id}/issue",
    response_model=DigitalPassportPublic,
    status_code=201,
)
async def issue_org_passport(
    org_id: str,
    body: DigitalPassportIssueRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        oid = uuid.UUID(org_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid org_id") from exc

    member_q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == uid,
    )
    member = (await session.execute(member_q)).scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")

    nfc_cred = None
    if body.nfc_credential_id:
        try:
            cid = uuid.UUID(body.nfc_credential_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid nfc_credential_id") from exc
        nfc_cred = await resolve_nfc_credential(session, user_id=uid, nfc_credential_id=cid)
        if nfc_cred is None:
            raise HTTPException(status_code=404, detail="NFC credential not found")

    try:
        rec = await issue_passport(
            session,
            user_id=uid,
            org_id=oid,
            wallet_address=body.wallet_address,
            nfc_credential_id=nfc_cred.id if nfc_cred else None,
            member=member,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _passport_public(rec)


@router.post(
    "/organizations/{org_id}/members/{member_user_id}/issue",
    response_model=DigitalPassportPublic,
    status_code=201,
)
async def admin_issue_member_passport(
    org_id: str,
    member_user_id: str,
    body: DigitalPassportIssueRequest,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        oid = uuid.UUID(org_id)
        target_uid = uuid.UUID(member_user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc

    admin_q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == uid,
    )
    admin_member = (await session.execute(admin_q)).scalar_one_or_none()
    if admin_member is None:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    hierarchy = [OrgRoleEnum.viewer, OrgRoleEnum.member, OrgRoleEnum.admin, OrgRoleEnum.owner]
    if hierarchy.index(admin_member.role) < hierarchy.index(OrgRoleEnum.admin):
        raise HTTPException(status_code=403, detail="Requires admin role or higher")

    target_q = select(OrganizationMember).where(
        OrganizationMember.org_id == oid,
        OrganizationMember.user_id == target_uid,
    )
    target_member = (await session.execute(target_q)).scalar_one_or_none()
    if target_member is None:
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
            member=target_member,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return _passport_public(rec)


@router.post("/{passport_id}/revoke", response_model=DigitalPassportPublic)
async def revoke_passport_route(
    passport_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    uid = _require_auth_user_id(user_id)
    try:
        pid = uuid.UUID(passport_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid passport_id") from exc

    rec = await session.get(DigitalPassport, str(pid))
    if rec is None:
        raise HTTPException(status_code=404, detail="Passport not found")

    if rec.org_id is not None:
        admin_q = select(OrganizationMember).where(
            OrganizationMember.org_id == rec.org_id,
            OrganizationMember.user_id == uid,
        )
        admin_member = (await session.execute(admin_q)).scalar_one_or_none()
        if admin_member is None:
            raise HTTPException(status_code=403, detail="Forbidden")
        hierarchy = [OrgRoleEnum.viewer, OrgRoleEnum.member, OrgRoleEnum.admin, OrgRoleEnum.owner]
        if hierarchy.index(admin_member.role) < hierarchy.index(OrgRoleEnum.admin):
            raise HTTPException(status_code=403, detail="Requires admin role or higher")
    elif str(rec.user_id) != str(uid):
        raise HTTPException(status_code=403, detail="Forbidden")

    rec = await revoke_passport(session, rec)
    return _passport_public(rec)
