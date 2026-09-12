"""AETERNA longevity marketplace service (R12)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import (
    AeternaDnaVaultEntry,
    AeternaIntentOrder,
    AeternaPartner,
    OrgRoleEnum,
)
from app.schemas.aeterna import (
    AeternaAgingHallmarkPublic,
    AeternaDnaVaultCreate,
    AeternaDnaVaultPublic,
    AeternaIntentKind,
    AeternaIntentOrderCreate,
    AeternaIntentOrderPublic,
    AeternaOrderStatus,
    AeternaPartnerCreate,
    AeternaPartnerPublic,
    AeternaStatusPublic,
    AeternaVaultStatus,
)
from app.services.org_access import require_org_role

AETERNA_WORKFLOW_SLUGS = [
    "aeterna-dna-wellness-report",
    "aeterna-longevity-panel-brief",
    "aeterna-pigmentation-consult-brief",
    "aeterna-telomere-panel-review",
    "aeterna-disease-risk-navigator",
    "aeterna-molecular-aging-profile",
    "aeterna-stem-cell-organ-print",
    "aeterna-mrna-reprogramming-brief",
    "aeterna-vet-cat-cryo-restore",
    "aeterna-vet-regen-pod",
]

ORGAN_PRINT_SLUG = "aeterna-stem-cell-organ-print"
ORGAN_PRINT_PRICE_ACP = Decimal("250000")
MOLECULAR_AGING_SLUG = "aeterna-molecular-aging-profile"
MRNA_REPROGRAMMING_SLUG = "aeterna-mrna-reprogramming-brief"
VET_CAT_CRYO_SLUG = "aeterna-vet-cat-cryo-restore"
VET_CAT_CRYO_PRICE_ACP = Decimal("75000")
VET_REGEN_POD_SLUG = "aeterna-vet-regen-pod"
VET_REGEN_POD_PRICE_ACP = Decimal("180000")

# 15 hallmark axes for partner-ready molecular aging briefs (blood RNA / PCR-style panels).
# Gene-pair hints are educational placeholders for consult prep — not diagnostic assays.
AETERNA_AGING_HALLMARKS: list[AeternaAgingHallmarkPublic] = [
    AeternaAgingHallmarkPublic(
        id="dna_repair",
        title="DNA repair",
        gene_pair_hint="repair sensor / effector pair",
        theme="genomic_instability",
    ),
    AeternaAgingHallmarkPublic(
        id="telomere_maintenance",
        title="Telomere maintenance",
        gene_pair_hint="shelterin / telomerase-axis pair",
        theme="telomere_attrition",
    ),
    AeternaAgingHallmarkPublic(
        id="epigenetic_regulation",
        title="Epigenetic regulation",
        gene_pair_hint="writer / eraser pair",
        theme="epigenetic_alterations",
    ),
    AeternaAgingHallmarkPublic(
        id="proteostasis",
        title="Proteostasis",
        gene_pair_hint="chaperone / proteasome pair",
        theme="loss_of_proteostasis",
    ),
    AeternaAgingHallmarkPublic(
        id="autophagy",
        title="Autophagy",
        gene_pair_hint="initiation / clearance pair",
        theme="disabled_macroautophagy",
    ),
    AeternaAgingHallmarkPublic(
        id="energy_metabolism",
        title="Energy metabolism",
        gene_pair_hint="glycolysis / OXPHOS balance pair",
        theme="deregulated_nutrient_sensing",
    ),
    AeternaAgingHallmarkPublic(
        id="cellular_senescence",
        title="Cellular senescence",
        gene_pair_hint="SASP / checkpoint pair",
        theme="cellular_senescence",
    ),
    AeternaAgingHallmarkPublic(
        id="stem_cell_maintenance",
        title="Stem-cell maintenance",
        gene_pair_hint="niche / renewal pair",
        theme="stem_cell_exhaustion",
    ),
    AeternaAgingHallmarkPublic(
        id="mitochondrial_function",
        title="Mitochondrial function",
        gene_pair_hint="biogenesis / quality-control pair",
        theme="mitochondrial_dysfunction",
    ),
    AeternaAgingHallmarkPublic(
        id="inflammatory_tone",
        title="Inflammatory tone",
        gene_pair_hint="pro- / anti-inflammatory pair",
        theme="chronic_inflammation",
    ),
    AeternaAgingHallmarkPublic(
        id="intercellular_signaling",
        title="Intercellular signaling",
        gene_pair_hint="ligand / receptor pair",
        theme="altered_communication",
    ),
    AeternaAgingHallmarkPublic(
        id="extracellular_matrix",
        title="Extracellular matrix integrity",
        gene_pair_hint="matrix build / remodel pair",
        theme="tissue_integrity",
    ),
    AeternaAgingHallmarkPublic(
        id="circadian_systemic",
        title="Circadian / systemic regulation",
        gene_pair_hint="clock / effector pair",
        theme="systemic_regulation",
    ),
    AeternaAgingHallmarkPublic(
        id="immune_aging",
        title="Immune aging",
        gene_pair_hint="innate / adaptive balance pair",
        theme="immunosenescence",
    ),
    AeternaAgingHallmarkPublic(
        id="nutrient_sensing",
        title="Nutrient sensing",
        gene_pair_hint="mTOR / AMPK-axis pair",
        theme="nutrient_sensing",
    ),
]

AETERNA_INTENT_DEFAULT_SLUGS: dict[str, str] = {
    AeternaIntentKind.pigmentation_consult.value: "aeterna-pigmentation-consult-brief",
    AeternaIntentKind.telomere_panel_review.value: "aeterna-telomere-panel-review",
    AeternaIntentKind.disease_risk_report.value: "aeterna-disease-risk-navigator",
    AeternaIntentKind.longevity_plan.value: "aeterna-longevity-panel-brief",
    AeternaIntentKind.dna_sandbox_explore.value: "aeterna-dna-wellness-report",
    AeternaIntentKind.partner_clinic_match.value: "aeterna-longevity-panel-brief",
    AeternaIntentKind.organ_bioprint.value: ORGAN_PRINT_SLUG,
    AeternaIntentKind.molecular_aging_profile.value: MOLECULAR_AGING_SLUG,
    AeternaIntentKind.partial_reprogramming_consult.value: MRNA_REPROGRAMMING_SLUG,
    AeternaIntentKind.vet_feline_cryo_restore.value: VET_CAT_CRYO_SLUG,
    AeternaIntentKind.vet_canine_regen_pod.value: VET_REGEN_POD_SLUG,
}

ORGAN_PRINT_HANDOFF_META = {
    "manufacturing_mode": "licensed_partner_bioreactor",
    "unit": "per_organ",
    "price_acp": "250000",
    "primary_cell_source": "autologous_stem_cells",
    "fallback_cell_source": "wisdom_tooth_dental_pulp_stem_cells_dpsc",
    "note": (
        "ANCAP settles ACP and issues a partner handoff brief. "
        "Printing occurs only in a licensed biochemical reactor operated by a verified partner — not a home kit."
    ),
}

MOLECULAR_AGING_META = {
    "panel_axes": 15,
    "sample_hint": "venous_blood_rna_expression_or_partner_pcr_metadata",
    "output_style": "per_hallmark_configuration_not_single_bio_age",
    "sex_aware": True,
    "inspiration_note": (
        "Product framing aligned with public research on multi-gene blood RNA aging panels "
        "(e.g. hallmark-mapped expression profiles) — AETERNA does not claim affiliation with any lab."
    ),
}

VET_CAT_CRYO_META = {
    "mode": "licensed_veterinary_partner",
    "species": "felis_catus",
    "unit": "tissue_bank_intake",
    "price_acp": "75000",
    "architecture": "controlled_rate_freezer_plus_ln2_cryochamber",
    "note": (
        "Conceptual feline tissue cryoconservator-restorer rail. ANCAP settles ACP and issues a "
        "licensed-veterinary-partner intake brief. Not a marketed medical device, not a return-to-life "
        "warranty, and not a DIY cryo protocol."
    ),
}

VET_REGEN_POD_META = {
    "mode": "licensed_veterinary_partner",
    "species": "canis_familiaris",
    "unit": "organ_pathway",
    "price_acp": "180000",
    "architecture": "vet_regen_pod_organ_bank_bioprint_robot_assist",
    "note": (
        "Conceptual canine VET REGEN POD organ-transplant and regeneration chamber. ANCAP settles ACP "
        "and matches a licensed veterinary partner. Infographic survival or speed figures are not product claims."
    ),
}

MRNA_REPROGRAMMING_META = {
    "mode": "licensed_partner_consult_only",
    "delivery_literacy": "mrna_in_lipid_nanoparticle_lnp",
    "goal": "partial_reprogramming_keep_cell_identity",
    "not": [
        "issued_us_patent_until_grant_issues",
        "approved_drug",
        "full_pluripotent_reset",
        "lipid_recipe",
        "mrna_sequence",
        "wet_lab_protocol",
    ],
    "citation_note": (
        "Public journalism (Inc. Russia 8 Sep 2026; Daewoong / USPTO notice of allowance "
        "announced 27 Aug 2026) on ionizable lipids for the eTurna LNP platform. "
        "ANCAP is not affiliated with Daewoong Pharmaceutical, Turn Biotechnologies, "
        "HanAll Biopharma, or eTurna."
    ),
}

_COMPLIANCE = (
    "AETERNA sells ACP-paid analysis, consult briefs, and licensed-partner handoffs only. "
    "No DIY CRISPR/Cas9 protocols, gene synthesis, LNP formulation recipes, mRNA sequences, "
    "or unlicensed enhancement procedures. "
    "Molecular aging profiles, partial-reprogramming briefs, and veterinary organ rails "
    "are educational / partner-prep — not clinical or veterinary diagnoses, not approved "
    "anti-aging drugs, and not marketed medical devices."
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _feature_enabled() -> bool:
    return bool(getattr(get_settings(), "ff_aeterna", False))


def _vault_public(row: AeternaDnaVaultEntry) -> AeternaDnaVaultPublic:
    return AeternaDnaVaultPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)) if row.org_id else None,
        owner_user_id=uuid.UUID(str(row.owner_user_id)),
        label=row.label,
        source=row.source,
        source_uri=row.source_uri,
        content_sha256=row.content_sha256,
        format_hint=row.format_hint,
        status=row.status,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _order_public(row: AeternaIntentOrder) -> AeternaIntentOrderPublic:
    return AeternaIntentOrderPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)) if row.org_id else None,
        owner_user_id=uuid.UUID(str(row.owner_user_id)),
        intent_kind=row.intent_kind,
        vault_id=uuid.UUID(str(row.vault_id)) if row.vault_id else None,
        workflow_slug=row.workflow_slug,
        status=row.status,
        budget_acp=row.budget_acp,
        notes=row.notes,
        metadata_json=dict(row.metadata_json or {}),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _partner_public(row: AeternaPartner) -> AeternaPartnerPublic:
    return AeternaPartnerPublic(
        id=uuid.UUID(str(row.id)),
        org_id=uuid.UUID(str(row.org_id)),
        name=row.name,
        jurisdiction=row.jurisdiction,
        license_ref=row.license_ref,
        website=row.website,
        supported_intents=list(row.supported_intents or []),
        verified=bool(row.verified),
        created_at=row.created_at,
    )


async def division_status(session: AsyncSession) -> AeternaStatusPublic:
    enabled = _feature_enabled()
    vaults = (await session.execute(select(func.count()).select_from(AeternaDnaVaultEntry))).scalar_one()
    orders = (await session.execute(select(func.count()).select_from(AeternaIntentOrder))).scalar_one()
    partners = (
        await session.execute(
            select(func.count()).select_from(AeternaPartner).where(AeternaPartner.verified.is_(True))
        )
    ).scalar_one()
    return AeternaStatusPublic(
        feature_enabled=enabled,
        tagline=(
            "Eternal life rails: DNA vault, 15-axis molecular aging profile, "
            "partial mRNA-reprogramming consults, stem-cell organ print, "
            "veterinary tissue-cryo / VET REGEN POD partner rails, licensed longevity partners."
        ),
        vault_entries=int(vaults or 0),
        intent_orders=int(orders or 0),
        partners_verified=int(partners or 0),
        workflow_slugs=list(AETERNA_WORKFLOW_SLUGS),
        sequencing_import_hint=(
            "Hash Sequencing.com / VCF exports or partner blood-RNA panel metadata locally "
            "(streaming SHA-256), then POST only content_sha256 + tiny metadata. "
            "Do not upload hg38/CRAM/FASTA or raw FASTQ to ANCAP — disk is hash-only."
        ),
        compliance_note=_COMPLIANCE,
        next_gate="Enable FF_AETERNA" if not enabled else "Partner verification queue + licensed checkout UX",
        aging_hallmarks=list(AETERNA_AGING_HALLMARKS),
        molecular_aging_note=(
            "Goal is an individual configuration of aging processes "
            "(DNA repair, proteostasis, energy metabolism, senescence, …) — "
            "not one universal \"you are biologically N years old\" score. Sex-aware models preferred."
        ),
        reprogramming_note=(
            "Partial reprogramming = restore some youthful cell functions without erasing identity. "
            "eTurna-style LNP mRNA delivery is cited as public patent-literacy only "
            "(USPTO notice of allowance, Aug 2026) — not a therapy ANCAP sells or compounds."
        ),
        vet_regen_note=(
            "Feline cryoconservator-restorer and canine VET REGEN POD listings are licensed-veterinary "
            "partner intakes. Infographics are conceptual architecture — not a marketed device and not "
            "a survival-rate or return-to-life claim."
        ),
    )


async def create_vault_entry(
    session: AsyncSession, *, user_id: str, body: AeternaDnaVaultCreate, org_id: str | None = None
) -> AeternaDnaVaultPublic:
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="AETERNA feature flag disabled")
    if not body.consent_acknowledged:
        raise HTTPException(status_code=400, detail="consent_acknowledged required")
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    now = _utcnow()
    row = AeternaDnaVaultEntry(
        org_id=org_id,
        owner_user_id=user_id,
        label=body.label.strip(),
        source=body.source.value,
        source_uri=body.source_uri,
        content_sha256=body.content_sha256.lower(),
        format_hint=body.format_hint.strip().lower() or "vcf",
        status=AeternaVaultStatus.indexed.value,
        metadata_json=body.metadata_json or {},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _vault_public(row)


async def list_vault_entries(
    session: AsyncSession, *, user_id: str, org_id: str | None = None
) -> list[AeternaDnaVaultPublic]:
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
        stmt = select(AeternaDnaVaultEntry).where(AeternaDnaVaultEntry.org_id == org_id)
    else:
        stmt = select(AeternaDnaVaultEntry).where(AeternaDnaVaultEntry.owner_user_id == user_id)
    stmt = stmt.order_by(AeternaDnaVaultEntry.created_at.desc())
    return [_vault_public(r) for r in (await session.execute(stmt)).scalars().all()]


async def create_intent_order(
    session: AsyncSession, *, user_id: str, body: AeternaIntentOrderCreate, org_id: str | None = None
) -> AeternaIntentOrderPublic:
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="AETERNA feature flag disabled")
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.member)
    if body.vault_id:
        vault = await session.get(AeternaDnaVaultEntry, str(body.vault_id))
        if vault is None:
            raise HTTPException(status_code=404, detail="DNA vault entry not found")
        if vault.owner_user_id != user_id and (not org_id or vault.org_id != org_id):
            raise HTTPException(status_code=403, detail="Vault entry not accessible")
    slug = body.workflow_slug or AETERNA_INTENT_DEFAULT_SLUGS.get(body.intent_kind.value)
    if slug and slug not in AETERNA_WORKFLOW_SLUGS:
        raise HTTPException(status_code=400, detail="Unknown AETERNA workflow_slug")
    if body.intent_kind == AeternaIntentKind.organ_bioprint:
        if slug and slug != ORGAN_PRINT_SLUG:
            raise HTTPException(
                status_code=400,
                detail="organ_bioprint requires workflow_slug aeterna-stem-cell-organ-print",
            )
        slug = ORGAN_PRINT_SLUG
        if body.budget_acp < ORGAN_PRINT_PRICE_ACP:
            raise HTTPException(
                status_code=400,
                detail="organ_bioprint budget_acp must be at least 250000 ACP per organ",
            )
    meta = dict(body.metadata_json or {})
    if body.intent_kind == AeternaIntentKind.organ_bioprint:
        for key, value in ORGAN_PRINT_HANDOFF_META.items():
            meta.setdefault(key, value)
    if body.intent_kind == AeternaIntentKind.molecular_aging_profile:
        if slug and slug != MOLECULAR_AGING_SLUG:
            raise HTTPException(
                status_code=400,
                detail="molecular_aging_profile requires workflow_slug aeterna-molecular-aging-profile",
            )
        slug = MOLECULAR_AGING_SLUG
        for key, value in MOLECULAR_AGING_META.items():
            meta.setdefault(key, value)
        meta.setdefault(
            "hallmark_ids",
            [h.id for h in AETERNA_AGING_HALLMARKS],
        )
    if body.intent_kind == AeternaIntentKind.partial_reprogramming_consult:
        if slug and slug != MRNA_REPROGRAMMING_SLUG:
            raise HTTPException(
                status_code=400,
                detail="partial_reprogramming_consult requires workflow_slug aeterna-mrna-reprogramming-brief",
            )
        slug = MRNA_REPROGRAMMING_SLUG
        if body.budget_acp < Decimal("1000000"):
            raise HTTPException(
                status_code=400,
                detail="partial_reprogramming_consult budget_acp must be at least 1000000 ACP",
            )
        for key, value in MRNA_REPROGRAMMING_META.items():
            meta.setdefault(key, value)
    if body.intent_kind == AeternaIntentKind.vet_feline_cryo_restore:
        if slug and slug != VET_CAT_CRYO_SLUG:
            raise HTTPException(
                status_code=400,
                detail="vet_feline_cryo_restore requires workflow_slug aeterna-vet-cat-cryo-restore",
            )
        slug = VET_CAT_CRYO_SLUG
        if body.budget_acp < VET_CAT_CRYO_PRICE_ACP:
            raise HTTPException(
                status_code=400,
                detail="vet_feline_cryo_restore budget_acp must be at least 75000 ACP",
            )
        for key, value in VET_CAT_CRYO_META.items():
            meta.setdefault(key, value)
    if body.intent_kind == AeternaIntentKind.vet_canine_regen_pod:
        if slug and slug != VET_REGEN_POD_SLUG:
            raise HTTPException(
                status_code=400,
                detail="vet_canine_regen_pod requires workflow_slug aeterna-vet-regen-pod",
            )
        slug = VET_REGEN_POD_SLUG
        if body.budget_acp < VET_REGEN_POD_PRICE_ACP:
            raise HTTPException(
                status_code=400,
                detail="vet_canine_regen_pod budget_acp must be at least 180000 ACP",
            )
        for key, value in VET_REGEN_POD_META.items():
            meta.setdefault(key, value)
    now = _utcnow()
    row = AeternaIntentOrder(
        org_id=org_id,
        owner_user_id=user_id,
        intent_kind=body.intent_kind.value,
        vault_id=str(body.vault_id) if body.vault_id else None,
        workflow_slug=slug,
        status=AeternaOrderStatus.draft.value,
        budget_acp=body.budget_acp,
        notes=body.notes,
        metadata_json=meta,
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _order_public(row)


async def list_intent_orders(
    session: AsyncSession, *, user_id: str, org_id: str | None = None
) -> list[AeternaIntentOrderPublic]:
    if org_id:
        await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
        stmt = select(AeternaIntentOrder).where(AeternaIntentOrder.org_id == org_id)
    else:
        stmt = select(AeternaIntentOrder).where(AeternaIntentOrder.owner_user_id == user_id)
    stmt = stmt.order_by(AeternaIntentOrder.created_at.desc())
    return [_order_public(r) for r in (await session.execute(stmt)).scalars().all()]


async def create_partner(
    session: AsyncSession, *, org_id: str, user_id: str, body: AeternaPartnerCreate
) -> AeternaPartnerPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.admin)
    if not _feature_enabled():
        raise HTTPException(status_code=503, detail="AETERNA feature flag disabled")
    now = _utcnow()
    row = AeternaPartner(
        org_id=org_id,
        name=body.name.strip(),
        jurisdiction=body.jurisdiction.strip(),
        license_ref=body.license_ref,
        website=body.website,
        supported_intents=[i.value for i in body.supported_intents],
        verified=False,
        metadata_json=body.metadata_json or {},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return _partner_public(row)


async def list_partners(
    session: AsyncSession, *, org_id: str, user_id: str
) -> list[AeternaPartnerPublic]:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    q = await session.execute(
        select(AeternaPartner)
        .where(AeternaPartner.org_id == org_id)
        .order_by(AeternaPartner.created_at.desc())
    )
    return [_partner_public(r) for r in q.scalars().all()]


async def org_summary(session: AsyncSession, *, org_id: str, user_id: str) -> AeternaStatusPublic:
    await require_org_role(session, org_id, user_id, OrgRoleEnum.viewer)
    base = await division_status(session)
    vaults = (
        await session.execute(
            select(func.count()).select_from(AeternaDnaVaultEntry).where(AeternaDnaVaultEntry.org_id == org_id)
        )
    ).scalar_one()
    orders = (
        await session.execute(
            select(func.count()).select_from(AeternaIntentOrder).where(AeternaIntentOrder.org_id == org_id)
        )
    ).scalar_one()
    partners = (
        await session.execute(
            select(func.count())
            .select_from(AeternaPartner)
            .where(AeternaPartner.org_id == org_id, AeternaPartner.verified.is_(True))
        )
    ).scalar_one()
    return base.model_copy(
        update={
            "vault_entries": int(vaults or 0),
            "intent_orders": int(orders or 0),
            "partners_verified": int(partners or 0),
        }
    )
