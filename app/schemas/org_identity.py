"""Organization identity / NFC verification schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.db.models import MemberVerificationStatusEnum


class NfcCredentialRegisterRequest(BaseModel):
    uid_hash: str = Field(..., min_length=16, max_length=128, description="SHA-256 hex hash of NFC UID; raw UID never sent")
    label: Optional[str] = Field(None, max_length=120)

    @field_validator("uid_hash")
    @classmethod
    def normalize_uid_hash(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("uid_hash is required")
        return normalized


class NfcCredentialPublic(BaseModel):
    id: str
    label: Optional[str] = None
    uid_hash: str
    vendor: str
    created_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool = True


class MemberVerifyRequest(BaseModel):
    nfc_uid_hash: Optional[str] = Field(None, max_length=128)
    employee_code: Optional[str] = Field(None, max_length=64)

    @field_validator("nfc_uid_hash")
    @classmethod
    def normalize_nfc_uid_hash(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().lower()
        return normalized or None


class MemberVerificationStatusUpdate(BaseModel):
    verification_status: MemberVerificationStatusEnum


class MemberVerificationPublic(BaseModel):
    user_id: str
    role: str
    employee_code: Optional[str] = None
    verification_status: str
    nfc_uid_hash: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by_user_id: Optional[str] = None
    joined_at: Optional[datetime] = None
    user_email: Optional[str] = None


class OrganizationNfcPolicyPublic(BaseModel):
    org_id: str
    require_nfc_for_admins: bool = False
    require_nfc_for_payments: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class OrganizationNfcPolicyUpdate(BaseModel):
    require_nfc_for_admins: Optional[bool] = None
    require_nfc_for_payments: Optional[bool] = None
