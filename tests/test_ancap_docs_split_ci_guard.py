from pathlib import Path


BACKEND_CI_PATH = Path(".github/workflows/backend-ci.yml")
ROADMAP_PATH = Path("MASTER_ROADMAP.md")
STATUS_MATRIX_PATH = Path("docs/STATUS_MATRIX.md")
OPEN_SOURCE_DOC_PATH = Path("docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md")


def test_backend_ci_runs_docs_export_regression_when_split_files_change():
    workflow_text = BACKEND_CI_PATH.read_text(encoding="utf-8")

    for expected_path in [
        '      - "README.md"',
        '      - "LICENSE"',
        '      - "CONTRIBUTING.md"',
        '      - "SECURITY.md"',
        '      - "CODE_OF_CONDUCT.md"',
        '      - "MASTER_ROADMAP.md"',
        '      - "docs/**"',
        '      - "scripts/export_ancap_docs.py"',
        '      - "tests/**"',
    ]:
        assert expected_path in workflow_text

    assert 'pytest tests/test_export_ancap_docs.py tests/test_public_trust_docs.py tests/test_ancap_docs_split_ci_guard.py -q' in workflow_text


def test_roadmap_and_status_docs_record_ci_guard_for_docs_split_prep():
    roadmap_text = ROADMAP_PATH.read_text(encoding="utf-8")
    status_text = STATUS_MATRIX_PATH.read_text(encoding="utf-8")
    open_source_text = OPEN_SOURCE_DOC_PATH.read_text(encoding="utf-8")

    assert 'backend CI now runs the docs export/public-trust regression slice' in roadmap_text
    assert 'docs-focused root README' in roadmap_text
    assert 'issue/PR templates' in roadmap_text
    assert 'Backend CI reruns the export/public-trust regression slice' in status_text
    assert 'docs-focused root README' in status_text
    assert 'issue/PR templates' in status_text
    assert 'Backend CI now reruns the export/public-trust regression slice' in open_source_text
    assert 'docs-focused root `README.md`' in open_source_text
    assert 'issue/PR templates' in open_source_text
