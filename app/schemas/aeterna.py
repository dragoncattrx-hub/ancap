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
    microwave_body_contouring = "microwave_body_contouring"
    biofusion_micromanipulation = "biofusion_micromanipulation"
    dpsc_biomaterial = "dpsc_biomaterial"
    vascular_care_plus = "vascular_care_plus"
    vascular_care = "vascular_care"
    transdermal_pistol = "transdermal_pistol"
    m_receptor_subscription = "m_receptor_subscription"
    oxygen_carrier_brief = "oxygen_carrier_brief"
    synthetic_blood_mamba_brief = "synthetic_blood_mamba_brief"
    adhd_support_brief = "adhd_support_brief"
    pulmopure_subscription = "pulmopure_subscription"
    barsuk_quantum_pen_brief = "barsuk_quantum_pen_brief"
    teleport_earphones_brief = "teleport_earphones_brief"
    installation_project_brief = "installation_project_brief"


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
    microwave_body_note: str = (
        "Microwave body contouring (2.45 / 5.8 GHz ISM, contact-cooled applicator) is a licensed aesthetic / "
        "dermatology partner session-protocol brief. Infographics are conceptual architecture — not a marketed "
        "medical device, not liposuction, and not a guaranteed fat-loss or body-contour claim."
    )
    biofusion_note: str = (
        "The BioFusion micromanipulation chamber is a licensed-partner consult and session-protocol brief "
        "for IVF/ICSI, plant pollination, embryo observation literacy, and microorganism handling in a "
        "controlled lab. Infographics are conceptual architecture — not a marketed medical device, not a "
        "fertility clinic, not a guaranteed pregnancy or embryo, and not a gene-editing or pathogen kit."
    )
    dpsc_biomaterial_note: str = (
        "Wisdom-tooth dental pulp stem cell (DPSC) biomaterial is a licensed bioreactor-partner intake to "
        "expand autologous DPSC into a tissue construct. It is not a full organ print (that SKU remains "
        "250,000 ACP), not an FDA/CE cell therapy, and not a home culture kit."
    )
    vascular_care_plus_note: str = (
        "Vascular Care+ (anhydrous N2+O2 flow plus light-wave applicator) is a licensed phlebology / "
        "vascular / aesthetic partner session-protocol brief. Infographics are conceptual architecture — "
        "not a marketed medical device, not a thrombosis treatment, and not a guaranteed varicose-vein cure."
    )
    vascular_care_note: str = (
        "Vascular Care (ultrasound / radiofrequency / thermal applicator) is a licensed phlebology / "
        "vascular / aesthetic partner session-protocol brief. Infographics are conceptual architecture — "
        "not a marketed medical device, not surgery, and not a guaranteed vein-diameter or oedema claim."
    )
    transdermal_pistol_note: str = (
        "Needle-free transdermal pistol (aerosol + carrier gas) is a licensed clinic partner session-protocol "
        "brief. Infographics are conceptual architecture — not a prescription dispenser, not compounding, "
        "not a home injection kit, and not a guaranteed drug-delivery or fat-reduction claim."
    )
    m_receptor_note: str = (
        "The M-receptor delivery and neuromodulation rail is a licensed-clinic subscription: transdermal patch, "
        "iontophoresis, inhaler/nebulizer, and vagus-adjacent stimulation as architecture literacy. Infographics "
        "are conceptual — not a marketed device, not compounding of scopolamine or any muscarinic agonist/"
        "antagonist, and not a treatment claim for Parkinson, asthma, COPD, or arrhythmia."
    )
    oxygen_carrier_note: str = (
        "The artificial oxygen-carrier rail is a licensed bioreactor / transfusion-medicine partner brief "
        "for hemoglobin-vesicle or perfluorocarbon-emulsion architecture literacy. Infographics are conceptual "
        "— not a blood product, not compounding of hemoglobin or PFC, not a CE/FDA oxygen therapeutic, and "
        "not a manufacturing SOP."
    )
    synthetic_blood_mamba_note: str = (
        "The synthetic-blood / Black Mamba peptide architecture rail is a licensed bioreactor / "
        "transfusion-medicine partner brief. Infographics are conceptual literacy — not a blood product, "
        "not compounding of venom peptides, hemoglobin or PFC, not a CE/FDA therapeutic, and not a "
        "toxin or manufacturing SOP."
    )
    adhd_support_note: str = (
        "The ADHD / СДВГ support rail is a licensed clinician partner brief for attention, planning, "
        "emotion, and school-adaptation literacy. Infographics are motivational architecture — not a "
        "diagnosis, not a prescription, not stimulant compounding, and not a guaranteed academic or "
        "financial outcome."
    )
    pulmopure_note: str = (
        "The PulmoPure rail is a licensed pulmonology / respiratory clinic subscription for gas-vibration "
        "and lavender-oil architecture literacy. Infographics are conceptual — not a CE/FDA device sold by "
        "ANCAP, not ozone therapy, not medical-gas compounding, and not a guaranteed tar-clearance or "
        "'clean lungs' outcome."
    )
    barsuk_note: str = (
        "Project Barsuk / quantum-pen rail is a licensed secure-comms partner brief for conceptual "
        "pen-form cryptography, sensor, and smart-ink literacy. Infographics are fiction / architecture "
        "literacy — not a Parker product, not a CE/FDA device, not a military weapon, and not unbreakable "
        "crypto sold by ANCAP."
    )
    teleport_earphones_note: str = (
        "AIRPODS T-2026 / teleport-earphones rail is a licensed partner brief for fictional medical-evacuation "
        "and quantum-comms literacy. Infographics are sci-fi architecture — not an Apple product, not a real "
        "teleporter, not a military weapon system, and not a guaranteed evacuation outcome."
    )
    installation_project_note: str = (
        "Installation Project (Проект Установки) is a licensed neonatology / infant-nutrition partner brief "
        "for high-protein natural-synthetic milk line literacy (up to ~1,000 L/day conceptual capacity) and "
        "neonatal hyperbaric-chamber architecture (1.5–2.0 ATA literacy). Infographics are partner architecture "
        "— not infant formula sold by ANCAP, not a CE/FDA device, not home HBO, and not a guaranteed growth "
        "or infection-risk outcome."
    )

