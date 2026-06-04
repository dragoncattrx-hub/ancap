from __future__ import annotations

"""Generate a dated Stripe verification evidence packet from the checked-in template.

Source template: docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md
Default dated output: docs/stripe-verification-YYYY-MM-DD.md
"""

import argparse
import subprocess
from datetime import date, datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = REPO_ROOT / "docs" / "STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "docs"
DEFAULT_BASENAME = "stripe-verification"
DEFAULT_LATEST_ALIAS_LABEL = "latest"


def _validate_filename_component(value: str, *, flag_name: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f"{flag_name} requires a non-empty value")

    candidate = Path(trimmed)
    if candidate.name != trimmed or candidate.parent != Path("."):
        raise ValueError(f"{flag_name} must be a filename component only, not a path: {trimmed}")
    if trimmed in {".", ".."}:
        raise ValueError(f"{flag_name} must not be '.' or '..'")
    return trimmed


def build_output_path(*, output_dir: Path, basename: str, date_label: str) -> Path:
    stem = f"{basename}-{date_label}" if date_label else basename
    return output_dir / f"{stem}.md"


def build_latest_alias_path(*, output_dir: Path, basename: str) -> Path:
    return output_dir / f"{basename}-{DEFAULT_LATEST_ALIAS_LABEL}.md"


def _run_git_capture(*args: str) -> str | None:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    value = result.stdout.strip()
    return value or None


def _current_repo_head_context() -> dict[str, str | bool | None]:
    head_ref = _run_git_capture("symbolic-ref", "--quiet", "--short", "HEAD")
    head_commit = _run_git_capture("rev-parse", "HEAD")
    status_output = _run_git_capture("status", "--short")
    working_tree_dirty = bool(status_output) if status_output is not None else False
    return {
        "headRef": head_ref,
        "headCommit": head_commit,
        "workingTreeDirty": working_tree_dirty,
    }


def _replace_first_line(text: str, prefix: str, value: str) -> str:
    lines = text.splitlines(keepends=True)
    for index, line in enumerate(lines):
        if line.startswith(prefix):
            line_ending = ""
            if line.endswith("\r\n"):
                line_ending = "\r\n"
            elif line.endswith("\n"):
                line_ending = "\n"
            lines[index] = f"{prefix}{value}{line_ending}"
            return "".join(lines)
    raise ValueError(f"Could not find template line starting with: {prefix!r}")


def _display_path(path: Path) -> str:
    try:
        return path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


def render_packet(
    template_text: str,
    *,
    generated_at_utc: str,
    template_path: Path,
    output_path: Path,
    operator: str,
    verification_date: str,
    commit_sha: str,
    environment: str,
    api_base_url: str,
    wallet_ui_url: str,
    stripe_mode: str,
    webhook_delivery_path: str,
    authenticated_test_user: str,
    package_slug: str,
    fiat_amount_currency: str,
    expected_acp_credit_amount: str,
    notes: str,
    latest_alias_path: Path | None,
) -> str:
    rendered = template_text.replace(
        "# Stripe Verification Evidence Template",
        "# Stripe Verification Evidence Packet",
        1,
    )
    rendered = _replace_first_line(
        rendered,
        "> Status:",
        " generated scaffold from template | Added: 2026-06-01",
    )
    replacements = {
        "- Date:": f" {verification_date}",
        "- Operator:": f" {operator}",
        "- Commit SHA:": f" {commit_sha}",
        "- Environment:": f" {environment}",
        "- API base URL:": f" {api_base_url}",
        "- Wallet UI URL:": f" {wallet_ui_url}",
        "- Stripe mode:": f" {stripe_mode}",
        "- Webhook delivery path:": f" {webhook_delivery_path}",
        "- Authenticated test user id/email:": f" {authenticated_test_user}",
        "- Package slug:": f" {package_slug}",
        "- Fiat amount / currency:": f" {fiat_amount_currency}",
        "- Expected ACP credit amount:": f" {expected_acp_credit_amount}",
        "- Notes:": f" {notes}",
    }
    for prefix, value in replacements.items():
        rendered = _replace_first_line(rendered, prefix, value)

    repo_head = _current_repo_head_context()
    dirty_text = "dirty" if repo_head.get("workingTreeDirty") else "clean"
    head_ref = repo_head.get("headRef") or "HEAD"
    head_commit = repo_head.get("headCommit") or "unknown"

    appendix_lines = [
        "",
        "## Packet bootstrap metadata",
        f"- Generated at (UTC): `{generated_at_utc}`",
        f"- Source template: `{_display_path(template_path)}`",
        f"- Output path: `{_display_path(output_path)}`",
        f"- Latest alias path: `{_display_path(latest_alias_path)}`" if latest_alias_path else "- Latest alias path: not written (`--no-write-latest-alias`)",
        "- Generator: `scripts/generate_stripe_verification_packet.py`",
        f"- Generator repo HEAD: `{head_ref}` @ `{head_commit}` ({dirty_text} working tree)",
        "- Reminder: this packet is prefilled scaffolding only. Keep roadmap item `4.1 Stripe / fiat payment gateway` open until a real webhook-confirmed new-card run and a real saved-card reuse run are both evidenced here.",
    ]
    appendix = "\n".join(appendix_lines)
    return rendered.rstrip() + appendix + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a dated Stripe verification evidence packet from the checked-in template.",
    )
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--basename", default=DEFAULT_BASENAME)
    parser.add_argument("--date-label", default=date.today().isoformat())
    parser.add_argument("--operator", default="")
    parser.add_argument("--verification-date", default=date.today().isoformat())
    parser.add_argument("--commit-sha", default="")
    parser.add_argument("--environment", default="local prod-like")
    parser.add_argument("--api-base-url", default="http://127.0.0.1:8080/api/v1")
    parser.add_argument("--wallet-ui-url", default="http://127.0.0.1:8080/wallet/credits")
    parser.add_argument("--stripe-mode", default="test")
    parser.add_argument("--webhook-delivery-path", default="")
    parser.add_argument("--authenticated-test-user", default="")
    parser.add_argument("--package-slug", default="launch-credits")
    parser.add_argument("--fiat-amount-currency", default="")
    parser.add_argument("--expected-acp-credit-amount", default="")
    parser.add_argument("--notes", default="")
    parser.add_argument("--no-write-latest-alias", action="store_true")
    parser.add_argument("--overwrite", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        basename = _validate_filename_component(args.basename, flag_name="--basename")
        date_label = _validate_filename_component(args.date_label, flag_name="--date-label")
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    template_path = args.template.resolve()
    output_dir = args.output_dir.resolve()
    write_latest_alias = not args.no_write_latest_alias
    if write_latest_alias and date_label == DEFAULT_LATEST_ALIAS_LABEL:
        raise SystemExit(
            "--date-label latest is reserved for the stable latest alias. Pass --no-write-latest-alias if you intentionally want a dated file named latest."
        )

    output_path = build_output_path(output_dir=output_dir, basename=basename, date_label=date_label)
    latest_alias_path = build_latest_alias_path(output_dir=output_dir, basename=basename) if write_latest_alias else None

    if not template_path.exists():
        raise SystemExit(f"Template not found: {template_path}")
    output_dir.mkdir(parents=True, exist_ok=True)

    if output_path.exists() and not args.overwrite:
        raise SystemExit(
            f"Refusing to overwrite existing packet: {output_path}. Pass --overwrite to replace it."
        )

    template_text = template_path.read_text(encoding="utf-8")
    commit_sha = args.commit_sha.strip() or (_run_git_capture("rev-parse", "HEAD") or "unknown")
    generated_at_utc = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    rendered = render_packet(
        template_text,
        generated_at_utc=generated_at_utc,
        template_path=template_path,
        output_path=output_path,
        operator=args.operator.strip(),
        verification_date=args.verification_date.strip(),
        commit_sha=commit_sha,
        environment=args.environment.strip(),
        api_base_url=args.api_base_url.strip(),
        wallet_ui_url=args.wallet_ui_url.strip(),
        stripe_mode=args.stripe_mode.strip(),
        webhook_delivery_path=args.webhook_delivery_path.strip(),
        authenticated_test_user=args.authenticated_test_user.strip(),
        package_slug=args.package_slug.strip(),
        fiat_amount_currency=args.fiat_amount_currency.strip(),
        expected_acp_credit_amount=args.expected_acp_credit_amount.strip(),
        notes=args.notes.strip(),
        latest_alias_path=latest_alias_path,
    )
    output_path.write_text(rendered, encoding="utf-8", newline="\n")
    if latest_alias_path is not None:
        latest_alias_path.write_text(rendered, encoding="utf-8", newline="\n")

    print("Saved Stripe verification packet:")
    print(f"- dated packet: {output_path}")
    if latest_alias_path is not None:
        print(f"- latest alias: {latest_alias_path}")
    print("Reminder: fill both Run A and Run B with real webhook/saved-card evidence before closing roadmap item 4.1.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
