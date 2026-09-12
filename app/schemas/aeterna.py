"""AETERNA longevity / genomic wellness schemas (R12)."""
from __future__ import annotations

import ipaddress
import json
from datetime import datetime
from decimal import Decimal
from enum import Enum
from urllib.parse import urlparse
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
    molecular_aging_profile = "molecular_aging_profile"
    partial_reprogramming_consult = "partial_reprogramming_consult"
    vet_feline_cryo_restore = "vet_feline_cryo_restore"
    vet_canine_regen_pod = "vet_canine_regen_pod"
    vinci_light_chamber = "vinci_light_chamber"


class AeternaDnaSource(str, Enum):
    sequencing_com = "sequencing_com"
    upload = "upload"
    partner_lab = "partner_lab"
    venous_blood_rna = "venous_blood_rna"
    other = "other"


class AeternaAgingHallmarkPublic(BaseModel):
    """One axis of the AETERNA molecular aging profile (15-mechanism panel).

    Inspired by blood RNA / PCR expression panels that map age-dependent gene
    activity to hallmarks of aging — not a single \"biological age\" score.
    Educational / partner-consult framing only.
    """

    id: str
    title: str
    gene_pair_hint: str
    theme: str


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

    @field_validator("source_uri")
    @classmethod
    def _https_public_uri(cls, v: str | None) -> str | None:
        if v is None:
            return None
        text = v.strip()
        if not text:
            return None
        parsed = urlparse(text)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("source_uri must be a public https URL")
        host = parsed.hostname.lower().rstrip(".")
        if host in {"localhost", "127.0.0.1", "::1"} or host.endswith(".local") or host.endswith(".internal"):
            raise ValueError("source_uri host is not allowed")
        try:
            ip = ipaddress.ip_address(host)
        except ValueError:
            return text
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValueError("source_uri host is not allowed")
        return text

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
    aging_hallmarks: list[AeternaAgingHallmarkPublic] = Field(default_factory=list)
    molecular_aging_note: str = (
        "Molecular aging profile maps 15 hallmark axes from consented blood-RNA / "
        "panel metadata — individual configuration of aging processes, not one universal bio-age number."
    )
    reprogramming_note: str = (
        "Public USPTO notice of allowance (announced 27 August 2026) for ionizable lipids "
        "in the eTurna LNP mRNA-delivery platform is educational context for licensed-partner "
        "partial-reprogramming consults — not an issued drug, not a wet-lab recipe, and not "
        "an ANCAP affiliation with Daewoong Pharmaceutical or Turn Biotechnologies."
    )
    vet_regen_note: str = (
        "Veterinary organ rails (feline tissue cryoconservator-restorer and canine VET REGEN POD) "
        "are licensed-partner consult / intake briefs. Infographics are conceptual architecture, "
        "not a marketed veterinary device, not a survival-rate claim, and not a return-to-life warranty."
    )
    vinci_light_note: str = (
        "The Vinci light / photobiomodulation chamber is a licensed-partner consult and session-protocol "
        "brief. Infographics are conceptual architecture inspired by Leonardo-era sunlight-and-health literacy "
        "— not a reconstructed invention, not a marketed phototherapy device, and not a safe-tanning claim."
    )
