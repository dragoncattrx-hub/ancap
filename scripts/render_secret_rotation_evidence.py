from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath, PureWindowsPath
from typing import Any


REQUIRED_REPORT_KEYS = {
    "ok",
    "repo_root",
    "include_untracked",
    "staged_only",
    "history_range",
    "recent_history_count",
    "history_scope",
    "tracked_files_scanned",
    "untracked_files_scanned",
    "staged_files_scanned",
    "history_commits_scanned",
    "allowed_paths",
    "findings",
}
OPTIONAL_REPORT_KEYS_DEFAULTS = {
    "head_ref": None,
    "head_commit": None,
    "working_tree_dirty": False,
}


def _normalized_path_key(path: Path) -> str:
    return os.path.normcase(str(path.expanduser().resolve(strict=False)))


def _normalized_repo_root_key(value: str) -> str:
    normalized = os.path.expanduser(value.strip())
    if not normalized:
        return normalized
    if len(normalized) >= 2 and normalized[1] == ":":
        return str(PureWindowsPath(normalized)).lower()
    if normalized.startswith(("\\\\", "//")):
        return str(PureWindowsPath(normalized)).lower()
    return str(PurePosixPath(normalized))


def validate_distinct_paths(*, tracked_path: Path, history_path: Path | None, output_path: Path | None) -> None:
    distinct_paths: dict[str, str] = {
        "tracked-report": _normalized_path_key(tracked_path),
    }
    if history_path is not None:
        history_key = _normalized_path_key(history_path)
        if history_key in distinct_paths.values():
            raise ValueError(
                "Tracked and secondary secret-hygiene artifact paths must be different files"
            )
        distinct_paths["history-report"] = history_key
    if output_path is not None:
        output_key = _normalized_path_key(output_path)
        if output_key in distinct_paths.values():
            raise ValueError(
                "Output markdown path must be different from the input JSON artifact paths"
            )


def load_report(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    missing = sorted(REQUIRED_REPORT_KEYS.difference(payload))
    if missing:
        missing_text = ", ".join(missing)
        raise ValueError(f"{path} is missing required report key(s): {missing_text}")
    if not isinstance(payload["findings"], list):
        raise ValueError(f"{path} has invalid findings payload; expected a list")
    payload.setdefault("pending_push", False)
    for key, default in OPTIONAL_REPORT_KEYS_DEFAULTS.items():
        payload.setdefault(key, default)
    return payload


def validate_report_pair(
    *,
    tracked_path: Path,
    tracked_report: dict[str, Any],
    history_path: Path | None,
    history_report: dict[str, Any] | None,
) -> None:
    if tracked_report["pending_push"] or tracked_report["history_scope"]:
        raise ValueError(
            f"{tracked_path} must be a primary tracked/working-tree/staged scan artifact, not a history or pending-push report"
        )

    if history_path is None or history_report is None:
        return

    if _normalized_repo_root_key(history_report["repo_root"]) != _normalized_repo_root_key(
        tracked_report["repo_root"]
    ):
        raise ValueError(
            f"{history_path} repo_root does not match {tracked_path}; use artifacts from the same repo/worktree"
        )

    tracked_head_commit = tracked_report.get("head_commit")
    history_head_commit = history_report.get("head_commit")
    if tracked_head_commit and history_head_commit and history_head_commit != tracked_head_commit:
        raise ValueError(
            f"{history_path} head_commit does not match {tracked_path}; use artifacts from the same exact scanned checkout"
        )

    if not history_report["pending_push"] and not history_report["history_scope"]:
        raise ValueError(
            f"{history_path} must be a history or pending-push scan artifact, not another tracked-files report"
        )


def scan_label(payload: dict[str, Any]) -> str:
    if payload["pending_push"]:
        return "Pending-push scan"
    if payload["history_scope"]:
        return "History scan"
    if payload["staged_only"]:
        return "Staged scan"
    if payload["include_untracked"]:
        return "Tracked + untracked scan"
    return "Tracked-files scan"


def scan_summary(payload: dict[str, Any]) -> str:
    parts: list[str] = []
    if payload["tracked_files_scanned"]:
        parts.append(f"{payload['tracked_files_scanned']} tracked files scanned")
    if payload["include_untracked"] or payload["untracked_files_scanned"]:
        parts.append(f"{payload['untracked_files_scanned']} untracked files scanned")
    if payload["staged_only"] or payload["staged_files_scanned"]:
        parts.append(f"{payload['staged_files_scanned']} staged files scanned")
    if payload["history_scope"]:
        parts.append(
            f"{payload['history_commits_scanned']} commits scanned from {payload['history_scope']}"
        )
    if not parts:
        parts.append("0 files scanned")
    return "; ".join(parts)


def render_finding(finding: dict[str, Any]) -> str:
    location = f"{finding['path']}:{finding['line_number']}"
    if finding.get("source_ref"):
        location = f"{finding['source_ref']}:{location}"
    return f"- `{location}` — {finding['label']} — `{finding['line']}`"


def render_report_section(title: str, source_path: Path, payload: dict[str, Any]) -> list[str]:
    status = "PASS" if payload["ok"] else "FAIL"
    lines = [
        f"### {title}",
        f"- Source artifact: `{source_path.as_posix()}`",
        f"- Scan mode: {scan_label(payload)}",
        f"- Result: **{status}**",
        f"- Scope summary: {scan_summary(payload)}",
    ]
    if payload.get("head_commit"):
        head_ref = payload.get("head_ref") or "HEAD"
        dirty_text = "dirty" if payload.get("working_tree_dirty") else "clean"
        lines.append(f"- Repo HEAD context: `{head_ref}` @ `{payload['head_commit']}` ({dirty_text} working tree)")
    if payload["allowed_paths"]:
        allowlist = ", ".join(f"`{path}`" for path in payload["allowed_paths"])
        lines.append(f"- Remediation-note allowlist: {allowlist}")
    if payload["findings"]:
        lines.append("- Redacted findings:")
        lines.extend(render_finding(finding) for finding in payload["findings"])
    else:
        lines.append("- Redacted findings: none")
    return lines


def render_markdown(*, tracked_path: Path, tracked_report: dict[str, Any], history_path: Path | None, history_report: dict[str, Any] | None) -> str:
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    repo_root = tracked_report["repo_root"]
    lines = [
        "# Secret Rotation Evidence",
        "",
        f"- Generated at: `{generated_at}`",
        f"- Repo root: `{repo_root}`",
        "- Secret values remain intentionally redacted; use this document for operator handoff and incident closure notes.",
        "",
        "## Scan artifact summary",
        "",
    ]
    lines.extend(render_report_section("Primary artifact", tracked_path, tracked_report))
    lines.append("")
    if history_path and history_report:
        lines.extend(render_report_section("Secondary history / pending-push artifact", history_path, history_report))
        lines.append("")
    lines.extend(
        [
            "## Operator incident checklist",
            "",
            "Fill these fields without copying the secret value itself:",
            "",
            "- Secret class/type:",
            "- Exposure location(s):",
            "- First known exposure time (or earliest possible window):",
            "- Upstream revoke/rotation completion time:",
            "- Replacement credential storage location (env / CI / secret manager only):",
            "- Affected environment(s):",
            "- Related sessions/tokens invalidated:",
            "- Provider-side access / dashboard cleanup completed:",
            "- Logs, webhook deliveries, or billing/audit traces reviewed:",
            "- Follow-up alerts/tickets/issues:",
            "",
            "## Closure gate",
            "",
            "Only mark the incident closed when all of the following are true:",
            "",
            "- old credential is revoked/invalid",
            "- replacement credential is stored outside the repo",
            "- tracked repo files are clean",
            "- secret hygiene regression tests pass",
            "- roadmap/status docs reflect any remaining manual blocker",
            "- provider-side access cleanup is complete",
        ]
    )
    return "\n".join(lines) + "\n"


def emit_text(text: str, *, output_path: str | None) -> None:
    if output_path:
        destination = Path(output_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text, encoding="utf-8")
    print(text, end="")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Render a markdown handoff document from a primary secret-hygiene JSON artifact plus an optional history/pending-push secondary artifact."
    )
    parser.add_argument(
        "--tracked-report",
        required=True,
        help="Path to a JSON report from scripts/check_secret_hygiene.py for the primary tracked/default, staged, or tracked+untracked scope.",
    )
    parser.add_argument(
        "--history-report",
        "--secondary-report",
        dest="history_report",
        help="Optional path to a JSON history or pending-push scan report from scripts/check_secret_hygiene.py.",
    )
    parser.add_argument(
        "--output",
        help="Optional markdown path to write in addition to stdout.",
    )
    args = parser.parse_args(argv)

    try:
        tracked_path = Path(args.tracked_report)
        history_path: Path | None = Path(args.history_report) if args.history_report else None
        output_path = Path(args.output) if args.output else None
        validate_distinct_paths(
            tracked_path=tracked_path,
            history_path=history_path,
            output_path=output_path,
        )
        tracked_report = load_report(tracked_path)
        history_report: dict[str, Any] | None = None
        if history_path:
            history_report = load_report(history_path)
        validate_report_pair(
            tracked_path=tracked_path,
            tracked_report=tracked_report,
            history_path=history_path,
            history_report=history_report,
        )
        markdown = render_markdown(
            tracked_path=tracked_path,
            tracked_report=tracked_report,
            history_path=history_path,
            history_report=history_report,
        )
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"Failed to render secret rotation evidence: {exc}", file=sys.stderr)
        return 1

    emit_text(markdown, output_path=str(output_path) if output_path else None)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
