"""AETERNA longevity / genomic wellness schemas (R12)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class AeternaIntentKind(str, Enum):
    """Marketplace intent categories — analysis / partner-clinic referral only.

    ANCAP does not ship wet-lab CRISPR instructions, DIY gene therapy, or
    consumer enhancement protocols. Paid workflows produce reports, consult
    briefs, and licensed-partner handoffs settled in ACP.
    """

    pigmentation_consult = "pigmentation_consult"
    telomere_panel_review = "telomere_panel_review"
    disease_risk_report = "disease_risk_report"
    longevity_plan = "longevity_plan"
    dna_sandbox_explore = "dna_sandbox_explore"
    partner_clinic_match = "partner_clinic_match"


class AeternaDnaSource(str, Enum):
    sequencing_com = "sequencing_com"
    upload = "upload"
    partner_lab = "partner_lab"
    other = "other"


class AeternaVaultStatus(str, Enum):
    pending = "pending"
    indexed = "indexed"
    quarantined = "quarantined"
    deleted = "deleted"


class AeternaOrderStatus(str, Enum):
    draft = "draft"
    paid = "paid"
    in_review = "in_review"
    delivered = "delivered"
    cancelled = "cancelled"
    refunded = "refunded"


class AeternaDnaVaultCreate(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    source: AeternaDnaSource = AeternaDnaSource.upload
    source_uri: str | None = Field(
        default=None,
        max_length=512,
        description="Optional Sequencing.com (or partner) deep-link / export URI",
    )
    content_sha256: str = Field(min_length=64, max_length=128)
    format_hint: str = Field(default="vcf", max_length=32)
    consent_acknowledged: bool = Field(
        description="User must acknowledge genomic data processing + non-DIY editing policy"
    )
    metadata_json: dict = Field(default_factory=dict)


class AeternaDnaVaultPublic(BaseModel):
    id: UUID
    org_id: UUID | None
    owner_user_id: UUID
    label: str
    source: AeternaDnaSource
    source_uri: str | None
    content_sha256: str
    format_hint: str
    status: AeternaVaultStatus
    created_at: datetime
    updated_at: datetime


class AeternaIntentOrderCreate(BaseModel):
    intent_kind: AeternaIntentKind
    vault_id: UUID | None = None
    workflow_slug: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=2000)
    budget_acp: Decimal = Field(gt=0)
    metadata_json: dict = Field(default_factory=dict)


class AeternaIntentOrderPublic(BaseModel):
    id: UUID
    org_id: UUID | None
    owner_user_id: UUID
    intent_kind: AeternaIntentKind
    vault_id: UUID | None
    workflow_slug: str | None
    status: AeternaOrderStatus
    budget_acp: Decimal
    notes: str | None
    created_at: datetime
    updated_at: datetime


class AeternaPartnerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    jurisdiction: str = Field(min_length=2, max_length=64)
    license_ref: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=512)
    supported_intents: list[AeternaIntentKind] = Field(default_factory=list)
    metadata_json: dict = Field(default_factory=dict)


class AeternaPartnerPublic(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    jurisdiction: str
    license_ref: str | None
    website: str | None
    supported_intents: list[AeternaIntentKind]
    verified: bool
    created_at: datetime


class AeternaStatusPublic(BaseModel):
    feature_enabled: bool
    division: str = "AETERNA"
    tagline: str
    vault_entries: int
    intent_orders: int
    partners_verified: int
    workflow_slugs: list[str]
    sequencing_import_hint: str
    compliance_note: str
    next_gate: str
