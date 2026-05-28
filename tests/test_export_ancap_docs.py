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
    Path("MASTER_ROADMAP.md"),
    Path("docs/STATUS_MATRIX.md"),
    Path("docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md"),
    Path("docs/ANCAP_DOCS_SPLIT.md"),
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


def test_export_script_contains_split_plan_and_manifest_guardrails():
    script_text = SCRIPT_PATH.read_text(encoding="utf-8")

    assert 'Path("docs/ANCAP_DOCS_SPLIT.md")' in script_text
    assert 'EXPORT_MANIFEST.md' in script_text
    assert 'hot-wallet / bridge-signer internals' in script_text


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
        assert exported_path.read_text(encoding="utf-8") == (REPO_ROOT / rel_path).read_text(encoding="utf-8")

    manifest_path = target_dir / "EXPORT_MANIFEST.md"
    assert manifest_path.exists()
    manifest_text = manifest_path.read_text(encoding="utf-8")
    assert "future public `ancap-docs` repository" in manifest_text
    assert "runtime secrets" in manifest_text
    assert "infra/" in manifest_text
    for rel_path in EXPECTED_EXPORTS:
        assert rel_path.as_posix() in manifest_text
