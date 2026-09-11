"""Digital passport request/response schemas."""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator

EducationDocType = Literal[
    "diploma",
    "certificate",
    "transcript",
    "degree",
    "course_completion",
    "license",
    "other",
]


class DigitalPassportIssueRequest(BaseModel):
    wallet_address: str = Field(..., min_length=42, max_length=42, description="0x-prefixed EVM address")
    nfc_credential_id: Optional[str] = Field(None, description="Optional bound NFC credential id")

    @field_validator("wallet_address")
    @classmethod
    def normalize_wallet(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.startswith("0x") or len(normalized) != 42:
            raise ValueError("wallet_address must be 0x + 40 hex chars")
        try:
            bytes.fromhex(normalized[2:])
        except ValueError as exc:
            raise ValueError("wallet_address must be hex") from exc
        return normalized


class DigitalPassportPublic(BaseModel):
    id: str
    user_id: str
    org_id: Optional[str] = None
    wallet_address: str
    token_id: int
    claim_hash: str
    chain_id: str
    contract_address: Optional[str] = None
    tx_hash: Optional[str] = None
    token_uri: Optional[str] = None
    status: str
    nfc_credential_id: Optional[str] = None
    issued_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    created_at: datetime
    explorer_url: Optional[str] = None


class DigitalPassportListResponse(BaseModel):
    items: list[DigitalPassportPublic]


class PassportEducationDocCreate(BaseModel):
    doc_type: EducationDocType = "diploma"
    title: str = Field(..., min_length=1, max_length=200)
    institution: Optional[str] = Field(None, max_length=200)
    program: Optional[str] = Field(None, max_length=200)
    credential_id: Optional[str] = Field(None, max_length=120)
    issued_on: Optional[str] = Field(None, max_length=32, description="ISO date YYYY-MM-DD")
    expires_on: Optional[str] = Field(None, max_length=32)
    country: Optional[str] = Field(None, max_length=80)
    grade: Optional[str] = Field(None, max_length=80)
    notes: Optional[str] = Field(None, max_length=2000)
    extra: Optional[dict[str, Any]] = None


class PassportEducationDocSummary(BaseModel):
    id: str
    passport_id: str
    doc_type: str
    title_hint: str
    institution_hint: Optional[str] = None
    cipher_id: str
    content_hash: str
    created_at: datetime
    updated_at: datetime


class PassportEducationDocPublic(PassportEducationDocSummary):
    """Owner-only decrypted view."""

    payload: dict[str, Any]


class PassportEducationDocListResponse(BaseModel):
    items: list[PassportEducationDocSummary]
    cipher_id: str


class PassportEducationCipherInfo(BaseModel):
    cipher_id: str
    algorithm: str
    kdf: str
    aad: str
    note: str
