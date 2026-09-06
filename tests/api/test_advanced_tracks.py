"""Smoke tests for R9/R10/R11/R12 advanced track foundations."""
from __future__ import annotations

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
    assert AeternaStatusPublic.model_fields["division"]


def test_aeterna_workflow_templates_catalogued():
    slugs = {t.slug for t in WORKFLOW_TEMPLATES}
    assert "aeterna-dna-wellness-report" in slugs
    assert "aeterna-pigmentation-consult-brief" in slugs
    aeterna = [t for t in WORKFLOW_TEMPLATES if t.category == "AETERNA"]
    assert len(aeterna) >= 5
