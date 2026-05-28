from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
ALLOWED_PATTERN_PATHS = {
    Path("MASTER_ROADMAP.md"),
}
TOKEN_PATTERNS: tuple[tuple[bytes, str], ...] = (
    (b"sk" + b"-aw-", "provider API key pattern"),
    (b"sk" + b"-prod-", "provider production API key pattern"),
    (b"sk_" + b"live_", "Stripe live secret key pattern"),
    (b"pk_" + b"live_", "Stripe live publishable key pattern"),
    (b"wh" + b"sec_", "Stripe webhook secret pattern"),
    (b"gh" + b"p_", "GitHub personal access token pattern"),
    (b"gh" + b"s_", "GitHub server token pattern"),
    (b"gh" + b"o_", "GitHub OAuth token pattern"),
)


@dataclass(frozen=True)
class SecretMatch:
    path: Path
    line_number: int
    label: str
    line: str


def tracked_files(repo_root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=repo_root,
        check=True,
        capture_output=True,
    )
    files: list[Path] = []
    for raw_path in result.stdout.split(b"\x00"):
        if not raw_path:
            continue
        files.append(Path(raw_path.decode("utf-8", errors="surrogateescape")))
    return files


def scan_file(repo_root: Path, relative_path: Path) -> list[SecretMatch]:
    if relative_path in ALLOWED_PATTERN_PATHS:
        return []

    file_bytes = (repo_root / relative_path).read_bytes()
    if b"\x00" in file_bytes:
        return []

    matches: list[SecretMatch] = []
    for line_number, line in enumerate(file_bytes.splitlines(), start=1):
        for pattern, label in TOKEN_PATTERNS:
            if pattern in line:
                snippet = line.decode("utf-8", errors="replace").strip()
                if len(snippet) > 180:
                    snippet = snippet[:177] + "..."
                matches.append(
                    SecretMatch(
                        path=relative_path,
                        line_number=line_number,
                        label=label,
                        line=snippet,
                    )
                )
    return matches


def scan_repo(repo_root: Path) -> list[SecretMatch]:
    findings: list[SecretMatch] = []
    for relative_path in tracked_files(repo_root):
        findings.extend(scan_file(repo_root, relative_path))
    return findings


def main() -> int:
    findings = scan_repo(REPO_ROOT)
    if findings:
        print("Secret hygiene scan failed. Unexpected token-shaped patterns found in tracked files:", file=sys.stderr)
        for finding in findings:
            print(
                f"- {finding.path}:{finding.line_number}: {finding.label}: {finding.line}",
                file=sys.stderr,
            )
        allowed = ", ".join(sorted(path.as_posix() for path in ALLOWED_PATTERN_PATHS)) or "<none>"
        print(f"Allowed remediation-note paths: {allowed}", file=sys.stderr)
        return 1

    tracked_count = len(tracked_files(REPO_ROOT))
    allowed = ", ".join(sorted(path.as_posix() for path in ALLOWED_PATTERN_PATHS)) or "<none>"
    print(
        "Secret hygiene scan passed: "
        f"{tracked_count} tracked files scanned; remediation-note allowlist: {allowed}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
