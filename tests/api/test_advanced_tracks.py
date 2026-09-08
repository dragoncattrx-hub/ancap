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
    assert AeternaStatusPublic.model_fields["division"]


def test_aeterna_workflow_templates_catalogued():
    slugs = {t.slug for t in WORKFLOW_TEMPLATES}
    assert "aeterna-dna-wellness-report" in slugs
    assert "aeterna-pigmentation-consult-brief" in slugs
    assert "aeterna-stem-cell-organ-print" in slugs
    aeterna = [t for t in WORKFLOW_TEMPLATES if t.category == "AETERNA"]
    assert len(aeterna) >= 6
    for tpl in aeterna:
        assert tpl.price.currency == "ACP"
        if tpl.slug == "aeterna-stem-cell-organ-print":
            assert tpl.price.amount == "250000"
        else:
            assert tpl.price.amount == "1000000"


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
    from app.services.aeterna import AETERNA_INTENT_DEFAULT_SLUGS, ORGAN_PRINT_SLUG
    from app.services.workflow_execution import WORKFLOW_BUNDLES

    pack = next(x for x in WORKFLOW_BUNDLES if x.slug == "aeterna-longevity-pack")
    assert pack.price.amount == "2500000"
    assert "aeterna-dna-wellness-report" in pack.workflow_slugs
    assert ORGAN_PRINT_SLUG not in pack.workflow_slugs
    assert AETERNA_INTENT_DEFAULT_SLUGS["organ_bioprint"] == ORGAN_PRINT_SLUG


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


def test_advanced_track_routes_include_org_aeterna_intents():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/organizations/{org_id}/aeterna/intents" in paths
    assert "/v1/organizations/{org_id}/aeterna/intents" in paths
