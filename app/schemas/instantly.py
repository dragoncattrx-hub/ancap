"""Schemas for Instantly.ai API v2 integration."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class InstantlyStatusPublic(BaseModel):
    enabled: bool
    configured: bool
    api_base: str
    provider_custom_imap_smtp: int = 1
    docs: str = "https://developer.instantly.ai/"
    ancap_docs: str = "/docs/INSTANTLY_API.md"
    endpoints: dict[str, str] = Field(default_factory=dict)
    note: str = ""


class InstantlyImapAccountCreate(BaseModel):
    """Create Custom IMAP/SMTP account in Instantly (provider_code=1)."""

    email: str = Field(..., min_length=3, max_length=320)
    first_name: str = Field(default="ANCAP", max_length=80)
    last_name: str = Field(default="Mail", max_length=80)
    imap_username: str = Field(..., min_length=1, max_length=320)
    imap_password: str = Field(..., min_length=1, max_length=512)
    imap_host: str = Field(..., min_length=1, max_length=255)
    imap_port: int = Field(default=993, ge=1, le=65535)
    smtp_username: str | None = Field(default=None, max_length=320)
    smtp_password: str | None = Field(default=None, max_length=512)
    smtp_host: str = Field(..., min_length=1, max_length=255)
    smtp_port: int = Field(default=587, ge=1, le=65535)

    @field_validator("email", "imap_username", "imap_host", "smtp_host", mode="before")
    @classmethod
    def _strip(cls, v: object) -> object:
        if isinstance(v, str):
            return v.strip()
        return v
