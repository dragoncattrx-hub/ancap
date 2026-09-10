"""IMAP/SMTP provider account connect API."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.mail_accounts import (
    MailImapSmtpConnect,
    MailImapSmtpTestRequest,
    MailImapSmtpTestResult,
    MailProviderAccountPublic,
    MailProviderDefaultsPublic,
)
from app.services import mail_accounts as svc

router = APIRouter(tags=["mail-accounts"])


@router.get("/mail/accounts/defaults", response_model=MailProviderDefaultsPublic)
async def mail_account_defaults():
    return svc.defaults()


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
