"""Securities intake schemas (R9)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class SecurityInstrumentType(str, Enum):
    equity = "equity"
    promissory_note = "promissory_note"
    other_security = "other_security"


class SecurityIntakeStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    accepted = "accepted"
    pledged = "pledged"
    matured = "matured"
    settled = "settled"
    rejected = "rejected"
    returned = "returned"


class SecurityCustodyLocation(str, Enum):
    register_only = "register_only"
    partner = "partner"
    vault = "vault"


class SecurityIntakeCreate(BaseModel):
    instrument_type: SecurityInstrumentType
    issuer_name: str = Field(min_length=1, max_length=200)
    jurisdiction: str = Field(min_length=2, max_length=64)
    face_amount: Decimal = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=8)
    isin: str | None = Field(default=None, max_length=16)
    maturity_at: datetime | None = None
    share_count: Decimal | None = Field(default=None, ge=0)
    document_hash: str | None = Field(default=None, min_length=64, max_length=128)
    document_uri: str | None = Field(default=None, max_length=512)
    metadata_json: dict = Field(default_factory=dict)
    notes: str | None = Field(default=None, max_length=2000)


class SecurityIntakeReview(BaseModel):
    decision: SecurityIntakeStatus
    rejection_reason: str | None = Field(default=None, max_length=1000)
    custody_location: SecurityCustodyLocation = SecurityCustodyLocation.register_only
    custodian_ref: str | None = Field(default=None, max_length=200)
    haircut_bps: int = Field(default=2500, ge=0, le=10000)


class SecurityInstrumentPublic(BaseModel):
    id: UUID
    org_id: UUID
    instrument_type: SecurityInstrumentType
    issuer_name: str
    jurisdiction: str
    face_amount: Decimal
    currency: str
    isin: str | None
    maturity_at: datetime | None
    share_count: Decimal | None
    document_hash: str | None
    document_uri: str | None
    metadata_json: dict
    created_at: datetime


class SecurityIntakePublic(BaseModel):
    id: UUID
    org_id: UUID
    instrument_id: UUID
    status: SecurityIntakeStatus
    submitted_by: UUID
    reviewer_id: UUID | None
    rejection_reason: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None
    reviewed_at: datetime | None
    instrument: SecurityInstrumentPublic | None = None


class SecurityCustodyPositionPublic(BaseModel):
    id: UUID
    org_id: UUID
    instrument_id: UUID
    intake_id: UUID
    location: SecurityCustodyLocation
    custodian_ref: str | None
    haircut_bps: int
    collateral_credit_acp: Decimal
    status: str
    created_at: datetime


class SecurityDeskSummary(BaseModel):
    org_id: UUID
    intakes_total: int
    intakes_open: int
    positions_active: int
    collateral_credit_acp_total: Decimal
