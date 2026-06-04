from __future__ import annotations

import importlib.util
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "generate_stripe_verification_packet.py"
TEMPLATE_PATH = REPO_ROOT / "docs" / "STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md"


def load_module():
    spec = importlib.util.spec_from_file_location("generate_stripe_verification_packet", SCRIPT_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_build_output_path_uses_basename_and_date_label():
    module = load_module()

    output_path = module.build_output_path(
        output_dir=Path("docs"),
        basename="stripe-verification",
        date_label="2026-06-01",
    )

    assert output_path == Path("docs/stripe-verification-2026-06-01.md")


def test_build_latest_alias_path_uses_reserved_latest_suffix():
    module = load_module()

    output_path = module.build_latest_alias_path(
        output_dir=Path("docs"),
        basename="stripe-verification",
    )

    assert output_path == Path("docs/stripe-verification-latest.md")


def test_validate_filename_component_accepts_plain_filename_components():
    module = load_module()

    assert module._validate_filename_component("stripe-verification", flag_name="--basename") == "stripe-verification"
    assert module._validate_filename_component("2026-06-01", flag_name="--date-label") == "2026-06-01"


def test_validate_filename_component_rejects_paths_and_dot_segments():
    module = load_module()

    for value in ["nested/path", r"nested\\path", ".", ".."]:
        try:
            module._validate_filename_component(value, flag_name="--basename")
        except ValueError as exc:
            message = str(exc)
        else:
            raise AssertionError(f"expected filename-component validation to fail for {value!r}")

        assert "filename component only" in message or "must not be '.' or '..'" in message


def test_render_packet_prefills_template_metadata_and_appends_bootstrap_metadata():
    module = load_module()
    template_text = TEMPLATE_PATH.read_text(encoding="utf-8")
    output_path = REPO_ROOT / "docs" / "stripe-verification-2026-06-01.md"

    rendered = module.render_packet(
        template_text,
        generated_at_utc="2026-06-01T15:11:00Z",
        template_path=TEMPLATE_PATH,
        output_path=output_path,
        operator="ARDO",
        verification_date="2026-06-01",
        commit_sha="abc123",
        environment="local prod-like",
        api_base_url="http://127.0.0.1:8080/api/v1",
        wallet_ui_url="http://127.0.0.1:8080/wallet/credits",
        stripe_mode="test",
        webhook_delivery_path="Stripe CLI forward",
        authenticated_test_user="stripe-test@example.com",
        package_slug="launch-credits",
        fiat_amount_currency="10 USD",
        expected_acp_credit_amount="100 ACP",
        notes="prefilled for manual verification",
        latest_alias_path=REPO_ROOT / "docs" / "stripe-verification-latest.md",
    )

    assert "# Stripe Verification Evidence Packet" in rendered
    assert "> Status: generated scaffold from template | Added: 2026-06-01" in rendered
    assert "- Date: 2026-06-01" in rendered
    assert "- Operator: ARDO" in rendered
    assert "- Commit SHA: abc123" in rendered
    assert "- Environment: local prod-like" in rendered
    assert "- API base URL: http://127.0.0.1:8080/api/v1" in rendered
    assert "- Wallet UI URL: http://127.0.0.1:8080/wallet/credits" in rendered
    assert "- Stripe mode: test" in rendered
    assert "- Webhook delivery path: Stripe CLI forward" in rendered
    assert "- Authenticated test user id/email: stripe-test@example.com" in rendered
    assert "- Package slug: launch-credits" in rendered
    assert "- Fiat amount / currency: 10 USD" in rendered
    assert "- Expected ACP credit amount: 100 ACP" in rendered
    assert "- Notes: prefilled for manual verification" in rendered
    assert "## Packet bootstrap metadata" in rendered
    assert "- Generated at (UTC): `2026-06-01T15:11:00Z`" in rendered
    assert "- Source template: `docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md`" in rendered
    assert "- Output path: `docs/stripe-verification-2026-06-01.md`" in rendered
    assert "- Latest alias path: `docs/stripe-verification-latest.md`" in rendered
    assert "- Generator: `scripts/generate_stripe_verification_packet.py`" in rendered
    assert "Reminder: this packet is prefilled scaffolding only." in rendered


def test_generate_packet_script_creates_prefilled_dated_packet(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-01",
            "--operator",
            "ARDO",
            "--verification-date",
            "2026-06-01",
            "--environment",
            "local prod-like",
            "--webhook-delivery-path",
            "Stripe CLI forward",
            "--authenticated-test-user",
            "stripe-test@example.com",
            "--fiat-amount-currency",
            "10 USD",
            "--expected-acp-credit-amount",
            "100 ACP",
            "--notes",
            "prefilled for manual verification",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    output_path = tmp_path / "stripe-verification-2026-06-01.md"
    latest_alias_path = tmp_path / "stripe-verification-latest.md"
    assert output_path.exists()
    assert latest_alias_path.exists()
    text = output_path.read_text(encoding="utf-8")
    latest_text = latest_alias_path.read_text(encoding="utf-8")
    assert "# Stripe Verification Evidence Packet" in text
    assert "> Status: generated scaffold from template | Added: 2026-06-01" in text
    assert "- Operator: ARDO" in text
    assert "- Webhook delivery path: Stripe CLI forward" in text
    assert "- Authenticated test user id/email: stripe-test@example.com" in text
    assert "- Fiat amount / currency: 10 USD" in text
    assert "- Expected ACP credit amount: 100 ACP" in text
    assert "## Packet bootstrap metadata" in text
    assert "- Latest alias path: `" in text
    assert latest_text == text
    stdout = result.stdout.replace("\\", "/")
    assert str(output_path).replace("\\", "/") in stdout
    assert str(latest_alias_path).replace("\\", "/") in stdout
    assert "Reminder: fill both Run A and Run B" in result.stdout


def test_generate_packet_script_can_skip_latest_alias_write(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-01",
            "--no-write-latest-alias",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    output_path = tmp_path / "stripe-verification-2026-06-01.md"
    latest_alias_path = tmp_path / "stripe-verification-latest.md"
    assert output_path.exists()
    assert not latest_alias_path.exists()
    text = output_path.read_text(encoding="utf-8")
    assert "Latest alias path: not written (`--no-write-latest-alias`)" in text


def test_generate_packet_script_rejects_reserved_latest_date_label_when_latest_alias_write_is_enabled(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "latest",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert "--date-label latest is reserved for the stable latest alias" in (result.stderr or result.stdout)


def test_generate_packet_script_refuses_to_overwrite_existing_packet(tmp_path: Path):
    output_path = tmp_path / "stripe-verification-2026-06-01.md"
    output_path.write_text("existing\n", encoding="utf-8")

    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "2026-06-01",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert "Refusing to overwrite existing packet" in (result.stderr or result.stdout)


def test_generate_packet_script_rejects_invalid_date_label(tmp_path: Path):
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            "--output-dir",
            str(tmp_path),
            "--date-label",
            "nested/path",
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert "--date-label must be a filename component only" in (result.stderr or result.stdout)
