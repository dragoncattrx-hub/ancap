from pathlib import Path
import stat
import subprocess
import sys


REPO_ROOT = Path(__file__).resolve().parents[1]
README = REPO_ROOT / "README.md"
SECURITY = REPO_ROOT / "SECURITY.md"
SECRET_ROTATION_RUNBOOK = REPO_ROOT / "docs" / "SECRET_ROTATION_RUNBOOK.md"
PRODUCTION_SECRET_BASELINE = REPO_ROOT / "docs" / "PRODUCTION_SECRET_BASELINE.md"
STATUS_MATRIX = REPO_ROOT / "docs" / "STATUS_MATRIX.md"
MASTER_ROADMAP = REPO_ROOT / "MASTER_ROADMAP.md"
PRODUCTION_ROADMAP = REPO_ROOT / "PRODUCTION_ROADMAP.md"
RELEASE_PROCESS = REPO_ROOT / ".github" / "RELEASE_PROCESS.md"
SECRET_HYGIENE_CHECK = REPO_ROOT / "scripts" / "check_secret_hygiene.py"
INSTALL_GIT_HOOKS = REPO_ROOT / "scripts" / "install_git_hooks.py"
RENDER_SECRET_ROTATION_EVIDENCE = REPO_ROOT / "scripts" / "render_secret_rotation_evidence.py"
GENERATE_SECRET_HYGIENE_EVIDENCE = REPO_ROOT / "scripts" / "generate_secret_hygiene_evidence.py"
GIT_HOOKS_README = REPO_ROOT / ".githooks" / "README.md"
PRE_COMMIT_HOOK = REPO_ROOT / ".githooks" / "pre-commit"
ENV_EXAMPLE = REPO_ROOT / ".env.example"


def test_secret_rotation_runbook_exists_and_is_linked_from_security_docs():
    runbook_text = SECRET_ROTATION_RUNBOOK.read_text(encoding="utf-8")
    security_text = SECURITY.read_text(encoding="utf-8")
    readme_text = README.read_text(encoding="utf-8")

    assert "Treat the exposed value as compromised" in runbook_text
    assert "Revoke or rotate at the upstream provider first" in runbook_text
    assert "python scripts/check_secret_hygiene.py" in runbook_text
    assert "python scripts/check_secret_hygiene.py --staged" in runbook_text
    assert "python scripts/check_secret_hygiene.py --include-untracked" in runbook_text
    assert "python scripts/check_secret_hygiene.py --format json --output" in runbook_text
    assert "secret-hygiene-history-report.json" in runbook_text
    assert "push and pull_request events now scan the exact pushed/PR commit delta when GitHub provides those SHAs *and that rev-range actually resolves in the checked-out clone*, otherwise they fall back to the clone-safe `--recent-history 20` path" in runbook_text
    assert "tagged releases now use that same clone-safe `--recent-history 20` artifact path as release evidence" in runbook_text
    assert "Tagged releases now also upload those JSON/markdown artifacts before the final explicit secret-hygiene gate step" in runbook_text
    assert "scheduled sweeps now use that same clone-safe `--recent-history 20` path" in runbook_text
    assert "manual runs use that same clone-safe recent-history sweep when `history_range` is left blank" in runbook_text
    assert "python scripts/install_git_hooks.py" in runbook_text
    assert "py -3 scripts/install_git_hooks.py" in runbook_text
    assert "python scripts/install_git_hooks.py --check" in runbook_text
    assert "py -3 scripts/install_git_hooks.py --check" in runbook_text
    assert "python3`, then `py -3`" in runbook_text
    assert "scripts/render_secret_rotation_evidence.py" in runbook_text
    assert "scripts/generate_secret_hygiene_evidence.py" in runbook_text
    assert "py -3 scripts/check_secret_hygiene.py ..." in runbook_text
    assert "py -3 scripts/render_secret_rotation_evidence.py ..." in runbook_text
    assert "py -3 scripts/generate_secret_hygiene_evidence.py ..." in runbook_text
    assert "Add `--include-untracked`" in runbook_text
    assert "tmp/secret-rotation-evidence.md" in runbook_text
    assert ".githooks/pre-push" in runbook_text
    assert "--recent-history <count>" in runbook_text
    assert "--pending-push" in runbook_text
    assert "upload `tmp/secret-hygiene-report.json` as the evidence artifact" in runbook_text
    assert "tmp/secret-rotation-evidence.md" in runbook_text
    assert "secret-rotation-evidence" in runbook_text
    assert "tracked path that is currently missing from the working tree" in runbook_text
    assert "temp/export artifacts" in runbook_text
    assert "pytest tests/test_secret_hygiene.py tests/test_release_security_workflows.py -q" in runbook_text
    assert "docs/SECRET_ROTATION_RUNBOOK.md" in security_text
    assert "docs/SECRET_ROTATION_RUNBOOK.md" in readme_text
    assert "scripts/check_secret_hygiene.py" in readme_text
    assert "scripts/install_git_hooks.py" in readme_text
    assert "py -3 scripts/install_git_hooks.py" in readme_text
    assert "py -3 scripts/install_git_hooks.py --check" in readme_text
    assert "--check for a non-mutating verification" in readme_text
    assert "then `py -3`" in readme_text
    assert "scripts/render_secret_rotation_evidence.py" in readme_text
    assert "scripts/generate_secret_hygiene_evidence.py" in readme_text
    assert "py -3 scripts/check_secret_hygiene.py ..." in readme_text
    assert "py -3 scripts/render_secret_rotation_evidence.py ..." in readme_text
    assert "py -3 scripts/generate_secret_hygiene_evidence.py ..." in readme_text
    assert "add `--include-untracked` when local temp/export artifact coverage matters" in readme_text
    assert "pre-push" in readme_text
    assert "tmp/secret-hygiene-report.json" in readme_text
    assert "tmp/secret-hygiene-history-report.json" in readme_text
    assert "tmp/secret-hygiene-pending-push-report.json" in readme_text
    assert "tmp/secret-rotation-evidence.md" in readme_text
    assert "secret-rotation-evidence" in readme_text
    assert "push/PR delta sweeps when GitHub supplies the commit SHAs and that rev-range still resolves in the checkout and otherwise falls back to clone-safe recent-history sweeps" in readme_text
    assert "scheduled clone-safe recent-history sweeps" in readme_text
    assert "manual blank-input recent-history sweeps" in readme_text
    assert "tagged-release clone-safe recent-history evidence" in readme_text
    assert "uploads those release-time artifacts before the final explicit secret-hygiene gate step" in readme_text
    assert "falls back to the git index for tracked-but-currently-missing paths" in readme_text
    assert "copy-safe markdown incident worksheet" in readme_text
    assert "--recent-history <count>" in readme_text
    assert "--pending-push" in readme_text
    assert "exact pending-push pre-push sweep" in readme_text
    assert "tracked branch upstream when that ref is still resolvable" in readme_text
    assert "OpenAI project/service-account prefixes plus Anthropic/GitHub/Stripe/provider token-shaped patterns" in readme_text


def test_status_and_roadmap_keep_manual_secret_rotation_tail_explicit():
    status_text = STATUS_MATRIX.read_text(encoding="utf-8")
    roadmap_text = MASTER_ROADMAP.read_text(encoding="utf-8")

    assert "upstream revoke/rotation" in status_text
    assert "docs/SECRET_ROTATION_RUNBOOK.md" in status_text
    assert "scripts/check_secret_hygiene.py" in status_text
    assert "--staged" in status_text
    assert "--include-untracked" in status_text
    assert "--format json --output" in status_text
    assert "redacted finding previews" in status_text
    assert "OpenAI project/service-account prefixes" in status_text
    assert "Anthropic prefixes" in status_text
    assert "secret-hygiene-report.json" in status_text
    assert "secret-hygiene-history-report.json" in status_text
    assert "secret-hygiene-pending-push-report.json" in status_text
    assert "secret-rotation-evidence" in status_text
    assert "upload the tracked/history/markdown evidence artifacts before the final explicit gate step" in status_text
    assert "push and pull_request commit deltas when GitHub provides those SHAs and that rev-range still resolves in the checkout and otherwise clone-safe `--recent-history 20` fallbacks" in status_text
    assert "scheduled clone-safe `--recent-history 20` sweeps" in status_text
    assert "manual blank-input runs using that same clone-safe recent-history path" in status_text
    assert "scripts/install_git_hooks.py" in status_text
    assert "py -3 scripts/install_git_hooks.py" in status_text
    assert "py -3 scripts/install_git_hooks.py --check" in status_text
    assert "non-mutating `--check` verification path" in status_text
    assert "then `py -3`" in status_text
    assert "scripts/render_secret_rotation_evidence.py" in status_text
    assert "scripts/generate_secret_hygiene_evidence.py" in status_text
    assert "py -3 scripts/check_secret_hygiene.py ..." in status_text
    assert "py -3 scripts/render_secret_rotation_evidence.py ..." in status_text
    assert "py -3 scripts/generate_secret_hygiene_evidence.py ..." in status_text
    assert "optionally widen that primary artifact with `--include-untracked`" in status_text
    assert "--recent-history <count>" in status_text
    assert "--pending-push" in status_text
    assert "when that ref is still resolvable" in status_text
    assert ".githooks/pre-commit" in status_text
    assert ".githooks/pre-push" in status_text
    assert "tracked-but-currently-missing" in status_text
    assert "temp/export artifacts" in status_text
    assert "Cloudflare-routed `ancap.cloud` / `api.ancap.cloud` header checks now match the canonical" in status_text
    assert "Status: [x] Done. Inner prod proxy, outer origin nginx, and public Cloudflare-routed responses are now aligned" in roadmap_text
    assert "https://ancap.cloud/api/v1/system/health` now returns `X-Frame-Options: DENY`" in roadmap_text
    assert "Revoke the compromised provider key at the upstream dashboard/API" in roadmap_text
    assert "scripts/check_secret_hygiene.py" in roadmap_text
    assert "--staged" in roadmap_text
    assert "--include-untracked" in roadmap_text
    assert "--format json --output" in roadmap_text
    assert "redacted finding previews" in roadmap_text
    assert "OpenAI project/service-account prefixes" in roadmap_text
    assert "Anthropic prefixes" in roadmap_text
    assert "secret-hygiene-report.json" in roadmap_text
    assert "secret-hygiene-history-report.json" in roadmap_text
    assert "secret-rotation-evidence" in roadmap_text
    assert "uploading the tracked/history/markdown evidence artifacts before the final explicit secret-hygiene gate step" in roadmap_text
    assert "push/pull_request commit deltas when GitHub provides those SHAs and that rev-range still resolves in the checkout and otherwise a clone-safe `--recent-history 20` fallback" in roadmap_text
    assert "scheduled sweeps on the clone-safe `--recent-history 20` path" in roadmap_text
    assert "manual sweeps using the same clone-safe recent-history path whenever `history_range` is left blank" in roadmap_text
    assert "scripts/install_git_hooks.py" in roadmap_text
    assert "py -3 scripts/install_git_hooks.py" in roadmap_text
    assert "py -3 scripts/install_git_hooks.py --check" in roadmap_text
    assert "non-mutating `--check` mode" in roadmap_text
    assert "then `py -3`" in roadmap_text
    assert "scripts/render_secret_rotation_evidence.py" in roadmap_text
    assert "scripts/generate_secret_hygiene_evidence.py" in roadmap_text
    assert "py -3 scripts/check_secret_hygiene.py ..." in roadmap_text
    assert "py -3 scripts/render_secret_rotation_evidence.py ..." in roadmap_text
    assert "py -3 scripts/generate_secret_hygiene_evidence.py ..." in roadmap_text
    assert "can optionally include untracked temp/export artifact coverage in that primary artifact via `--include-untracked`" in roadmap_text
    assert "--recent-history <count>" in roadmap_text
    assert "--pending-push" in roadmap_text
    assert "when that ref is still resolvable" in roadmap_text
    assert ".githooks/pre-commit" in roadmap_text
    assert ".githooks/pre-push" in roadmap_text
    assert "tracked-but-currently-missing" in roadmap_text
    grep_fragment = "pk" + "_live_\\|wh" + "sec_\\|gh" + "p_\\|gh" + "s_\\|gh" + "o_\\|github" + "_pat_\\|gh" + "u_\\|gh" + "r_"
    assert grep_fragment in roadmap_text


def test_production_secret_baseline_doc_is_linked_and_tracks_verified_runtime_state():
    baseline_text = PRODUCTION_SECRET_BASELINE.read_text(encoding="utf-8")
    readme_text = README.read_text(encoding="utf-8")
    roadmap_text = MASTER_ROADMAP.read_text(encoding="utf-8")
    production_text = PRODUCTION_ROADMAP.read_text(encoding="utf-8")
    release_text = RELEASE_PROCESS.read_text(encoding="utf-8")
    status_text = STATUS_MATRIX.read_text(encoding="utf-8")

    assert "docker compose -f docker-compose.prod.yml config --quiet" in baseline_text
    assert "required production secrets are provisioned outside the repo" in baseline_text
    assert "Current verified note:" in baseline_text
    assert "http://127.0.0.1:8080/api/v1/system/health" in baseline_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in readme_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in roadmap_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in production_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in release_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in status_text
    assert "Status: [x] Done for the current host/runtime." in roadmap_text
    assert "production-secret baseline sub-slice is now closed on the current host/runtime" in status_text


def test_env_example_keeps_real_secret_values_blank():
    env_text = ENV_EXAMPLE.read_text(encoding="utf-8")

    for key in [
        "SECRET_KEY=",
        "CURSOR_SECRET=",
        "CRON_SECRET=",
        "ANTHROPIC_API_KEY=",
        "OPENAI_API_KEY=",
        "STRIPE_SECRET_KEY=",
        "STRIPE_WEBHOOK_SECRET=",
    ]:
        assert key in env_text


def test_secret_hygiene_scan_script_exists_and_passes_with_current_repo_truth():
    script_text = SECRET_HYGIENE_CHECK.read_text(encoding="utf-8")

    assert "git" in script_text
    assert "ls-files" in script_text
    assert "--include-untracked" in script_text
    assert "--format" in script_text
    assert "--output" in script_text
    assert "MASTER_ROADMAP.md" in script_text
    assert "provider API key pattern" in script_text
    assert "OpenAI project API key pattern" in script_text
    assert "OpenAI service account API key pattern" in script_text
    assert "Anthropic API key pattern" in script_text
    assert "GitHub personal access token pattern" in script_text
    assert "GitHub fine-grained personal access token pattern" in script_text
    assert "GitHub user-to-server token pattern" in script_text
    assert "GitHub refresh token pattern" in script_text
    assert "--staged" in script_text
    assert "--history-range" in script_text
    assert "--recent-history" in script_text
    assert "--pending-push" in script_text
    assert "tracked-but-currently-missing" in script_text
    assert "FileNotFoundError" in script_text
    assert '"git", "grep"' in script_text
    assert "full committed tree state" in script_text
    assert "staged files scanned" in script_text
    assert "commits scanned from" in script_text
    assert "history range" in script_text
    assert "recent history window" in script_text
    assert "Finding previews are redacted" in script_text

    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Secret hygiene scan passed" in result.stdout


def test_tracked_git_hook_bootstrap_exists_and_documents_staged_secret_scan():
    install_text = INSTALL_GIT_HOOKS.read_text(encoding="utf-8")
    hook_text = PRE_COMMIT_HOOK.read_text(encoding="utf-8")
    pre_push_text = (REPO_ROOT / ".githooks" / "pre-push").read_text(encoding="utf-8")
    hooks_readme = GIT_HOOKS_README.read_text(encoding="utf-8")

    assert "core.hooksPath" in install_text
    assert "--force" in install_text
    assert "--dry-run" in install_text
    assert "--check" in install_text
    assert ".githooks" in install_text
    assert "pre-push" in install_text
    assert "command -v python" in hook_text
    assert "command -v python3" in hook_text
    assert "command -v py" in hook_text
    assert 'py -3 "$@"' in hook_text
    assert "python_cmd scripts/check_secret_hygiene.py --staged" in hook_text
    assert "command -v python" in pre_push_text
    assert "command -v python3" in pre_push_text
    assert "command -v py" in pre_push_text
    assert 'py -3 "$@"' in pre_push_text
    assert "python_cmd scripts/check_secret_hygiene.py --pending-push" in pre_push_text
    assert "tracked branch upstream when that ref is still resolvable" in hooks_readme
    assert "then `py -3`" in hooks_readme
    assert "python scripts/install_git_hooks.py" in hooks_readme
    assert "py -3 scripts/install_git_hooks.py" in hooks_readme
    assert "python scripts/install_git_hooks.py --check" in hooks_readme
    assert "py -3 scripts/install_git_hooks.py --check" in hooks_readme
    assert "core.hooksPath" in hooks_readme
    assert ".githooks/pre-commit" in hooks_readme
    assert ".githooks/pre-push" in hooks_readme
    assert "scripts/generate_secret_hygiene_evidence.py" in README.read_text(encoding="utf-8")


def test_secret_rotation_evidence_renderer_is_linked_and_generates_markdown(tmp_path: Path):
    renderer_text = RENDER_SECRET_ROTATION_EVIDENCE.read_text(encoding="utf-8")
    token_prefix = "github" + "_pat_"

    assert "Secret Rotation Evidence" in renderer_text
    assert "--tracked-report" in renderer_text
    assert "--history-report" in renderer_text
    assert "--secondary-report" in renderer_text
    assert "history or pending-push scan report" in renderer_text
    assert "--output" in renderer_text
    assert "tmp/secret-rotation-evidence.md" in SECRET_ROTATION_RUNBOOK.read_text(encoding="utf-8")
    assert "scripts/render_secret_rotation_evidence.py" in README.read_text(encoding="utf-8")
    assert "scripts/render_secret_rotation_evidence.py" in RELEASE_PROCESS.read_text(encoding="utf-8")
    assert "scripts/render_secret_rotation_evidence.py" in STATUS_MATRIX.read_text(encoding="utf-8")
    assert "scripts/render_secret_rotation_evidence.py" in MASTER_ROADMAP.read_text(encoding="utf-8")

    tracked_report = tmp_path / "secret-hygiene-report.json"
    history_report = tmp_path / "secret-hygiene-history-report.json"
    output_path = tmp_path / "secret-rotation-evidence.md"

    tracked_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": null,
  \"recent_history_count\": null,
  \"history_scope\": null,
  \"tracked_files_scanned\": 12,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 0,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )
    history_report.write_text(
        """{
  \"ok\": false,
  \"repo_root\": \"C:/repo\",
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": \"HEAD~2..HEAD\",
  \"recent_history_count\": null,
  \"history_scope\": \"history range HEAD~2..HEAD\",
  \"tracked_files_scanned\": 0,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 2,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": [
    {
      \"path\": \"README.md\",
      \"line_number\": 4,
      \"label\": \"GitHub fine-grained personal access token pattern\",
      \"line\": \"token """ + token_prefix + """<redacted>\",
      \"source_ref\": \"abc123\"
    }
  ]
}
""",
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--history-report",
            str(history_report),
            "--output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    rendered = output_path.read_text(encoding="utf-8")
    assert rendered == result.stdout
    assert "# Secret Rotation Evidence" in rendered
    assert "Primary artifact" in rendered
    assert "Secondary history / pending-push artifact" in rendered
    assert "Scan mode: Tracked-files scan" in rendered
    assert "Scan mode: History scan" in rendered
    assert "**PASS**" in rendered
    assert "**FAIL**" in rendered
    assert "`abc123:README.md:4`" in rendered
    assert f"token {token_prefix}<redacted>" in rendered
    assert "Secret values remain intentionally redacted" in rendered
    assert "Upstream revoke/rotation completion time" in rendered


def test_secret_hygiene_evidence_generator_runs_tracked_and_recent_history_bundle(tmp_path: Path):
    generator_text = GENERATE_SECRET_HYGIENE_EVIDENCE.read_text(encoding="utf-8")
    assert "generate a primary secret-hygiene JSON artifact" in generator_text
    assert "--recent-history" in generator_text
    assert "--pending-push" in generator_text
    assert "--secondary-report" in generator_text
    assert "render the markdown incident worksheet" in generator_text
    assert "--include-untracked" in generator_text
    assert "--staged-primary" in generator_text

    tracked_report = tmp_path / "secret-hygiene-report.json"
    history_report = tmp_path / "secret-hygiene-history-report.json"
    output_path = tmp_path / "secret-rotation-evidence.md"

    result = subprocess.run(
        [
            sys.executable,
            str(GENERATE_SECRET_HYGIENE_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--secondary-report",
            str(history_report),
            "--markdown-output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert tracked_report.exists()
    assert history_report.exists()
    assert output_path.exists()
    tracked_payload = tracked_report.read_text(encoding="utf-8")
    history_payload = history_report.read_text(encoding="utf-8")
    rendered = output_path.read_text(encoding="utf-8")
    assert '"ok": true' in tracked_payload
    assert '"head_ref":' in tracked_payload
    assert '"head_commit":' in tracked_payload
    assert '"working_tree_dirty":' in tracked_payload
    assert '"history_scope": null' in tracked_payload
    assert '"recent_history_count": 20' in history_payload
    assert '"history_scope": "recent history window (up to 20 commits from HEAD)"' in history_payload
    assert "# Secret Rotation Evidence" in rendered
    assert "Repo HEAD context:" in rendered
    assert "Primary artifact" in rendered
    assert "Secondary history / pending-push artifact" in rendered
    assert "Recent history window" not in result.stderr


def test_secret_hygiene_evidence_generator_rejects_blank_history_range():
    result = subprocess.run(
        [sys.executable, str(GENERATE_SECRET_HYGIENE_EVIDENCE), "--history-range", "   "],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "--history-range requires a non-empty git rev-range" in result.stderr



def test_secret_hygiene_evidence_generator_rejects_non_positive_recent_history():
    result = subprocess.run(
        [sys.executable, str(GENERATE_SECRET_HYGIENE_EVIDENCE), "--recent-history", "0"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "--recent-history requires a positive commit count" in result.stderr



def test_secret_hygiene_evidence_generator_rejects_reused_secondary_path(tmp_path: Path):
    tracked_report = tmp_path / "secret-hygiene-report.json"
    output_path = tmp_path / "secret-rotation-evidence.md"

    result = subprocess.run(
        [
            sys.executable,
            str(GENERATE_SECRET_HYGIENE_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--secondary-report",
            str(tracked_report),
            "--markdown-output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "Primary tracked-report and secondary-report paths must be different files" in result.stderr



def test_secret_hygiene_evidence_generator_rejects_reused_output_path(tmp_path: Path):
    tracked_report = tmp_path / "secret-hygiene-report.json"
    secondary_report = tmp_path / "secret-hygiene-history-report.json"

    result = subprocess.run(
        [
            sys.executable,
            str(GENERATE_SECRET_HYGIENE_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--secondary-report",
            str(secondary_report),
            "--markdown-output",
            str(secondary_report),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "Markdown output path must be different from the input JSON artifact paths" in result.stderr



def test_secret_hygiene_evidence_generator_can_include_untracked_primary_artifact(tmp_path: Path):
    generator_copy = tmp_path / "scripts" / "generate_secret_hygiene_evidence.py"
    check_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    render_copy = tmp_path / "scripts" / "render_secret_rotation_evidence.py"
    generator_copy.parent.mkdir(parents=True)
    generator_copy.write_text(GENERATE_SECRET_HYGIENE_EVIDENCE.read_text(encoding="utf-8"), encoding="utf-8")
    check_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")
    render_copy.write_text(RENDER_SECRET_ROTATION_EVIDENCE.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")
    untracked_file = tmp_path / "leak.txt"
    token_prefix = "github" + "_pat_"
    untracked_file.write_text(f"token {token_prefix}bundle123\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py", "scripts/render_secret_rotation_evidence.py", "scripts/generate_secret_hygiene_evidence.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_report = tmp_path / "tmp" / "secret-hygiene-report.json"
    history_report = tmp_path / "tmp" / "secret-hygiene-history-report.json"
    output_path = tmp_path / "tmp" / "secret-rotation-evidence.md"

    result = subprocess.run(
        [
            sys.executable,
            str(generator_copy),
            "--include-untracked",
            "--tracked-report",
            str(tracked_report),
            "--secondary-report",
            str(history_report),
            "--markdown-output",
            str(output_path),
        ],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 1
    assert tracked_report.exists()
    assert history_report.exists()
    assert output_path.exists()
    tracked_payload = tracked_report.read_text(encoding="utf-8")
    rendered = output_path.read_text(encoding="utf-8")
    assert '"ok": false' in tracked_payload
    assert '"include_untracked": true' in tracked_payload
    assert '"untracked_files_scanned": 1' in tracked_payload
    assert f'{token_prefix}<redacted>' in tracked_payload
    assert "Tracked + untracked scan" in rendered
    assert f'{token_prefix}<redacted>' in rendered
    assert f'{token_prefix}bundle123' not in result.stdout
    assert f'{token_prefix}bundle123' not in result.stderr


def test_secret_hygiene_evidence_generator_can_use_staged_primary_artifact(tmp_path: Path):
    generator_copy = tmp_path / "scripts" / "generate_secret_hygiene_evidence.py"
    check_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    render_copy = tmp_path / "scripts" / "render_secret_rotation_evidence.py"
    generator_copy.parent.mkdir(parents=True)
    generator_copy.write_text(GENERATE_SECRET_HYGIENE_EVIDENCE.read_text(encoding="utf-8"), encoding="utf-8")
    check_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")
    render_copy.write_text(RENDER_SECRET_ROTATION_EVIDENCE.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    token_prefix = "github" + "_pat_"
    tracked_file.write_text("clean tracked file before staged leak\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py", "scripts/render_secret_rotation_evidence.py", "scripts/generate_secret_hygiene_evidence.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_file.write_text(f"token {token_prefix}stagedprimary123\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md"], cwd=tmp_path, check=True, capture_output=True, text=True)
    tracked_file.write_text("clean tracked file after staged leak\n", encoding="utf-8")

    tracked_report = tmp_path / "tmp" / "secret-hygiene-report.json"
    history_report = tmp_path / "tmp" / "secret-hygiene-history-report.json"
    output_path = tmp_path / "tmp" / "secret-rotation-evidence.md"

    result = subprocess.run(
        [
            sys.executable,
            str(generator_copy),
            "--staged-primary",
            "--tracked-report",
            str(tracked_report),
            "--secondary-report",
            str(history_report),
            "--markdown-output",
            str(output_path),
        ],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 1
    assert tracked_report.exists()
    assert history_report.exists()
    assert output_path.exists()
    tracked_payload = tracked_report.read_text(encoding="utf-8")
    history_payload = history_report.read_text(encoding="utf-8")
    rendered = output_path.read_text(encoding="utf-8")
    assert '"ok": false' in tracked_payload
    assert '"staged_only": true' in tracked_payload
    assert '"staged_files_scanned": 1' in tracked_payload
    assert f'{token_prefix}<redacted>' in tracked_payload
    assert '"ok": true' in history_payload
    assert f'{token_prefix}<redacted>' not in history_payload
    assert "Primary artifact" in rendered
    assert "Secondary history / pending-push artifact" in rendered
    assert "Scan mode: Staged scan" in rendered
    assert f'{token_prefix}<redacted>' in rendered
    assert f'{token_prefix}stagedprimary123' not in result.stdout
    assert f'{token_prefix}stagedprimary123' not in result.stderr



def test_secret_hygiene_evidence_generator_can_use_default_pending_push_secondary_artifact(tmp_path: Path):
    generator_copy = tmp_path / "scripts" / "generate_secret_hygiene_evidence.py"
    check_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    render_copy = tmp_path / "scripts" / "render_secret_rotation_evidence.py"
    generator_copy.parent.mkdir(parents=True)
    generator_copy.write_text(GENERATE_SECRET_HYGIENE_EVIDENCE.read_text(encoding="utf-8"), encoding="utf-8")
    check_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")
    render_copy.write_text(RENDER_SECRET_ROTATION_EVIDENCE.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py", "scripts/render_secret_rotation_evidence.py", "scripts/generate_secret_hygiene_evidence.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_report = tmp_path / "tmp" / "custom-tracked-report.json"
    pending_push_report = tmp_path / "tmp" / "secret-hygiene-pending-push-report.json"
    output_path = tmp_path / "tmp" / "custom-secret-rotation-evidence.md"

    result = subprocess.run(
        [
            sys.executable,
            str(generator_copy),
            "--pending-push",
            "--tracked-report",
            str(tracked_report),
            "--markdown-output",
            str(output_path),
        ],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert tracked_report.exists()
    assert pending_push_report.exists()
    assert output_path.exists()
    tracked_payload = tracked_report.read_text(encoding="utf-8")
    pending_push_payload = pending_push_report.read_text(encoding="utf-8")
    rendered = output_path.read_text(encoding="utf-8")
    assert '"ok": true' in tracked_payload
    assert '"pending_push": false' in tracked_payload
    assert '"ok": true' in pending_push_payload
    assert '"pending_push": true' in pending_push_payload
    assert '"recent_history_count": 20' in pending_push_payload
    assert '"history_scope": "pending-push fallback recent history window (up to 20 commits from HEAD; no upstream/default-remote base found)"' in pending_push_payload
    assert "Primary artifact" in rendered
    assert "Secondary history / pending-push artifact" in rendered
    assert "Scan mode: Pending-push scan" in rendered
    assert "1 commits scanned from pending-push fallback recent history window (up to 20 commits from HEAD; no upstream/default-remote base found)" in rendered


def test_secret_hygiene_scan_can_optionally_flag_untracked_files(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    untracked_file = tmp_path / "leak.txt"
    token_prefix = "github" + "_pat_"
    untracked_file.write_text(f"token {token_prefix}example123\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_only = subprocess.run(
        [sys.executable, str(script_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert tracked_only.returncode == 0, tracked_only.stderr or tracked_only.stdout
    assert "tracked files scanned" in tracked_only.stdout
    assert "untracked files scanned" not in tracked_only.stdout

    with_untracked = subprocess.run(
        [sys.executable, str(script_copy), "--include-untracked"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert with_untracked.returncode == 1
    assert "leak.txt:1" in with_untracked.stderr
    assert "GitHub fine-grained personal access token pattern" in with_untracked.stderr
    assert f"{token_prefix}<redacted>" in with_untracked.stderr
    assert f"{token_prefix}example123" not in with_untracked.stderr


def test_secret_hygiene_scan_can_flag_staged_index_content_even_if_working_tree_is_clean(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    token_prefix = "github" + "_pat_"
    tracked_file.write_text(f"token {token_prefix}stagedonly123\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    tracked_only = subprocess.run(
        [sys.executable, str(script_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert tracked_only.returncode == 0, tracked_only.stderr or tracked_only.stdout
    assert "tracked files scanned" in tracked_only.stdout
    assert f"{token_prefix}stagedonly123" not in tracked_only.stdout

    staged_scan = subprocess.run(
        [sys.executable, str(script_copy), "--staged"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert staged_scan.returncode == 1
    assert "staged files" in staged_scan.stderr
    assert "README.md:1" in staged_scan.stderr
    assert "GitHub fine-grained personal access token pattern" in staged_scan.stderr
    assert f"{token_prefix}<redacted>" in staged_scan.stderr
    assert f"{token_prefix}stagedonly123" not in staged_scan.stderr


def test_secret_hygiene_scan_tracked_mode_falls_back_to_index_for_tracked_deletions(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    token_prefix = "github" + "_pat_"
    tracked_file.write_text(f"token {token_prefix}deletedstilltracked123\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_file.unlink()

    tracked_only = subprocess.run(
        [sys.executable, str(script_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert tracked_only.returncode == 1
    assert "repo files" in tracked_only.stderr
    assert "README.md:1" in tracked_only.stderr
    assert "GitHub fine-grained personal access token pattern" in tracked_only.stderr
    assert f"{token_prefix}<redacted>" in tracked_only.stderr
    assert f"{token_prefix}deletedstilltracked123" not in tracked_only.stderr


def test_secret_hygiene_scan_current_repo_tracked_mode_passes():
    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Secret hygiene scan passed" in result.stdout
    assert "tracked files scanned" in result.stdout
    assert "untracked files scanned" not in result.stdout


def test_secret_hygiene_scan_current_repo_staged_mode_passes():
    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK), "--staged"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Secret hygiene scan passed" in result.stdout
    assert "staged files scanned" in result.stdout
    assert "tracked files scanned" not in result.stdout


def test_secret_hygiene_scan_detects_openai_and_anthropic_key_prefixes(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    project_prefix = "sk-" + "proj-"
    service_prefix = "sk-" + "svcacct-"
    anthropic_prefix = "sk-" + "ant-"

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text(
        "\n".join(
            [
                f"token {project_prefix}example123",
                f"token {service_prefix}example456",
                f"token {anthropic_prefix}example789",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    project_redacted = project_prefix + "<redacted>"
    service_redacted = service_prefix + "<redacted>"
    anthropic_redacted = anthropic_prefix + "<redacted>"

    assert result.returncode == 1
    assert "OpenAI project API key pattern" in result.stderr
    assert "OpenAI service account API key pattern" in result.stderr
    assert "Anthropic API key pattern" in result.stderr
    assert project_redacted in result.stderr
    assert service_redacted in result.stderr
    assert anthropic_redacted in result.stderr
    assert f"{project_prefix}example123" not in result.stderr
    assert f"{service_prefix}example456" not in result.stderr
    assert f"{anthropic_prefix}example789" not in result.stderr


def test_secret_hygiene_scan_can_flag_recent_commit_history_even_after_cleanup(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    unchanged_secret_file = tmp_path / "notes.txt"
    tracked_file.write_text("initial clean file\n", encoding="utf-8")
    unchanged_secret_file.write_text("clean notes\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "notes.txt", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    token_prefix = "github" + "_pat_"
    tracked_file.write_text(f"token {token_prefix}history123\n", encoding="utf-8")
    unchanged_secret_file.write_text(f"token {token_prefix}unchanged456\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md", "notes.txt"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "introduce leak"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_file.write_text("clean after remediation\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "clean one leak only"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_only = subprocess.run(
        [sys.executable, str(script_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert tracked_only.returncode == 1
    assert "notes.txt:1" in tracked_only.stderr
    assert f"{token_prefix}<redacted>" in tracked_only.stderr
    assert f"{token_prefix}unchanged456" not in tracked_only.stderr

    tracked_file.write_text("clean after full remediation\n", encoding="utf-8")
    unchanged_secret_file.write_text("clean notes after remediation\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md", "notes.txt"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "clean remaining leak"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_only_after_cleanup = subprocess.run(
        [sys.executable, str(script_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert tracked_only_after_cleanup.returncode == 0, tracked_only_after_cleanup.stderr or tracked_only_after_cleanup.stdout
    assert "tracked files scanned" in tracked_only_after_cleanup.stdout
    assert f"{token_prefix}history123" not in tracked_only_after_cleanup.stdout
    assert f"{token_prefix}unchanged456" not in tracked_only_after_cleanup.stdout

    history_scan = subprocess.run(
        [sys.executable, str(script_copy), "--history-range", "HEAD~3..HEAD"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert history_scan.returncode == 1
    assert "history range HEAD~3..HEAD" in history_scan.stderr
    assert "README.md:1" in history_scan.stderr
    assert "notes.txt:1" in history_scan.stderr
    assert "GitHub fine-grained personal access token pattern" in history_scan.stderr
    assert f"{token_prefix}<redacted>" in history_scan.stderr
    assert f"{token_prefix}history123" not in history_scan.stderr
    assert f"{token_prefix}unchanged456" not in history_scan.stderr

    history_scan_json = subprocess.run(
        [sys.executable, str(script_copy), "--history-range", "HEAD~3..HEAD", "--format", "json"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert history_scan_json.returncode == 1
    assert '"history_range": "HEAD~3..HEAD"' in history_scan_json.stdout
    assert '"history_commits_scanned": 3' in history_scan_json.stdout
    assert '"source_ref":' in history_scan_json.stdout
    assert '"path": "README.md"' in history_scan_json.stdout
    assert '"path": "notes.txt"' in history_scan_json.stdout
    assert f"{token_prefix}history123" not in history_scan_json.stdout
    assert f"{token_prefix}unchanged456" not in history_scan_json.stdout


def test_secret_hygiene_scan_rejects_empty_history_range_argument():
    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK), "--history-range", ""],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "--history-range requires a non-empty git rev-range" in result.stderr



def test_secret_hygiene_scan_rejects_unresolvable_history_range_argument():
    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK), "--history-range", "DOESNOTEXIST..HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "--history-range could not be resolved in this repo: DOESNOTEXIST..HEAD" in result.stderr


def test_secret_hygiene_scan_rejects_non_positive_recent_history_argument():
    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK), "--recent-history", "0"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 2
    assert "--recent-history requires a positive commit count" in result.stderr


def test_secret_hygiene_scan_recent_history_mode_handles_small_repo_without_head_tilde_range(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy), "--recent-history", "20"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Secret hygiene scan passed" in result.stdout
    assert "1 commits scanned from recent history window (up to 20 commits from HEAD)" in result.stdout



def test_secret_hygiene_scan_pending_push_mode_uses_upstream_delta_when_available(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    remote_path = tmp_path.parent / "remote.git"
    subprocess.run(["git", "init", "--bare", str(remote_path)], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "remote", "add", "origin", str(remote_path)], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "push", "-u", "origin", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)

    tracked_file.write_text("clean tracked file after local change\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "local clean delta"], cwd=tmp_path, check=True, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy), "--pending-push"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "pending-push history range origin/master..HEAD" in result.stdout
    assert "1 commits scanned from pending-push history range origin/master..HEAD" in result.stdout


def test_secret_hygiene_scan_pending_push_mode_falls_back_to_recent_history_without_push_base(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy), "--pending-push"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "pending-push fallback recent history window" in result.stdout
    assert "1 commits scanned from pending-push fallback recent history window" in result.stdout



def test_secret_hygiene_scan_pending_push_mode_falls_back_when_upstream_ref_is_stale(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    tracked_file = tmp_path / "README.md"
    tracked_file.write_text("clean tracked file\n", encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.name", "Test User"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "add", "README.md", "scripts/check_secret_hygiene.py"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)

    remote_path = tmp_path.parent / "remote-stale-upstream.git"
    subprocess.run(["git", "init", "--bare", str(remote_path)], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "remote", "add", "origin", str(remote_path)], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "push", "-u", "origin", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "remote", "set-head", "origin", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "update-ref", "-d", "refs/remotes/origin/master"], cwd=tmp_path, check=True, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy), "--pending-push"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "pending-push fallback recent history window" in result.stdout
    assert "tracked upstream origin/master unavailable locally; default-remote base unavailable locally" in result.stdout
    assert "1 commits scanned from pending-push fallback recent history window" in result.stdout



def test_secret_hygiene_scan_recent_history_mode_handles_repo_without_commits(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=False, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy), "--recent-history", "20"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Secret hygiene scan passed" in result.stdout
    assert "0 commits scanned from recent history window (up to 20 commits from HEAD)" in result.stdout



def test_secret_hygiene_scan_pending_push_mode_handles_repo_without_commits(tmp_path: Path):
    script_copy = tmp_path / "scripts" / "check_secret_hygiene.py"
    script_copy.parent.mkdir(parents=True)
    script_copy.write_text(SECRET_HYGIENE_CHECK.read_text(encoding="utf-8"), encoding="utf-8")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=False, capture_output=True, text=True)

    result = subprocess.run(
        [sys.executable, str(script_copy), "--pending-push"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Secret hygiene scan passed" in result.stdout
    assert "0 commits scanned from pending-push fallback recent history window" in result.stdout
    assert "no upstream/default-remote base found" in result.stdout


def test_secret_rotation_evidence_renderer_accepts_pending_push_alias_and_generates_markdown(tmp_path: Path):
    tracked_report = tmp_path / "secret-hygiene-report.json"
    pending_push_report = tmp_path / "secret-hygiene-pending-push-report.json"
    output_path = tmp_path / "secret-rotation-evidence.md"

    tracked_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": false,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": null,
  \"recent_history_count\": null,
  \"history_scope\": null,
  \"tracked_files_scanned\": 12,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 0,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )
    pending_push_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": true,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": true,
  \"history_range\": \"origin/master..HEAD\",
  \"recent_history_count\": null,
  \"history_scope\": \"pending-push history range origin/master..HEAD\",
  \"tracked_files_scanned\": 0,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 1,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--secondary-report",
            str(pending_push_report),
            "--output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    rendered = output_path.read_text(encoding="utf-8")
    assert rendered == result.stdout
    assert "Secondary history / pending-push artifact" in rendered
    assert "Scan mode: Pending-push scan" in rendered
    assert "1 commits scanned from pending-push history range origin/master..HEAD" in rendered
    assert "Repo HEAD context:" in rendered



def test_secret_rotation_evidence_renderer_rejects_mismatched_report_scopes(tmp_path: Path):
    tracked_report = tmp_path / "tracked.json"
    history_report = tmp_path / "history.json"
    output_path = tmp_path / "secret-rotation-evidence.md"

    tracked_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": true,
  \"history_range\": \"origin/master..HEAD\",
  \"recent_history_count\": null,
  \"history_scope\": \"pending-push history range origin/master..HEAD\",
  \"tracked_files_scanned\": 0,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 1,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )
    history_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": null,
  \"recent_history_count\": null,
  \"history_scope\": null,
  \"tracked_files_scanned\": 12,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 0,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--history-report",
            str(history_report),
            "--output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 1
    assert "primary tracked/working-tree/staged scan artifact" in result.stderr
    assert not output_path.exists()



def test_secret_rotation_evidence_renderer_rejects_reused_input_and_output_paths(tmp_path: Path):
    tracked_report = tmp_path / "tracked.json"
    history_report = tmp_path / "history.json"

    tracked_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": false,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": null,
  \"recent_history_count\": null,
  \"history_scope\": null,
  \"tracked_files_scanned\": 12,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 0,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )
    history_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": true,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": true,
  \"history_range\": \"origin/master..HEAD\",
  \"recent_history_count\": null,
  \"history_scope\": \"pending-push history range origin/master..HEAD\",
  \"tracked_files_scanned\": 0,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 1,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )

    reused_secondary = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--history-report",
            str(tracked_report),
            "--output",
            str(tmp_path / "out.md"),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert reused_secondary.returncode == 1
    assert "Tracked and secondary secret-hygiene artifact paths must be different files" in reused_secondary.stderr

    reused_output = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--history-report",
            str(history_report),
            "--output",
            str(tracked_report),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert reused_output.returncode == 1
    assert "Output markdown path must be different from the input JSON artifact paths" in reused_output.stderr



def test_secret_rotation_evidence_renderer_accepts_repo_root_path_style_variants(tmp_path: Path):
    tracked_report = tmp_path / "tracked.json"
    history_report = tmp_path / "history.json"
    output_path = tmp_path / "secret-rotation-evidence.md"

    tracked_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": "C:/repo",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": false,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": null,
  \"recent_history_count\": null,
  \"history_scope\": null,
  \"tracked_files_scanned\": 12,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 0,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )
    history_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": "c:\\\\repo",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": false,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": true,
  \"history_range\": \"origin/master..HEAD\",
  \"recent_history_count\": null,
  \"history_scope\": \"pending-push history range origin/master..HEAD\",
  \"tracked_files_scanned\": 0,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 1,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--history-report",
            str(history_report),
            "--output",
            str(output_path),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert output_path.exists()



def test_secret_rotation_evidence_renderer_rejects_mismatched_head_commit_checkout_provenance(tmp_path: Path):
    tracked_report = tmp_path / "tracked.json"
    history_report = tmp_path / "history.json"

    tracked_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"head_ref\": \"master\",
  \"head_commit\": \"0123456789abcdef0123456789abcdef01234567\",
  \"working_tree_dirty\": false,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": false,
  \"history_range\": null,
  \"recent_history_count\": null,
  \"history_scope\": null,
  \"tracked_files_scanned\": 12,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 0,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )
    history_report.write_text(
        """{
  \"ok\": true,
  \"repo_root\": \"C:/repo\",
  \"head_ref\": \"master\",
  \"head_commit\": \"89abcdef0123456789abcdef0123456789abcdef\",
  \"working_tree_dirty\": false,
  \"include_untracked\": false,
  \"staged_only\": false,
  \"pending_push\": true,
  \"history_range\": \"origin/master..HEAD\",
  \"recent_history_count\": null,
  \"history_scope\": \"pending-push history range origin/master..HEAD\",
  \"tracked_files_scanned\": 0,
  \"untracked_files_scanned\": 0,
  \"staged_files_scanned\": 0,
  \"history_commits_scanned\": 1,
  \"allowed_paths\": [\"MASTER_ROADMAP.md\"],
  \"findings\": []
}
""",
        encoding="utf-8",
    )

    result = subprocess.run(
        [
            sys.executable,
            str(RENDER_SECRET_ROTATION_EVIDENCE),
            "--tracked-report",
            str(tracked_report),
            "--history-report",
            str(history_report),
            "--output",
            str(tmp_path / "out.md"),
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 1
    assert "head_commit does not match" in result.stderr
    assert "same exact scanned checkout" in result.stderr



def test_secret_hygiene_scan_can_emit_json_report_and_write_output(tmp_path: Path):
    output_path = tmp_path / "secret-hygiene-report.json"

    result = subprocess.run(
        [sys.executable, str(SECRET_HYGIENE_CHECK), "--format", "json", "--output", str(output_path)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert output_path.exists()
    payload = output_path.read_text(encoding="utf-8")
    assert '"ok": true' in payload
    assert '"head_ref":' in payload
    assert '"head_commit":' in payload
    assert '"working_tree_dirty":' in payload
    assert '"include_untracked": false' in payload
    assert '"pending_push": false' in payload
    assert '"history_range": null' in payload
    assert '"history_commits_scanned": 0' in payload
    assert '"tracked_files_scanned"' in payload
    assert '"allowed_paths": [' in payload
    assert payload == result.stdout


def test_install_git_hooks_script_can_set_local_hook_path_for_temp_repo(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    pre_commit = githooks_dir / "pre-commit"
    pre_commit.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    pre_push = githooks_dir / "pre-push"
    pre_push.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)

    dry_run = subprocess.run(
        [sys.executable, str(install_copy), "--dry-run"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert dry_run.returncode == 0, dry_run.stderr or dry_run.stdout
    assert "would set core.hooksPath to .githooks" in dry_run.stdout

    pre_check = subprocess.run(
        [sys.executable, str(install_copy), "--check"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert pre_check.returncode == 1
    assert "core.hooksPath=<unset>, expected=.githooks" in pre_check.stderr

    installed = subprocess.run(
        [sys.executable, str(install_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert installed.returncode == 0, installed.stderr or installed.stdout
    assert "core.hooksPath to .githooks" in installed.stdout
    assert "Enabled hook: .githooks/pre-commit" in installed.stdout
    assert "Enabled hook: .githooks/pre-push" in installed.stdout

    hooks_path = subprocess.run(
        ["git", "config", "--get", "core.hooksPath"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert hooks_path.returncode == 0, hooks_path.stderr or hooks_path.stdout
    assert hooks_path.stdout.strip() == ".githooks"

    checked = subprocess.run(
        [sys.executable, str(install_copy), "--check"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert checked.returncode == 0, checked.stderr or checked.stdout
    assert "Git hooks are correctly configured at .githooks." in checked.stdout



def test_install_git_hooks_script_refuses_to_overwrite_existing_custom_path_without_force(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    (githooks_dir / "pre-commit").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    (githooks_dir / "pre-push").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "core.hooksPath", "custom-hooks"], cwd=tmp_path, check=True, capture_output=True, text=True)

    refused = subprocess.run(
        [sys.executable, str(install_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert refused.returncode == 1
    assert "Refusing to overwrite existing git hooksPath without --force" in refused.stderr

    hooks_path = subprocess.run(
        ["git", "config", "--get", "core.hooksPath"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert hooks_path.returncode == 0, hooks_path.stderr or hooks_path.stdout
    assert hooks_path.stdout.strip() == "custom-hooks"



def test_install_git_hooks_script_can_force_overwrite_existing_custom_path(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    (githooks_dir / "pre-commit").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    (githooks_dir / "pre-push").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "core.hooksPath", "custom-hooks"], cwd=tmp_path, check=True, capture_output=True, text=True)

    forced = subprocess.run(
        [sys.executable, str(install_copy), "--force"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert forced.returncode == 0, forced.stderr or forced.stdout
    assert "Updated core.hooksPath to .githooks" in forced.stdout
    assert "Enabled hook: .githooks/pre-commit" in forced.stdout
    assert "Enabled hook: .githooks/pre-push" in forced.stdout

    hooks_path = subprocess.run(
        ["git", "config", "--get", "core.hooksPath"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert hooks_path.returncode == 0, hooks_path.stderr or hooks_path.stdout
    assert hooks_path.stdout.strip() == ".githooks"



def test_install_git_hooks_script_refuses_when_expected_hook_files_are_missing(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    (githooks_dir / "pre-commit").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)

    refused = subprocess.run(
        [sys.executable, str(install_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert refused.returncode == 1
    assert "expected tracked hook file(s) are missing" in refused.stderr
    assert "pre-push" in refused.stderr

    hooks_path = subprocess.run(
        ["git", "config", "--get", "core.hooksPath"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert hooks_path.returncode != 0



def test_install_git_hooks_script_check_detects_existing_custom_path(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    (githooks_dir / "pre-commit").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    (githooks_dir / "pre-push").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "core.hooksPath", "custom-hooks"], cwd=tmp_path, check=True, capture_output=True, text=True)

    checked = subprocess.run(
        [sys.executable, str(install_copy), "--check"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert checked.returncode == 1
    assert "core.hooksPath=custom-hooks, expected=.githooks" in checked.stderr



def test_install_git_hooks_script_rejects_check_with_mutating_flags(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    for extra_flag in ("--force", "--dry-run"):
        result = subprocess.run(
            [sys.executable, str(install_copy), "--check", extra_flag],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            check=False,
        )

        assert result.returncode == 2
        assert "--check cannot be combined with --force or --dry-run" in result.stderr



def test_install_git_hooks_script_treats_equivalent_relative_hooks_path_as_already_configured(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    (githooks_dir / "pre-commit").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    (githooks_dir / "pre-push").write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "core.hooksPath", "hooks/../.githooks/"], cwd=tmp_path, check=True, capture_output=True, text=True)

    checked = subprocess.run(
        [sys.executable, str(install_copy), "--check"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert checked.returncode == 0, checked.stderr or checked.stdout
    assert "Git hooks are correctly configured at .githooks." in checked.stdout

    reused = subprocess.run(
        [sys.executable, str(install_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert reused.returncode == 0, reused.stderr or reused.stdout
    assert "Git hooks already point at .githooks." in reused.stdout

    hooks_path = subprocess.run(
        ["git", "config", "--get", "core.hooksPath"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert hooks_path.returncode == 0, hooks_path.stderr or hooks_path.stdout
    assert hooks_path.stdout.strip() == "hooks/../.githooks/"



def test_install_git_hooks_script_reuses_existing_path_and_makes_hooks_executable(tmp_path: Path):
    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    pre_commit = githooks_dir / "pre-commit"
    pre_commit.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    pre_push = githooks_dir / "pre-push"
    pre_push.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    pre_commit.chmod(stat.S_IRUSR | stat.S_IWUSR)
    pre_push.chmod(stat.S_IRUSR | stat.S_IWUSR)

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "core.hooksPath", ".githooks"], cwd=tmp_path, check=True, capture_output=True, text=True)

    reused = subprocess.run(
        [sys.executable, str(install_copy)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert reused.returncode == 0, reused.stderr or reused.stdout
    assert "Git hooks already point at .githooks." in reused.stdout

    checked = subprocess.run(
        [sys.executable, str(install_copy), "--check"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert checked.returncode == 0, checked.stderr or checked.stdout
    assert "Git hooks are correctly configured at .githooks." in checked.stdout

    if sys.platform != "win32":
        assert pre_commit.stat().st_mode & stat.S_IXUSR
        assert pre_push.stat().st_mode & stat.S_IXUSR



def test_install_git_hooks_script_check_rejects_non_executable_hooks_on_non_windows(tmp_path: Path):
    if sys.platform == "win32":
        return

    scripts_dir = tmp_path / "scripts"
    scripts_dir.mkdir(parents=True)
    install_copy = scripts_dir / "install_git_hooks.py"
    install_copy.write_text(INSTALL_GIT_HOOKS.read_text(encoding="utf-8"), encoding="utf-8")

    githooks_dir = tmp_path / ".githooks"
    githooks_dir.mkdir()
    pre_commit = githooks_dir / "pre-commit"
    pre_push = githooks_dir / "pre-push"
    pre_commit.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    pre_push.write_text("#!/usr/bin/env bash\nexit 0\n", encoding="utf-8", newline="\n")
    pre_commit.chmod(stat.S_IRUSR | stat.S_IWUSR)
    pre_push.chmod(stat.S_IRUSR | stat.S_IWUSR)

    subprocess.run(["git", "init"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "branch", "-m", "master"], cwd=tmp_path, check=True, capture_output=True, text=True)
    subprocess.run(["git", "config", "core.hooksPath", ".githooks"], cwd=tmp_path, check=True, capture_output=True, text=True)

    checked = subprocess.run(
        [sys.executable, str(install_copy), "--check"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )

    assert checked.returncode == 1
    assert "Git hooks are configured but not executable" in checked.stderr
    assert ".githooks/pre-commit" in checked.stderr
    assert ".githooks/pre-push" in checked.stderr
