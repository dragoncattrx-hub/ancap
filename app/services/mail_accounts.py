"""Connect and verify user IMAP/SMTP provider accounts (single account)."""
from __future__ import annotations

import base64
import hashlib
import imaplib
import os
import smtplib
from datetime import datetime, timezone
from uuid import uuid4

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import MailProviderAccount
from app.schemas.mail_accounts import (
    MailAccountStatus,
    MailImapSmtpConnect,
    MailImapSmtpTestRequest,
    MailImapSmtpTestResult,
    MailProviderAccountPublic,
    MailProviderDefaultsPublic,
    MailProviderKind,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _secret_key_bytes() -> bytes:
    settings = get_settings()
    raw = (settings.secret_key or "ancap-dev-mail-account-key").encode("utf-8")
    return hashlib.sha256(raw + b"|mail-provider-accounts-v1").digest()


def _encrypt_secret(plaintext: str) -> str:
    key = _secret_key_bytes()
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.urlsafe_b64encode(nonce + ct).decode("ascii")


def _decrypt_secret(blob: str) -> str:
    raw = base64.urlsafe_b64decode(blob.encode("ascii"))
    nonce, ct = raw[:12], raw[12:]
    pt = AESGCM(_secret_key_bytes()).decrypt(nonce, ct, None)
    return pt.decode("utf-8")


def _test_imap(
    *,
    host: str,
    port: int,
    username: str,
    password: str,
    use_ssl: bool,
    timeout: float = 12.0,
) -> None:
    client: imaplib.IMAP4 | imaplib.IMAP4_SSL
    if use_ssl:
        client = imaplib.IMAP4_SSL(host, port, timeout=timeout)
    else:
        client = imaplib.IMAP4(host, port, timeout=timeout)
    try:
        typ, _ = client.login(username, password)
        if typ != "OK":
            raise RuntimeError("IMAP login failed")
        client.select("INBOX", readonly=True)
    finally:
        try:
            client.logout()
        except Exception:
            pass


def _test_smtp(
    *,
    host: str,
    port: int,
    username: str,
    password: str,
    use_tls: bool,
    use_ssl: bool,
    timeout: float = 12.0,
) -> None:
    if use_ssl:
        server: smtplib.SMTP = smtplib.SMTP_SSL(host, port, timeout=timeout)
    else:
        server = smtplib.SMTP(host, port, timeout=timeout)
    try:
        server.ehlo()
        if use_tls and not use_ssl:
            server.starttls()
            server.ehlo()
        server.login(username, password)
    finally:
        try:
            server.quit()
        except Exception:
            pass


def defaults() -> MailProviderDefaultsPublic:
    return MailProviderDefaultsPublic()


def _public(row: MailProviderAccount) -> MailProviderAccountPublic:
    return MailProviderAccountPublic(
        id=row.id,
        display_name=row.display_name,
        email_address=row.email_address,
        provider_kind=MailProviderKind(row.provider_kind),
        imap_host=row.imap_host,
        imap_port=row.imap_port,
        imap_username=row.imap_username,
        imap_use_ssl=bool(row.imap_use_ssl),
        smtp_host=row.smtp_host,
        smtp_port=row.smtp_port,
        smtp_username=row.smtp_username,
        smtp_use_tls=bool(row.smtp_use_tls),
        smtp_use_ssl=bool(row.smtp_use_ssl),
        status=MailAccountStatus(row.status),
        last_verified_at=row.last_verified_at,
        last_error=row.last_error,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def get_account(session: AsyncSession, *, user_id: str) -> MailProviderAccountPublic | None:
    stmt = select(MailProviderAccount).where(MailProviderAccount.owner_user_id == user_id)
    row = (await session.execute(stmt)).scalar_one_or_none()
    return _public(row) if row else None


def test_connection(body: MailImapSmtpTestRequest) -> MailImapSmtpTestResult:
    imap_ok = False
    smtp_ok: bool | None = None
    try:
        _test_imap(
            host=body.imap_host.strip(),
            port=body.imap_port,
            username=body.imap_username.strip(),
            password=body.imap_password,
            use_ssl=body.imap_use_ssl,
        )
        imap_ok = True
    except Exception as exc:  # noqa: BLE001 — surface provider errors to client
        return MailImapSmtpTestResult(
            ok=False,
            imap_ok=False,
            smtp_ok=None,
            detail=f"IMAP failed: {exc}",
        )

    if body.test_smtp and body.smtp_host:
        smtp_user = (body.smtp_username or body.imap_username).strip()
        smtp_pass = body.smtp_password if body.smtp_password is not None else body.imap_password
        try:
            _test_smtp(
                host=body.smtp_host.strip(),
                port=body.smtp_port,
                username=smtp_user,
                password=smtp_pass,
                use_tls=body.smtp_use_tls,
                use_ssl=body.smtp_use_ssl,
            )
            smtp_ok = True
        except Exception as exc:  # noqa: BLE001
            return MailImapSmtpTestResult(
                ok=False,
                imap_ok=True,
                smtp_ok=False,
                detail=f"SMTP failed: {exc}",
            )

    return MailImapSmtpTestResult(
        ok=True,
        imap_ok=imap_ok,
        smtp_ok=smtp_ok,
        detail="Connection verified",
    )


async def connect_account(
    session: AsyncSession, *, user_id: str, body: MailImapSmtpConnect
) -> MailProviderAccountPublic:
    smtp_user = (body.smtp_username or body.imap_username).strip()
    smtp_pass = body.smtp_password if body.smtp_password is not None else body.imap_password

    if body.verify:
        result = test_connection(
            MailImapSmtpTestRequest(
                imap_username=body.imap_username,
                imap_password=body.imap_password,
                imap_host=body.imap_host,
                imap_port=body.imap_port,
                imap_use_ssl=body.imap_use_ssl,
                smtp_username=smtp_user,
                smtp_password=smtp_pass,
                smtp_host=body.smtp_host,
                smtp_port=body.smtp_port,
                smtp_use_tls=body.smtp_use_tls,
                smtp_use_ssl=body.smtp_use_ssl,
                test_smtp=True,
            )
        )
        if not result.ok:
            raise HTTPException(status_code=400, detail=result.detail)

    now = _utcnow()
    stmt = select(MailProviderAccount).where(MailProviderAccount.owner_user_id == user_id)
    existing = (await session.execute(stmt)).scalar_one_or_none()

    if existing is None:
        existing = MailProviderAccount(
            id=str(uuid4()),
            owner_user_id=user_id,
            created_at=now,
        )
        session.add(existing)

    existing.display_name = (body.display_name or "").strip() or None
    existing.email_address = body.email_address.strip()
    existing.provider_kind = MailProviderKind.imap_smtp.value
    existing.imap_host = body.imap_host.strip()
    existing.imap_port = body.imap_port
    existing.imap_username = body.imap_username.strip()
    existing.imap_password_enc = _encrypt_secret(body.imap_password)
    existing.imap_use_ssl = body.imap_use_ssl
    existing.smtp_host = body.smtp_host.strip()
    existing.smtp_port = body.smtp_port
    existing.smtp_username = smtp_user
    existing.smtp_password_enc = _encrypt_secret(smtp_pass)
    existing.smtp_use_tls = body.smtp_use_tls
    existing.smtp_use_ssl = body.smtp_use_ssl
    existing.status = MailAccountStatus.connected.value
    existing.last_verified_at = now if body.verify else existing.last_verified_at
    existing.last_error = None
    existing.updated_at = now

    await session.flush()
    return _public(existing)


async def delete_account(session: AsyncSession, *, user_id: str) -> None:
    stmt = select(MailProviderAccount).where(MailProviderAccount.owner_user_id == user_id)
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="No connected mail account")
    await session.delete(row)
    await session.flush()
