from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "check_stripe_verification_packet.py"
TEMPLATE_PACKET = REPO_ROOT / "docs" / "STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md"


RUN_A_ROWS = {
    "`POST /v1/payments/stripe/intent` returned `201`": ("pass", "api/run-a-intent.json", ""),
    "Stripe checkout completed successfully": ("pass", "stripe/run-a-payment.png", ""),
    "Stripe shows delivered `payment_intent.succeeded` webhook": ("pass", "stripe/run-a-webhook.png", ""),
    "`POST /v1/webhooks/stripe` accepted the event": ("pass", "api/run-a-webhook.json", ""),
    "`GET /v1/payments/stripe/intents/{id}` shows `item.status == \"captured\"`": ("pass", "api/run-a-intent-status.json", ""),
    "`GET /v1/payments/stripe/intents/{id}` shows `credited == true`": ("pass", "api/run-a-intent-status.json", ""),
    "`provider_payload.stripe_last_event_id` is a real `evt_...` id": ("pass", "api/run-a-intent-status.json", ""),
    "`Settlement signal` shows `webhook`": ("pass", "ui/run-a-wallet.png", ""),
    "`Verification status` shows `webhook delivery confirmed`": ("pass", "ui/run-a-wallet.png", ""),
    "`Payment method evidence` shows `new card`": ("pass", "ui/run-a-wallet.png", ""),
    "User ledger balance increased by expected ACP amount": ("pass", "ledger/run-a-balance.json", ""),
}

RUN_B_ROWS = {
    "`GET /v1/payments/methods` lists the reusable saved card": ("pass", "api/run-b-methods.json", ""),
    "Second top-up was started with a saved payment method": ("pass", "api/run-b-intent.json", ""),
    "Stripe checkout completed successfully": ("pass", "stripe/run-b-payment.png", ""),
    "Stripe shows delivered `payment_intent.succeeded` webhook": ("pass", "stripe/run-b-webhook.png", ""),
    "`GET /v1/payments/stripe/intents/{id}` shows `item.status == \"captured\"`": ("pass", "api/run-b-intent-status.json", ""),
    "`GET /v1/payments/stripe/intents/{id}` shows `credited == true`": ("pass", "api/run-b-intent-status.json", ""),
    "`Settlement signal` shows `webhook` or other terminal evidence": ("pass", "ui/run-b-wallet.png", ""),
    "`Verification status` is recorded honestly": ("pass", "ui/run-b-wallet.png", ""),
    "`Payment method evidence` shows `saved card`": ("pass", "ui/run-b-wallet.png", ""),
    "Saved-method id / save-for-reuse flag matches the intended path": ("pass", "api/run-b-intent.json", ""),
    "User ledger balance increased by expected ACP amount": ("pass", "ledger/run-b-balance.json", ""),
}

NEGATIVE_ROWS = {
    "Unsupported currency (`GBP`) returns `400`": ("pass", "api/negative-gbp.json", ""),
    "Invalid Stripe webhook signature is rejected": ("pass", "api/negative-webhook-signature.json", ""),
    "Foreign saved payment method is rejected": ("pass", "api/negative-foreign-saved-method.json", ""),
}


def load_module():
    spec = importlib.util.spec_from_file_location("check_stripe_verification_packet", SCRIPT_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def split_into_sections(text: str) -> list[str]:
    sections: list[str] = []
    current: list[str] = []
    for line in text.splitlines(keepends=True):
        if line.startswith("## ") and current:
            sections.append("".join(current))
            current = [line]
        else:
            current.append(line)
    if current:
        sections.append("".join(current))
    return sections


def replace_field(text: str, prefix: str, value: str) -> str:
    lines = text.splitlines(keepends=True)
    for index, line in enumerate(lines):
        if line.startswith(prefix):
            line_ending = ""
            if line.endswith("\r\n"):
                line_ending = "\r\n"
            elif line.endswith("\n"):
                line_ending = "\n"
            lines[index] = f"{prefix} {value}{line_ending}"
            return "".join(lines)
    raise AssertionError(f"missing field prefix {prefix!r}")


def replace_field_in_section(text: str, heading: str, prefix: str, value: str) -> str:
    sections = split_into_sections(text)
    for index, section in enumerate(sections):
        if section.startswith(heading):
            sections[index] = replace_field(section, prefix, value)
            return "".join(sections)
    raise AssertionError(f"missing section heading {heading!r}")


def replace_table_row_in_section(
    text: str,
    heading: str,
    label: str,
    result: str,
    evidence: str,
    notes: str = "",
) -> str:
    old = f"| {label} |  |  |  |"
    new = f"| {label} | {result} | {evidence} | {notes} |"
    sections = split_into_sections(text)
    for index, section in enumerate(sections):
        if not section.startswith(heading):
            continue
        assert old in section, f"missing row {label!r} in section {heading!r}"
        sections[index] = section.replace(old, new, 1)
        return "".join(sections)
    raise AssertionError(f"missing section heading {heading!r}")


def build_ready_packet_text() -> str:
    text = TEMPLATE_PACKET.read_text(encoding="utf-8")
    for prefix, value in [
        ("- Date:", "2026-06-03"),
        ("- Operator:", "ARDO"),
        ("- Commit SHA:", "abc123"),
        ("- Environment:", "local prod-like"),
        ("- API base URL:", "http://127.0.0.1:8080/api/v1"),
        ("- Wallet UI URL:", "http://127.0.0.1:8080/wallet/credits"),
        ("- Stripe mode:", "test"),
        ("- Webhook delivery path:", "Stripe CLI forward"),
        ("- Authenticated test user id/email:", "stripe-test@example.com"),
        ("- Package slug:", "launch-credits"),
        ("- Fiat amount / currency:", "10 USD"),
        ("- Expected ACP credit amount:", "100 ACP"),
        ("- Notes:", "Manual webhook and saved-card verification complete."),
        ("- New-card webhook-confirmed run completed:", "yes"),
        ("- Saved-card reuse run completed:", "yes"),
        ("- Any run depended only on poll fallback:", "no"),
        ("- Final roadmap status for item 4.1:", "mark `[x]`"),
        ("- Remaining blocker if still open:", "none"),
        ("- Safe wording for roadmap/status update:", "Stripe webhook and saved-card verification completed in test mode with real delivery evidence."),
        ("- What was proven:", "Webhook-confirmed new-card and saved-card reuse flows both captured credits."),
        ("- What is still unproven:", "none"),
        ("- Next required action:", "Update roadmap item 4.1 to done."),
        ("- Approved by:", "ARDO"),
    ]:
        text = replace_field(text, prefix, value)

    run_a_heading = "## Run A — New-card checkout with webhook confirmation"
    for prefix, value in [
        ("- ANCAP payment intent id:", "pi_ancap_run_a"),
        ("- Stripe PaymentIntent id:", "pi_stripe_run_a"),
        ("- Stripe customer id (if known):", "cus_test_123"),
        ("- Save-for-reuse requested:", "yes"),
        ("- Card evidence (brand + last4 only):", "Visa 4242"),
        ("- Ledger balance before:", "0 ACP"),
        ("- Ledger balance after:", "100 ACP"),
        ("- Final ANCAP item status:", "captured"),
        ("- Final Stripe status:", "succeeded"),
        ("- Was poll fallback needed before webhook evidence arrived?", "no"),
    ]:
        text = replace_field_in_section(text, run_a_heading, prefix, value)

    run_b_heading = "## Run B — Saved-card reuse verification"
    for prefix, value in [
        ("- ANCAP payment intent id:", "pi_ancap_run_b"),
        ("- Stripe PaymentIntent id:", "pi_stripe_run_b"),
        ("- Stripe customer id:", "cus_test_123"),
        ("- Requested saved payment method id:", "pm_saved_123"),
        ("- Saved card evidence (brand + last4 only):", "Visa 4242"),
        ("- Ledger balance before:", "100 ACP"),
        ("- Ledger balance after:", "200 ACP"),
        ("- Final ANCAP item status:", "captured"),
        ("- Final Stripe status:", "succeeded"),
    ]:
        text = replace_field_in_section(text, run_b_heading, prefix, value)

    for label, row in RUN_A_ROWS.items():
        text = replace_table_row_in_section(text, run_a_heading, label, *row)
    for label, row in RUN_B_ROWS.items():
        text = replace_table_row_in_section(text, run_b_heading, label, *row)
    for label, row in NEGATIVE_ROWS.items():
        text = replace_table_row_in_section(text, "## Negative-path spot checks", label, *row)
    return text


def test_analyze_template_packet_reports_open_status() -> None:
    module = load_module()
    summary = module.analyze_packet(TEMPLATE_PACKET)

    assert summary["closureReady"] is False
    assert summary["ok"] is False
    assert summary["metadata"]["complete"] is False
    assert summary["runA"]["requiredChecks"]["passCount"] == 0
    assert summary["runB"]["requiredChecks"]["passCount"] == 0
    assert any("Verification round metadata" in issue for issue in summary["issues"])
    assert any("Run A" in issue for issue in summary["issues"])
    assert any("Run B" in issue for issue in summary["issues"])


def test_analyze_filled_packet_reports_closure_ready(tmp_path: Path) -> None:
    module = load_module()
    packet_path = tmp_path / "stripe-verification-2026-06-03.md"
    packet_path.write_text(build_ready_packet_text(), encoding="utf-8")

    summary = module.analyze_packet(packet_path)

    assert summary["closureReady"] is True
    assert summary["ok"] is True
    assert summary["metadata"]["complete"] is True
    assert summary["runA"]["complete"] is True
    assert summary["runA"]["requiredChecks"]["allPassed"] is True
    assert summary["runB"]["complete"] is True
    assert summary["runB"]["requiredChecks"]["allPassed"] is True
    assert summary["closureSummary"]["explicitlyReady"] is True
    assert summary["issues"] == []
    assert summary["negativePath"]["counts"]["pass"] == 3


def test_cli_returns_exit_code_2_for_open_packet_and_can_emit_json(tmp_path: Path) -> None:
    output_path = tmp_path / "summary.json"
    result = subprocess.run(
        [
            sys.executable,
            str(SCRIPT_PATH),
            str(TEMPLATE_PACKET),
            "--format",
            "json",
            "--output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 2
    payload = json.loads(output_path.read_text(encoding="utf-8"))
    assert payload["closureReady"] is False
    assert any("Verification round metadata" in issue for issue in payload["issues"])


def test_cli_returns_exit_code_0_for_ready_packet(tmp_path: Path) -> None:
    packet_path = tmp_path / "stripe-verification-2026-06-03.md"
    packet_path.write_text(build_ready_packet_text(), encoding="utf-8")

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), str(packet_path)],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Closure ready: yes" in result.stdout
    assert "Run A required checks: 11/11 pass" in result.stdout
    assert "Run B required checks: 11/11 pass" in result.stdout
