from __future__ import annotations

"""Check whether a filled Stripe verification packet is still open or closure-ready.

Default packet path: docs/stripe-verification-latest.md
Exit codes:
- 0: closure-ready
- 2: parsed successfully but still open / incomplete
- 1: usage or packet-format error
"""

import argparse
import json
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PACKET = REPO_ROOT / "docs" / "stripe-verification-latest.md"

RUN_A_HEADING = "## Run A — New-card checkout with webhook confirmation"
RUN_B_HEADING = "## Run B — Saved-card reuse verification"
NEGATIVE_HEADING = "## Negative-path spot checks"
METADATA_HEADING = "## Verification round metadata"
CLOSURE_HEADING = "## Closure summary"

REQUIRED_METADATA_FIELDS = [
    ("- Date:", {""}),
    ("- Operator:", {""}),
    ("- Commit SHA:", {""}),
    ("- Environment:", {"", "local prod-like / staging / production"}),
    ("- API base URL:", {""}),
    ("- Wallet UI URL:", {""}),
    ("- Stripe mode:", {"", "test / live"}),
    ("- Webhook delivery path:", {"", "public endpoint / Stripe CLI forward / other", "pending live webhook verification"}),
    ("- Authenticated test user id/email:", {""}),
    ("- Package slug:", {""}),
    ("- Fiat amount / currency:", {""}),
    ("- Expected ACP credit amount:", {""}),
]

REQUIRED_RUN_A_FIELDS = [
    ("- ANCAP payment intent id:", {""}),
    ("- Stripe PaymentIntent id:", {""}),
    ("- Save-for-reuse requested:", {"", "yes / no"}),
    ("- Card evidence (brand + last4 only):", {""}),
    ("- Ledger balance before:", {""}),
    ("- Ledger balance after:", {""}),
    ("- Final ANCAP item status:", {""}),
    ("- Final Stripe status:", {""}),
]

REQUIRED_RUN_B_FIELDS = [
    ("- ANCAP payment intent id:", {""}),
    ("- Stripe PaymentIntent id:", {""}),
    ("- Stripe customer id:", {""}),
    ("- Requested saved payment method id:", {""}),
    ("- Saved card evidence (brand + last4 only):", {""}),
    ("- Ledger balance before:", {""}),
    ("- Ledger balance after:", {""}),
    ("- Final ANCAP item status:", {""}),
    ("- Final Stripe status:", {""}),
]

REQUIRED_RUN_A_CHECKS = [
    "`POST /v1/payments/stripe/intent` returned `201`",
    "Stripe checkout completed successfully",
    "Stripe shows delivered `payment_intent.succeeded` webhook",
    "`POST /v1/webhooks/stripe` accepted the event",
    "`GET /v1/payments/stripe/intents/{id}` shows `item.status == \"captured\"`",
    "`GET /v1/payments/stripe/intents/{id}` shows `credited == true`",
    "`provider_payload.stripe_last_event_id` is a real `evt_...` id",
    "`Settlement signal` shows `webhook`",
    "`Verification status` shows `webhook delivery confirmed`",
    "`Payment method evidence` shows `new card`",
    "User ledger balance increased by expected ACP amount",
]

REQUIRED_RUN_B_CHECKS = [
    "`GET /v1/payments/methods` lists the reusable saved card",
    "Second top-up was started with a saved payment method",
    "Stripe checkout completed successfully",
    "Stripe shows delivered `payment_intent.succeeded` webhook",
    "`GET /v1/payments/stripe/intents/{id}` shows `item.status == \"captured\"`",
    "`GET /v1/payments/stripe/intents/{id}` shows `credited == true`",
    "`Settlement signal` shows `webhook` or other terminal evidence",
    "`Verification status` is recorded honestly",
    "`Payment method evidence` shows `saved card`",
    "Saved-method id / save-for-reuse flag matches the intended path",
    "User ledger balance increased by expected ACP amount",
]

RECOMMENDED_NEGATIVE_CHECKS = [
    "Unsupported currency (`GBP`) returns `400`",
    "Invalid Stripe webhook signature is rejected",
    "Foreign saved payment method is rejected",
]

REQUIRED_CLOSURE_FIELDS = [
    ("- New-card webhook-confirmed run completed:", {"", "yes / no"}),
    ("- Saved-card reuse run completed:", {"", "yes / no"}),
    ("- Any run depended only on poll fallback:", {"", "yes / no"}),
    ("- Final roadmap status for item 4.1:", {"", "keep `[~]` / mark `[x]`"}),
]


def _section_lines(text: str, heading: str) -> list[str]:
    lines = text.splitlines()
    start = None
    for index, line in enumerate(lines):
        if line.strip() == heading:
            start = index + 1
            break
    if start is None:
        raise ValueError(f"Missing expected section heading: {heading}")

    end = len(lines)
    for index in range(start, len(lines)):
        if lines[index].startswith("## "):
            end = index
            break
    return lines[start:end]


def _extract_field(section_lines: Iterable[str], prefix: str) -> str | None:
    for line in section_lines:
        if line.startswith(prefix):
            return line[len(prefix):].strip()
    return None


def _summarize_fields(
    *,
    section_name: str,
    section_lines: Iterable[str],
    field_specs: list[tuple[str, set[str]]],
) -> dict[str, object]:
    values: dict[str, str | None] = {}
    missing: list[str] = []
    placeholder: list[str] = []
    for prefix, placeholder_values in field_specs:
        value = _extract_field(section_lines, prefix)
        values[prefix] = value
        if value is None:
            missing.append(prefix)
            continue
        if value in placeholder_values:
            placeholder.append(prefix)

    issues = [f"{section_name}: missing field {prefix}" for prefix in missing]
    issues.extend(f"{section_name}: fill field {prefix}" for prefix in placeholder)
    return {
        "values": values,
        "missingFields": missing,
        "placeholderFields": placeholder,
        "complete": not missing and not placeholder,
        "issues": issues,
    }


def _parse_table(section_lines: Iterable[str]) -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for raw_line in section_lines:
        line = raw_line.strip()
        if not line.startswith("|"):
            continue
        columns = [column.strip() for column in line.strip("|").split("|")]
        if len(columns) < 4:
            continue
        if columns[0] == "Check":
            continue
        if set(columns[0]) == {"-"}:
            continue
        check = columns[0]
        rows[check] = {
            "result": columns[1].lower(),
            "evidence": columns[2],
            "notes": columns[3],
        }
    return rows


def _summarize_required_checks(
    *,
    section_name: str,
    table_rows: dict[str, dict[str, str]],
    required_checks: list[str],
) -> dict[str, object]:
    missing_checks: list[str] = []
    non_pass: list[dict[str, str]] = []
    missing_evidence: list[str] = []
    for check in required_checks:
        row = table_rows.get(check)
        if row is None:
            missing_checks.append(check)
            continue
        if row["result"] != "pass":
            non_pass.append({"check": check, "result": row["result"]})
        if not row["evidence"]:
            missing_evidence.append(check)

    issues = [f"{section_name}: missing check row {check}" for check in missing_checks]
    issues.extend(f"{section_name}: non-pass result for {item['check']} ({item['result']})" for item in non_pass)
    issues.extend(f"{section_name}: add evidence for {check}" for check in missing_evidence)
    return {
        "passCount": sum(1 for check in required_checks if table_rows.get(check, {}).get("result") == "pass"),
        "requiredCount": len(required_checks),
        "missingChecks": missing_checks,
        "nonPass": non_pass,
        "missingEvidence": missing_evidence,
        "allPassed": not missing_checks and not non_pass and not missing_evidence,
        "issues": issues,
    }


def _summarize_negative_checks(table_rows: dict[str, dict[str, str]]) -> dict[str, object]:
    counts = {"pass": 0, "fail": 0, "blocked": 0, "n/a": 0, "blank": 0, "other": 0}
    coverage: list[dict[str, str]] = []
    for check in RECOMMENDED_NEGATIVE_CHECKS:
        row = table_rows.get(check)
        result = row["result"] if row else "missing"
        if result in counts:
            counts[result] += 1
        elif result == "":
            counts["blank"] += 1
        else:
            counts["other"] += 1
        coverage.append({
            "check": check,
            "result": result,
            "evidence": row["evidence"] if row else "",
        })
    return {
        "counts": counts,
        "coverage": coverage,
    }


def _summarize_closure(section_lines: Iterable[str]) -> dict[str, object]:
    field_summary = _summarize_fields(
        section_name="Closure summary",
        section_lines=section_lines,
        field_specs=REQUIRED_CLOSURE_FIELDS,
    )
    values = field_summary["values"]
    new_card = values.get("- New-card webhook-confirmed run completed:") or ""
    saved_card = values.get("- Saved-card reuse run completed:") or ""
    poll_fallback = values.get("- Any run depended only on poll fallback:") or ""
    final_status = values.get("- Final roadmap status for item 4.1:") or ""

    explicit_ok = (
        new_card == "yes"
        and saved_card == "yes"
        and poll_fallback == "no"
        and "[x]" in final_status
        and "[~]" not in final_status
    )
    issues = list(field_summary["issues"])
    if field_summary["complete"] and new_card != "yes":
        issues.append("Closure summary: mark new-card webhook-confirmed run completed as yes only after real proof is present")
    if field_summary["complete"] and saved_card != "yes":
        issues.append("Closure summary: mark saved-card reuse run completed as yes only after real proof is present")
    if field_summary["complete"] and poll_fallback != "no":
        issues.append("Closure summary: packet still indicates a poll-fallback-only dependency")
    if field_summary["complete"] and not ("[x]" in final_status and "[~]" not in final_status):
        issues.append("Closure summary: final roadmap status is not set to [x]")

    return {
        **field_summary,
        "newCardCompleted": new_card,
        "savedCardCompleted": saved_card,
        "pollFallbackOnly": poll_fallback,
        "finalRoadmapStatus": final_status,
        "explicitlyReady": explicit_ok,
        "issues": issues,
    }


def analyze_packet(packet_path: Path) -> dict[str, object]:
    text = packet_path.read_text(encoding="utf-8")
    metadata_lines = _section_lines(text, METADATA_HEADING)
    run_a_lines = _section_lines(text, RUN_A_HEADING)
    run_b_lines = _section_lines(text, RUN_B_HEADING)
    negative_lines = _section_lines(text, NEGATIVE_HEADING)
    closure_lines = _section_lines(text, CLOSURE_HEADING)

    metadata = _summarize_fields(
        section_name="Verification round metadata",
        section_lines=metadata_lines,
        field_specs=REQUIRED_METADATA_FIELDS,
    )
    run_a_fields = _summarize_fields(
        section_name="Run A",
        section_lines=run_a_lines,
        field_specs=REQUIRED_RUN_A_FIELDS,
    )
    run_b_fields = _summarize_fields(
        section_name="Run B",
        section_lines=run_b_lines,
        field_specs=REQUIRED_RUN_B_FIELDS,
    )

    run_a_table = _parse_table(run_a_lines)
    run_b_table = _parse_table(run_b_lines)
    negative_table = _parse_table(negative_lines)

    run_a_checks = _summarize_required_checks(
        section_name="Run A",
        table_rows=run_a_table,
        required_checks=REQUIRED_RUN_A_CHECKS,
    )
    run_b_checks = _summarize_required_checks(
        section_name="Run B",
        table_rows=run_b_table,
        required_checks=REQUIRED_RUN_B_CHECKS,
    )
    negative_summary = _summarize_negative_checks(negative_table)
    closure = _summarize_closure(closure_lines)

    issues: list[str] = []
    for section in [metadata, run_a_fields, run_a_checks, run_b_fields, run_b_checks, closure]:
        issues.extend(section["issues"])

    closure_ready = bool(
        metadata["complete"]
        and run_a_fields["complete"]
        and run_a_checks["allPassed"]
        and run_b_fields["complete"]
        and run_b_checks["allPassed"]
        and closure["explicitlyReady"]
    )

    return {
        "path": str(packet_path),
        "ok": closure_ready,
        "closureReady": closure_ready,
        "metadata": metadata,
        "runA": {
            **run_a_fields,
            "requiredChecks": run_a_checks,
        },
        "runB": {
            **run_b_fields,
            "requiredChecks": run_b_checks,
        },
        "negativePath": negative_summary,
        "closureSummary": closure,
        "issues": issues,
    }


def _render_text(summary: dict[str, object]) -> str:
    metadata = summary["metadata"]
    run_a = summary["runA"]
    run_b = summary["runB"]
    closure = summary["closureSummary"]
    negative = summary["negativePath"]

    lines = [
        f"Stripe verification packet check: {summary['path']}",
        f"Closure ready: {'yes' if summary['closureReady'] else 'no'}",
        f"Metadata complete: {'yes' if metadata['complete'] else 'no'}",
        f"Run A required checks: {run_a['requiredChecks']['passCount']}/{run_a['requiredChecks']['requiredCount']} pass",
        f"Run B required checks: {run_b['requiredChecks']['passCount']}/{run_b['requiredChecks']['requiredCount']} pass",
        (
            "Closure summary flags: "
            f"new-card={closure['newCardCompleted'] or 'blank'}, "
            f"saved-card={closure['savedCardCompleted'] or 'blank'}, "
            f"poll-fallback-only={closure['pollFallbackOnly'] or 'blank'}, "
            f"roadmap={closure['finalRoadmapStatus'] or 'blank'}"
        ),
        (
            "Negative-path spot checks: "
            f"pass={negative['counts']['pass']}, "
            f"fail={negative['counts']['fail']}, "
            f"blocked={negative['counts']['blocked']}, "
            f"n/a={negative['counts']['n/a']}, "
            f"blank={negative['counts']['blank']}, "
            f"other={negative['counts']['other']}"
        ),
    ]
    if summary["issues"]:
        lines.append("Issues:")
        lines.extend(f"- {issue}" for issue in summary["issues"])
    else:
        lines.append("No issues detected.")
    return "\n".join(lines) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check whether a filled Stripe verification packet is still open or closure-ready.",
    )
    parser.add_argument("packet", nargs="?", type=Path, default=DEFAULT_PACKET)
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument("--output", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    packet_path = args.packet.resolve()
    if not packet_path.exists():
        raise SystemExit(f"Stripe verification packet not found: {packet_path}")

    try:
        summary = analyze_packet(packet_path)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    rendered = json.dumps(summary, indent=2, ensure_ascii=False) + "\n" if args.format == "json" else _render_text(summary)
    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8", newline="\n")
    else:
        print(rendered, end="")

    return 0 if summary["closureReady"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
