"""Smoke tests for R9/R10/R11/R12 advanced track foundations."""
from __future__ import annotations

import pytest

from app.main import app
from app.schemas.aeterna import AeternaDnaVaultCreate, AeternaIntentKind, AeternaStatusPublic
from app.schemas.orbital_edge import OrbitalEdgeStatusPublic, OrbitalNodeCreate
from app.schemas.securities import SecurityIntakeCreate, SecurityInstrumentType
from app.schemas.watch_fleet import WatchAssetCreate, WatchSlot
from app.services.workflow_execution import WORKFLOW_TEMPLATES


def test_advanced_track_routes_registered():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/organizations/{org_id}/securities/intake" in paths
    assert "/organizations/{org_id}/watch-fleet/watches" in paths
    assert "/orbital-edge/status" in paths
    assert "/aeterna/status" in paths
    assert "/space-auction/catalog" in paths
    assert "/v1/space-auction/catalog" in paths
    assert "/animal-auction/catalog" in paths
    assert "/v1/animal-auction/catalog" in paths
    assert "/aeterna/vault" in paths
    assert "/v1/aeterna/status" in paths
    assert "/v1/organizations/{org_id}/securities/summary" in paths
    assert "/v1/organizations/{org_id}/watch-fleet/summary" in paths
    assert "/v1/orbital-edge/status" in paths


def test_advanced_track_schema_smoke():
    intake = SecurityIntakeCreate(
        instrument_type=SecurityInstrumentType.promissory_note,
        issuer_name="Example Issuer",
        jurisdiction="US-DE",
        face_amount="1000.00",
    )
    assert intake.currency == "USD"

    watch = WatchAssetCreate(
        employee_user_id="00000000-0000-4000-8000-000000000001",
        slot=WatchSlot.a,
        band_color="graphite",
        serial_number="AW-TEST-001",
    )
    assert watch.slot == WatchSlot.a

    node = OrbitalNodeCreate(codename="ancap-edge-demo")
    assert node.launch_provider == "spacex"
    assert OrbitalEdgeStatusPublic.model_fields["feature_enabled"]

    vault = AeternaDnaVaultCreate(
        label="My Sequencing export",
        content_sha256="a" * 64,
        consent_acknowledged=True,
        source_uri="https://sequencing.com/",
    )
    assert vault.format_hint == "vcf"
    assert AeternaIntentKind.pigmentation_consult.value == "pigmentation_consult"
    assert AeternaIntentKind.organ_bioprint.value == "organ_bioprint"
    assert AeternaIntentKind.partial_reprogramming_consult.value == "partial_reprogramming_consult"
    assert AeternaIntentKind.vet_feline_cryo_restore.value == "vet_feline_cryo_restore"
    assert AeternaIntentKind.vet_canine_regen_pod.value == "vet_canine_regen_pod"
    assert AeternaStatusPublic.model_fields["division"]
    assert AeternaStatusPublic.model_fields["reprogramming_note"]
    assert AeternaStatusPublic.model_fields["vet_regen_note"]


def test_aeterna_workflow_templates_catalogued():
    slugs = {t.slug for t in WORKFLOW_TEMPLATES}
    assert "aeterna-dna-wellness-report" in slugs
    assert "aeterna-pigmentation-consult-brief" in slugs
    assert "aeterna-stem-cell-organ-print" in slugs
    assert "aeterna-mrna-reprogramming-brief" in slugs
    aeterna = [t for t in WORKFLOW_TEMPLATES if t.category == "AETERNA"]
    assert len(aeterna) >= 10
    priced = {
        "aeterna-stem-cell-organ-print": "250000",
        "aeterna-vet-cat-cryo-restore": "75000",
        "aeterna-vet-regen-pod": "180000",
    }
    for tpl in aeterna:
        assert tpl.price.currency == "ACP"
        expected = priced.get(tpl.slug, "1000000")
        assert tpl.price.amount == expected
    assert "aeterna-vet-cat-cryo-restore" in slugs
    assert "aeterna-vet-regen-pod" in slugs


def test_aeterna_vault_metadata_rejects_sequence_blobs():
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        AeternaDnaVaultCreate(
            label="bad",
            content_sha256="a" * 64,
            consent_acknowledged=True,
            metadata_json={"sequence": "ATCG" * 200},
        )
    ok = AeternaDnaVaultCreate(
        label="ok",
        content_sha256="b" * 64,
        consent_acknowledged=True,
        metadata_json={"storage_mode": "hash_only", "content_byte_size": 123},
    )
    assert ok.content_sha256 == "b" * 64


def test_aeterna_vault_source_uri_rejects_private_targets():
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        AeternaDnaVaultCreate(
            label="ssrf",
            content_sha256="c" * 64,
            consent_acknowledged=True,
            source_uri="http://169.254.169.254/latest/meta-data",
        )
    with pytest.raises(ValidationError):
        AeternaDnaVaultCreate(
            label="ssrf",
            content_sha256="c" * 64,
            consent_acknowledged=True,
            source_uri="https://127.0.0.1/vault",
        )


def test_organ_print_execution_is_partner_handoff_only():
    from app.services.workflow_execution import execute_workflow_template, find_workflow_template

    tpl = find_workflow_template("aeterna-stem-cell-organ-print")
    assert tpl is not None
    out = execute_workflow_template(tpl, {"intent_kind": "organ_bioprint"})
    manufacturing = out["deliverable"]["manufacturing"]
    assert manufacturing["mode"] == "licensed_partner_bioreactor"
    assert manufacturing["price_acp"] == "250000"
    assert manufacturing["primary_cell_source"] == "autologous_stem_cells"
    assert manufacturing["fallback_cell_source"] == "wisdom_tooth_dental_pulp_stem_cells_dpsc"
    assert out["deliverable"]["intent"] == "organ_bioprint"
    assert out["deliverable"]["partner_handoff"]["required"] is True
    blob = str(out).lower()
    for forbidden in ("guide rna", "pcr primer", "incubate at", "crispr cas9 protocol"):
        assert forbidden not in blob


def test_aeterna_longevity_pack_and_intent_slug_map():
    from app.services.aeterna import AETERNA_INTENT_DEFAULT_SLUGS, MRNA_REPROGRAMMING_SLUG, ORGAN_PRINT_SLUG
    from app.services.workflow_execution import WORKFLOW_BUNDLES

    pack = next(x for x in WORKFLOW_BUNDLES if x.slug == "aeterna-longevity-pack")
    assert pack.price.amount == "2500000"
    assert "aeterna-dna-wellness-report" in pack.workflow_slugs
    assert ORGAN_PRINT_SLUG not in pack.workflow_slugs
    assert AETERNA_INTENT_DEFAULT_SLUGS["organ_bioprint"] == ORGAN_PRINT_SLUG
    assert AETERNA_INTENT_DEFAULT_SLUGS["partial_reprogramming_consult"] == MRNA_REPROGRAMMING_SLUG


def test_organ_bioprint_intent_defaults_slug_and_rejects_low_budget(client):
    from app.services.aeterna import ORGAN_PRINT_SLUG

    too_low = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "organ_bioprint", "budget_acp": "1000"},
    )
    assert too_low.status_code == 400, too_low.text

    wrong_slug = client.post(
        "/v1/aeterna/intents",
        json={
            "intent_kind": "organ_bioprint",
            "budget_acp": "250000",
            "workflow_slug": "aeterna-dna-wellness-report",
        },
    )
    assert wrong_slug.status_code == 400, wrong_slug.text

    created = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "organ_bioprint", "budget_acp": "250000"},
    )
    assert created.status_code == 201, created.text
    payload = created.json()
    assert payload["intent_kind"] == "organ_bioprint"
    assert payload["workflow_slug"] == ORGAN_PRINT_SLUG
    assert payload["metadata_json"]["manufacturing_mode"] == "licensed_partner_bioreactor"
    assert payload["metadata_json"]["fallback_cell_source"] == "wisdom_tooth_dental_pulp_stem_cells_dpsc"


def test_mrna_reprogramming_execution_is_consult_only():
    from app.services.workflow_execution import execute_workflow_template, find_workflow_template

    tpl = find_workflow_template("aeterna-mrna-reprogramming-brief")
    assert tpl is not None
    out = execute_workflow_template(tpl, {"intent_kind": "partial_reprogramming_consult"})
    reprogramming = out["deliverable"]["reprogramming"]
    assert reprogramming["mode"] == "partial_keep_cell_identity"
    assert reprogramming["price_acp"] == "1000000"
    assert reprogramming["citation"]["affiliation"] is False
    assert out["deliverable"]["partner_handoff"]["required"] is True
    blob = str(out).lower()
    for forbidden in ("ionizable lipid recipe", "molar ratio", "incubate at", "guide rna", "pcr primer"):
        assert forbidden not in blob


def test_partial_reprogramming_intent_defaults_slug_and_rejects_low_budget(client):
    from app.services.aeterna import MRNA_REPROGRAMMING_SLUG

    too_low = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "partial_reprogramming_consult", "budget_acp": "1000"},
    )
    assert too_low.status_code == 400, too_low.text

    wrong_slug = client.post(
        "/v1/aeterna/intents",
        json={
            "intent_kind": "partial_reprogramming_consult",
            "budget_acp": "1000000",
            "workflow_slug": "aeterna-dna-wellness-report",
        },
    )
    assert wrong_slug.status_code == 400, wrong_slug.text

    created = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "partial_reprogramming_consult", "budget_acp": "1000000"},
    )
    assert created.status_code == 201, created.text
    payload = created.json()
    assert payload["intent_kind"] == "partial_reprogramming_consult"
    assert payload["workflow_slug"] == MRNA_REPROGRAMMING_SLUG
    assert payload["metadata_json"]["mode"] == "licensed_partner_consult_only"
    assert payload["metadata_json"]["goal"] == "partial_reprogramming_keep_cell_identity"


def test_vet_regen_execution_is_partner_handoff_only():
    from app.services.workflow_execution import execute_workflow_template, find_workflow_template

    cat = find_workflow_template("aeterna-vet-cat-cryo-restore")
    assert cat is not None
    cat_out = execute_workflow_template(cat, {"intent_kind": "vet_feline_cryo_restore"})
    assert cat_out["deliverable"]["veterinary"]["species"] == "felis_catus"
    assert cat_out["deliverable"]["veterinary"]["price_acp"] == "75000"
    assert cat_out["deliverable"]["partner_handoff"]["required"] is True

    dog = find_workflow_template("aeterna-vet-regen-pod")
    assert dog is not None
    dog_out = execute_workflow_template(dog, {"intent_kind": "vet_canine_regen_pod"})
    assert dog_out["deliverable"]["veterinary"]["species"] == "canis_familiaris"
    assert dog_out["deliverable"]["veterinary"]["price_acp"] == "180000"
    blob = (str(cat_out) + str(dog_out)).lower()
    for forbidden in ("guide rna", "pcr primer", "incubate at", "ionizable lipid recipe"):
        assert forbidden not in blob
    assert "licensed_veterinary_partner" in blob
    assert "return-to-life warranty" in blob or "not a return-to-life" in blob


def test_vet_regen_intents_default_slug_and_reject_low_budget(client):
    from app.services.aeterna import VET_CAT_CRYO_SLUG, VET_REGEN_POD_SLUG

    too_low_cat = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "vet_feline_cryo_restore", "budget_acp": "1000"},
    )
    assert too_low_cat.status_code == 400, too_low_cat.text

    created_cat = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "vet_feline_cryo_restore", "budget_acp": "75000"},
    )
    assert created_cat.status_code == 201, created_cat.text
    cat_payload = created_cat.json()
    assert cat_payload["workflow_slug"] == VET_CAT_CRYO_SLUG
    assert cat_payload["metadata_json"]["species"] == "felis_catus"

    too_low_dog = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "vet_canine_regen_pod", "budget_acp": "1000"},
    )
    assert too_low_dog.status_code == 400, too_low_dog.text

    created_dog = client.post(
        "/v1/aeterna/intents",
        json={"intent_kind": "vet_canine_regen_pod", "budget_acp": "180000"},
    )
    assert created_dog.status_code == 201, created_dog.text
    dog_payload = created_dog.json()
    assert dog_payload["workflow_slug"] == VET_REGEN_POD_SLUG
    assert dog_payload["metadata_json"]["architecture"] == "vet_regen_pod_organ_bank_bioprint_robot_assist"


def test_advanced_track_routes_include_org_aeterna_intents():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/organizations/{org_id}/aeterna/intents" in paths
    assert "/v1/organizations/{org_id}/aeterna/intents" in paths
