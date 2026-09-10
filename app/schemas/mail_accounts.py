"""Schemas for user IMAP/SMTP provider account connect."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MailProviderKind(str, Enum):
    imap_smtp = "imap_smtp"


class MailAccountStatus(str, Enum):
    draft = "draft"
    connected = "connected"
    error = "error"


class MailImapSmtpConnect(BaseModel):
    """Connect any provider account via IMAP + SMTP (single account)."""

    display_name: str | None = Field(default=None, max_length=160)
    email_address: str = Field(..., min_length=3, max_length=320)
    imap_username: str = Field(..., min_length=1, max_length=320)
    imap_password: str = Field(..., min_length=1, max_length=512)
    imap_host: str = Field(..., min_length=1, max_length=255)
    imap_port: int = Field(default=993, ge=1, le=65535)
    imap_use_ssl: bool = True
    smtp_username: str | None = Field(default=None, max_length=320)
    smtp_password: str | None = Field(default=None, max_length=512)
    smtp_host: str = Field(..., min_length=1, max_length=255)
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    verify: bool = Field(
        default=True,
        description="If true, test IMAP (and SMTP login) before saving.",
    )
    push_to_instantly: bool = Field(
        default=False,
        description="If true and Instantly is configured, also create Custom IMAP/SMTP account via Instantly API v2.",
    )
    first_name: str | None = Field(default=None, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)

    @field_validator("email_address", "imap_username", "imap_host", "smtp_host", mode="before")
    @classmethod
    def _strip(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v


class MailImapSmtpTestRequest(BaseModel):
    """Test IMAP/SMTP without persisting."""

    imap_username: str = Field(..., min_length=1, max_length=320)
    imap_password: str = Field(..., min_length=1, max_length=512)
    imap_host: str = Field(..., min_length=1, max_length=255)
    imap_port: int = Field(default=993, ge=1, le=65535)
    imap_use_ssl: bool = True
    smtp_username: str | None = Field(default=None, max_length=320)
    smtp_password: str | None = Field(default=None, max_length=512)
    smtp_host: str | None = Field(default=None, max_length=255)
    smtp_port: int = Field(default=587, ge=1, le=65535)
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    test_smtp: bool = True


class MailImapSmtpTestResult(BaseModel):
    ok: bool
    imap_ok: bool
    smtp_ok: bool | None = None
    detail: str


class MailProviderAccountPublic(BaseModel):
    id: UUID
    display_name: str | None = None
    email_address: str
    provider_kind: MailProviderKind = MailProviderKind.imap_smtp
    imap_host: str
    imap_port: int
    imap_username: str
    imap_use_ssl: bool
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_use_tls: bool
    smtp_use_ssl: bool
    status: MailAccountStatus
    last_verified_at: datetime | None = None
    last_error: str | None = None
    instantly_email: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MailProviderDefaultsPublic(BaseModel):
    """Suggested defaults for ancap.cloud and common providers."""

    title: str = "Single Account"
    subtitle: str = "Connect Any Provider Account"
    protocol: str = "IMAP / SMTP"
    imap_host: str = "mail.ancap.cloud"
    imap_port: int = 993
    smtp_host: str = "mail.ancap.cloud"
    smtp_port: int = 587
    imap_use_ssl: bool = True
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    webmail_url: str = "https://webmail.ancap.cloud/"
    note: str = (
        "Username is usually the full email address. "
        "For ancap.cloud mailboxes use IMAP 993 (SSL) and SMTP 587 (STARTTLS) or 465 (SSL). "
        "Optional: push the same credentials to Instantly.ai API v2 as Custom IMAP/SMTP."
    )
    instantly_enabled: bool = False
    instantly_configured: bool = False
    instantly_api_base: str = "https://api.instantly.ai/api/v2"
