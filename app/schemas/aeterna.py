"""AETERNA longevity / genomic wellness schemas (R12)."""
from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

# Keep vault metadata tiny — never accept genome blobs on the API host.
_METADATA_MAX_BYTES = 8_192
_BLOCKED_METADATA_KEYS = {
    "sequence",
    "fasta",
    "fastq",
    "genome",
    "genome_blob",
    "bases",
    "raw_dna",
    "cram",
    "bam",
    "pdb",
    "vcf_body",
}


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
    organ_bioprint = "organ_bioprint"


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
    content_sha256: str = Field(
        min_length=64,
        max_length=128,
        description="Client-side SHA-256 of the local export — genome bytes must not be uploaded",
    )
    format_hint: str = Field(default="vcf", max_length=32)
    consent_acknowledged: bool = Field(
        description="User must acknowledge genomic data processing + non-DIY editing policy"
    )
    metadata_json: dict = Field(
        default_factory=dict,
        description="Hash-only extras (filename, byte size). Max ~8KB; sequence blobs rejected.",
    )

    @field_validator("content_sha256")
    @classmethod
    def _sha_hex(cls, v: str) -> str:
        cleaned = v.strip().lower()
        if any(c not in "0123456789abcdef" for c in cleaned):
            raise ValueError("content_sha256 must be lowercase hex")
        return cleaned

    @field_validator("metadata_json")
    @classmethod
    def _metadata_hash_only(cls, v: dict) -> dict:
        raw = json.dumps(v, separators=(",", ":"), ensure_ascii=False)
        if len(raw.encode("utf-8")) > _METADATA_MAX_BYTES:
            raise ValueError("metadata_json exceeds 8KB — register hash only, not genome bytes")
        for key, val in v.items():
            key_l = str(key).lower()
            if key_l in _BLOCKED_METADATA_KEYS:
                raise ValueError(f"metadata key '{key}' not allowed — hash-only vault")
            if isinstance(val, str) and len(val) > 512:
                raise ValueError("metadata string values must be <= 512 chars (no sequence payloads)")
        return v


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
    metadata_json: dict = Field(default_factory=dict)
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
