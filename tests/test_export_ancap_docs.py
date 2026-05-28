from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = REPO_ROOT / "scripts" / "export_ancap_docs.py"
EXPECTED_EXPORTS = {
    Path("README.md"),
    Path("LICENSE"),
    Path("CONTRIBUTING.md"),
    Path("SECURITY.md"),
    Path("CODE_OF_CONDUCT.md"),
    Path(".github/pull_request_template.md"),
    Path(".github/ISSUE_TEMPLATE/bug_report.md"),
    Path(".github/ISSUE_TEMPLATE/feature_request.md"),
    Path(".github/ISSUE_TEMPLATE/config.yml"),
    Path("MASTER_ROADMAP.md"),
    Path("docs/STATUS_MATRIX.md"),
    Path("docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md"),
    Path("docs/ANCAP_DOCS_SPLIT.md"),
    Path("docs/ANCAP_DOCS_REPO_BOOTSTRAP.md"),
    Path("docs/ANCAP_DOCS_LABEL_SEED.md"),
    Path("docs/VISION.md"),
    Path("docs/ARCHITECTURE_LAYERS.md"),
    Path("docs/PLAN_L0_TO_L3.md"),
    Path("docs/REPUTATION_2.md"),
    Path("docs/STAKING.md"),
    Path("docs/WHITEPAPER_PROJECT.md"),
    Path("docs/WHITEPAPER_ACP.md"),
    Path("docs/LEGAL_TERMS_TEMPLATE.md"),
    Path("docs/BRIDGE_RISK_DOCUMENTATION.md"),
    Path("docs/CONTRACT_VERIFICATION_GUIDE.md"),
    Path("docs/TESTNET_DEPLOYMENT_GUIDE.md"),
    Path("docs/AUDIT_CHECKLIST.md"),
    Path("docs/CHANGELOG_PUBLIC.md"),
}

DOCS_REPO_README_SOURCE = Path("docs/ANCAP_DOCS_REPO_README.md")


def test_export_script_contains_split_plan_and_manifest_guardrails():
    script_text = SCRIPT_PATH.read_text(encoding="utf-8")

    assert 'Path("docs/ANCAP_DOCS_SPLIT.md")' in script_text
    assert 'Path("docs/ANCAP_DOCS_REPO_BOOTSTRAP.md")' in script_text
    assert 'Path("docs/ANCAP_DOCS_LABEL_SEED.md")' in script_text
    assert 'Path("docs/ANCAP_DOCS_REPO_README.md")' in script_text
    assert 'Path(".github/pull_request_template.md")' in script_text
    assert 'Path(".github/ISSUE_TEMPLATE/bug_report.md")' in script_text
    assert 'Path(".github/ISSUE_TEMPLATE/feature_request.md")' in script_text
    assert 'Path(".github/ISSUE_TEMPLATE/config.yml")' in script_text
    assert 'EXPORT_MANIFEST.md' in script_text
    assert 'issue/PR templates' in script_text
    assert 'labels / Discussions' in script_text
    assert 'label seed for the future docs repo' in script_text
    assert 'hot-wallet / bridge-signer internals' in script_text
    assert 'rewrite_markdown_links' in script_text
    assert 'find_unresolved_bundle_links' in script_text
    assert 'https://github.com/dragoncattrx-hub/ancap' in script_text
    assert 'EXPORT_SOURCE_TO_OUTPUT' in script_text


def test_export_script_creates_expected_public_docs_bundle(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout
    assert "Exported" in result.stdout

    for rel_path in EXPECTED_EXPORTS:
        exported_path = target_dir / rel_path
        assert exported_path.exists(), f"missing export: {rel_path}"

    manifest_path = target_dir / "EXPORT_MANIFEST.md"
    assert manifest_path.exists()
    manifest_text = manifest_path.read_text(encoding="utf-8")
    assert "future public `ancap-docs` repository" in manifest_text
    assert "issue/PR templates" in manifest_text
    assert "labels / Discussions" in manifest_text
    assert "label seed for the future docs repo" in manifest_text
    assert "runtime secrets" in manifest_text
    assert "infra/" in manifest_text
    assert "rewritten to the source monorepo on GitHub" in manifest_text
    assert "blob/master" in manifest_text
    for rel_path in EXPECTED_EXPORTS:
        assert rel_path.as_posix() in manifest_text


def test_export_bundle_rewrites_out_of_bundle_links_to_source_monorepo(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout

    readme_text = (target_dir / "README.md").read_text(encoding="utf-8")
    assert "future `ancap-docs` repository" in readme_text
    assert "https://github.com/dragoncattrx-hub/ancap/blob/master/examples/README.md" in readme_text
    assert "https://github.com/dragoncattrx-hub/ancap/blob/master/examples/payment-integration/python_credit_topup.py" in readme_text
    assert "https://github.com/dragoncattrx-hub/ancap/blob/master/contracts/bridge-bsc/README.md" in readme_text
    assert "[Status matrix](docs/STATUS_MATRIX.md)" in readme_text

    architecture_text = (target_dir / "docs" / "ARCHITECTURE_LAYERS.md").read_text(encoding="utf-8")
    assert "https://github.com/dragoncattrx-hub/ancap/blob/master/ROADMAP.md" in architecture_text
    assert "https://github.com/dragoncattrx-hub/ancap/blob/master/docs/rfc/service-catalog.md" in architecture_text


def test_export_bundle_has_no_broken_relative_markdown_links(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout

    sys.path.insert(0, str(REPO_ROOT))
    try:
        from scripts.export_ancap_docs import find_unresolved_bundle_links

        assert find_unresolved_bundle_links(target_dir) == []
    finally:
        sys.path.pop(0)


def test_export_bundle_includes_public_safe_github_templates(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout

    pr_template = (target_dir / ".github" / "pull_request_template.md").read_text(encoding="utf-8")
    bug_template = (target_dir / ".github" / "ISSUE_TEMPLATE" / "bug_report.md").read_text(encoding="utf-8")
    feature_template = (target_dir / ".github" / "ISSUE_TEMPLATE" / "feature_request.md").read_text(encoding="utf-8")
    config_template = (target_dir / ".github" / "ISSUE_TEMPLATE" / "config.yml").read_text(encoding="utf-8")

    assert "No secrets or sensitive infra details added" in pr_template
    assert "Do **not** include secrets" in bug_template
    assert "Which area is affected?" in feature_template
    assert "Security issue" in config_template


def test_export_bundle_includes_repo_bootstrap_guide(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout

    bootstrap_text = (target_dir / "docs" / "ANCAP_DOCS_REPO_BOOTSTRAP.md").read_text(encoding="utf-8")
    assert "GitHub Discussions" in bootstrap_text
    assert "good first issue" in bootstrap_text
    assert "help wanted" in bootstrap_text
    assert "branch protection" in bootstrap_text
    assert "secret scanning and push protection" in bootstrap_text
    assert "ANCAP_DOCS_LABEL_SEED.md" in bootstrap_text


def test_export_bundle_includes_label_seed(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout

    label_seed_text = (target_dir / "docs" / "ANCAP_DOCS_LABEL_SEED.md").read_text(encoding="utf-8")
    assert "good first issue" in label_seed_text
    assert "help wanted" in label_seed_text
    assert "docs" in label_seed_text
    assert "security" in label_seed_text
    assert "If GitHub Discussions is enabled" in label_seed_text


def test_export_bundle_root_readme_comes_from_docs_repo_template(tmp_path: Path):
    target_dir = tmp_path / "ancap-docs-export"

    result = subprocess.run(
        [sys.executable, str(SCRIPT_PATH), "--target", str(target_dir), "--clean"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr or result.stdout

    exported_readme = (target_dir / "README.md").read_text(encoding="utf-8")
    source_template = DOCS_REPO_README_SOURCE.read_text(encoding="utf-8")

    assert "This is the public-safe documentation landing page for the future `ancap-docs` repository." in source_template
    assert "This landing page is generated into the export bundle by `scripts/export_ancap_docs.py`" in source_template
    assert "This is the public-safe documentation landing page for the future `ancap-docs` repository." in exported_readme
    assert "The source monorepo still lives at:" in exported_readme
    assert "AI-Native Capital Allocation Platform" not in exported_readme
