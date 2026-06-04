from __future__ import annotations

"""Helper to generate a primary secret-hygiene JSON artifact (tracked-files by default, or staged / tracked+untracked) plus a history/pending-push secondary artifact and render the markdown incident worksheet in one command."""

import argparse
import os
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CHECK_SECRET_HYGIENE = REPO_ROOT / "scripts" / "check_secret_hygiene.py"
RENDER_SECRET_ROTATION_EVIDENCE = REPO_ROOT / "scripts" / "render_secret_rotation_evidence.py"
DEFAULT_TRACKED_REPORT = Path("tmp/secret-hygiene-report.json")
DEFAULT_HISTORY_REPORT = Path("tmp/secret-hygiene-history-report.json")
DEFAULT_PENDING_PUSH_REPORT = Path("tmp/secret-hygiene-pending-push-report.json")
DEFAULT_MARKDOWN_OUTPUT = Path("tmp/secret-rotation-evidence.md")


def _normalized_path_key(path: Path) -> str:
    return os.path.normcase(str(path.expanduser().resolve(strict=False)))


def _validate_distinct_paths(*, tracked_report: Path, secondary_report: Path, markdown_output: Path) -> None:
    tracked_key = _normalized_path_key(tracked_report)
    secondary_key = _normalized_path_key(secondary_report)
    markdown_key = _normalized_path_key(markdown_output)

    if tracked_key == secondary_key:
        raise ValueError("Primary tracked-report and secondary-report paths must be different files")

    if markdown_key in {tracked_key, secondary_key}:
        raise ValueError("Markdown output path must be different from the input JSON artifact paths")


def _run_command(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )


def _emit_completed_process(result: subprocess.CompletedProcess[str]) -> None:
    if result.stdout:
        print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
    if result.stderr:
        print(result.stderr, file=sys.stderr, end="" if result.stderr.endswith("\n") else "\n")


def _scan_result_ok(result: subprocess.CompletedProcess[str]) -> bool:
    return result.returncode in (0, 1)


def _build_secondary_scan_command(
    *,
    secondary_report: Path,
    history_range: str | None,
    recent_history: int | None,
    pending_push: bool,
) -> list[str]:
    command = [
        sys.executable,
        str(CHECK_SECRET_HYGIENE),
    ]
    if pending_push:
        command.append("--pending-push")
    elif history_range:
        command.extend(["--history-range", history_range])
    else:
        command.extend(["--recent-history", str(recent_history)])
    command.extend(["--format", "json", "--output", str(secondary_report)])
    return command


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "generate a primary secret-hygiene JSON artifact (tracked-files by default, or staged / tracked+untracked) "
            "plus a history/pending-push secondary artifact and render the markdown incident worksheet in one command."
        )
    )
    secondary_group = parser.add_mutually_exclusive_group()
    secondary_group.add_argument(
        "--history-range",
        help="Use an explicit git rev-range for the secondary history scan.",
    )
    secondary_group.add_argument(
        "--pending-push",
        action="store_true",
        help="Use the exact local commit history about to leave the workstation as the secondary scan.",
    )
    parser.add_argument(
        "--recent-history",
        type=int,
        default=20,
        help="Commit count for the default clone-safe recent-history secondary scan (default: 20).",
    )
    primary_group = parser.add_mutually_exclusive_group()
    primary_group.add_argument(
        "--include-untracked",
        action="store_true",
        help="Also include untracked, non-ignored working-tree files in the primary tracked-files artifact when local temp/export leak coverage is needed.",
    )
    primary_group.add_argument(
        "--staged-primary",
        action="store_true",
        help="Use the staged git-index scan as the primary artifact instead of the default tracked-files scan when release/pre-commit evidence should reflect the index rather than the working tree.",
    )
    parser.add_argument(
        "--tracked-report",
        default=str(DEFAULT_TRACKED_REPORT),
        help=f"Primary JSON report path (default: {DEFAULT_TRACKED_REPORT.as_posix()}).",
    )
    parser.add_argument(
        "--secondary-report",
        help=(
            "Secondary JSON report path. Defaults to tmp/secret-hygiene-history-report.json "
            "or tmp/secret-hygiene-pending-push-report.json when --pending-push is used."
        ),
    )
    parser.add_argument(
        "--markdown-output",
        default=str(DEFAULT_MARKDOWN_OUTPUT),
        help=f"Rendered markdown worksheet path (default: {DEFAULT_MARKDOWN_OUTPUT.as_posix()}).",
    )
    args = parser.parse_args(argv)

    if args.recent_history <= 0:
        parser.error("--recent-history requires a positive commit count")

    history_range = args.history_range
    if history_range is not None:
        history_range = history_range.strip()
        if not history_range:
            parser.error("--history-range requires a non-empty git rev-range, for example HEAD~20..HEAD")

    tracked_report = Path(args.tracked_report)
    if args.secondary_report:
        secondary_report = Path(args.secondary_report)
    else:
        secondary_report = DEFAULT_PENDING_PUSH_REPORT if args.pending_push else DEFAULT_HISTORY_REPORT
    markdown_output = Path(args.markdown_output)

    try:
        _validate_distinct_paths(
            tracked_report=tracked_report,
            secondary_report=secondary_report,
            markdown_output=markdown_output,
        )
    except ValueError as exc:
        parser.error(str(exc))

    tracked_command = [
        sys.executable,
        str(CHECK_SECRET_HYGIENE),
        "--format",
        "json",
        "--output",
        str(tracked_report),
    ]
    if args.staged_primary:
        tracked_command.append("--staged")
    elif args.include_untracked:
        tracked_command.append("--include-untracked")
    tracked_result = _run_command(tracked_command)
    _emit_completed_process(tracked_result)
    if not _scan_result_ok(tracked_result):
        print("Failed to generate tracked-files secret hygiene artifact.", file=sys.stderr)
        return tracked_result.returncode or 1

    secondary_command = _build_secondary_scan_command(
        secondary_report=secondary_report,
        history_range=history_range,
        recent_history=args.recent_history,
        pending_push=args.pending_push,
    )
    secondary_result = _run_command(secondary_command)
    _emit_completed_process(secondary_result)
    if not _scan_result_ok(secondary_result):
        print("Failed to generate secondary secret hygiene artifact.", file=sys.stderr)
        return secondary_result.returncode or 1

    render_command = [
        sys.executable,
        str(RENDER_SECRET_ROTATION_EVIDENCE),
        "--tracked-report",
        str(tracked_report),
        "--secondary-report",
        str(secondary_report),
        "--output",
        str(markdown_output),
    ]
    render_result = _run_command(render_command)
    _emit_completed_process(render_result)
    if render_result.returncode != 0:
        print("Failed to render secret rotation evidence worksheet.", file=sys.stderr)
        return render_result.returncode or 1

    all_clean = tracked_result.returncode == 0 and secondary_result.returncode == 0
    return 0 if all_clean else 1


if __name__ == "__main__":
    raise SystemExit(main())
