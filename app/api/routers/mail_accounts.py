"""IMAP/SMTP provider account connect API (+ Instantly.ai v2)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_auth
from app.schemas.instantly import InstantlyImapAccountCreate, InstantlyStatusPublic
from app.schemas.mail_accounts import (
    MailImapSmtpConnect,
    MailImapSmtpTestRequest,
    MailImapSmtpTestResult,
    MailProviderAccountPublic,
    MailProviderDefaultsPublic,
)
from app.services import instantly as instantly_svc
from app.services import mail_accounts as svc

router = APIRouter(tags=["mail-accounts"])


@router.get("/mail/accounts/defaults", response_model=MailProviderDefaultsPublic)
async def mail_account_defaults():
    return svc.defaults()


@router.get("/mail/instantly/status", response_model=InstantlyStatusPublic)
async def instantly_status():
    return InstantlyStatusPublic(**instantly_svc.status_public())


@router.get("/mail/instantly/accounts")
async def instantly_list_accounts(
    limit: int = Query(default=20, ge=1, le=100),
    user_id: str = Depends(require_auth),
) -> Any:
    _ = user_id
    return await instantly_svc.list_accounts(limit=limit)


@router.post("/mail/instantly/accounts", status_code=201)
async def instantly_create_account(
    body: InstantlyImapAccountCreate,
    user_id: str = Depends(require_auth),
) -> Any:
    _ = user_id
    smtp_user = (body.smtp_username or body.imap_username).strip()
    smtp_pass = body.smtp_password if body.smtp_password is not None else body.imap_password
    return await instantly_svc.create_custom_imap_account(
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        imap_username=body.imap_username,
        imap_password=body.imap_password,
        imap_host=body.imap_host,
        imap_port=body.imap_port,
        smtp_username=smtp_user,
        smtp_password=smtp_pass,
        smtp_host=body.smtp_host,
        smtp_port=body.smtp_port,
    )


@router.post("/mail/accounts/test", response_model=MailImapSmtpTestResult)
async def mail_account_test(
    body: MailImapSmtpTestRequest,
    user_id: str = Depends(require_auth),
):
    _ = user_id
    return svc.test_connection(body)


@router.get("/mail/accounts/me", response_model=MailProviderAccountPublic | None)
async def mail_account_me(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.get_account(session, user_id=user_id)


@router.post("/mail/accounts", response_model=MailProviderAccountPublic, status_code=201)
async def mail_account_connect(
    body: MailImapSmtpConnect,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.connect_account(session, user_id=user_id, body=body)


@router.delete("/mail/accounts/me", status_code=204)
async def mail_account_delete(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await svc.delete_account(session, user_id=user_id)
    return None
