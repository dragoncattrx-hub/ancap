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
        '      - "STATUS.md"',
        '      - "docs/**"',
        '      - ".github/CODEOWNERS"',
        '      - ".github/bootstrap/**"',
        '      - ".github/pull_request_template.md"',
        '      - ".github/ISSUE_TEMPLATE/**"',
        '      - ".github/workflows/docs-ci.yml"',
        '      - "scripts/export_ancap_docs.py"',
        '      - "scripts/bootstrap_ancap_docs_repo.py"',
        '      - "scripts/generate_ancap_docs_live_followup.py"',
        '      - "tests/**"',
    ]:
        assert expected_path in workflow_text

    assert 'pytest tests/test_export_ancap_docs.py tests/test_public_trust_docs.py tests/test_status_summary.py tests/test_ancap_docs_split_ci_guard.py tests/test_bootstrap_ancap_docs_repo.py tests/test_generate_ancap_docs_live_followup.py -q' in workflow_text


def test_roadmap_and_status_docs_record_ci_guard_for_docs_split_prep():
    roadmap_text = ROADMAP_PATH.read_text(encoding="utf-8")
    status_text = STATUS_MATRIX_PATH.read_text(encoding="utf-8")
    open_source_text = OPEN_SOURCE_DOC_PATH.read_text(encoding="utf-8")

    assert 'backend CI now runs the docs export/public-trust regression slice' in roadmap_text
    assert 'docs-focused root README' in roadmap_text
    assert 'issue/PR templates' in roadmap_text
    assert 'contributor-intake seed' in roadmap_text
    assert 'baseline CODEOWNERS review-routing seed' in roadmap_text
    assert 'repo-bootstrap checklist' in roadmap_text
    assert 'reusable contributor-intake/label/Discussions/milestone/project-board/repo-settings/update-cadence/CI/Dependabot seeds' in roadmap_text
    assert 'copy-ready pinned-topic text plus monthly-update/release-note/trust-change starter templates' in roadmap_text
    assert 'public repo creation, repo settings/labels/milestones, live repo verification, and the branch-protection payload' in roadmap_text
    assert 'Docs CI / docs-bundle' in roadmap_text
    assert 'copy-ready `gh api graphql --raw-field "query=..."` commands for the automatable `createDiscussion` / `updateDiscussion` portion' in roadmap_text
    assert '.github/bootstrap/ancap-docs-ci-workflow.yml' in roadmap_text
    assert 'drift-guards the exported docs-repo Dependabot file against its bootstrap template' in roadmap_text
    assert 'Backend CI still reruns the export/public-trust regression slice' in status_text
    assert 'docs-focused root README' in status_text
    assert 'issue/PR templates' in status_text
    assert 'contributor-intake seed' in status_text
    assert 'baseline CODEOWNERS review-routing seed' in status_text
    assert 'reusable repo bootstrap/settings/labels/Discussions/milestones/project-board/repo-settings/update-cadence/CI/Dependabot seeds' in status_text
    assert 'copy-ready pinned-topic/update-post templates' in status_text
    assert 'copy-ready `gh api graphql --raw-field "query=..."` commands for the automatable `createDiscussion` / `updateDiscussion` portion' in status_text
    assert 'public repo creation, repo settings/labels/milestones, live repo verification, and the default-branch protection payload' in status_text
    assert 'Docs CI / docs-bundle' in status_text
    assert 'structural alignment for the workflow template plus byte-for-byte alignment for the docs-repo Dependabot template' in status_text
    assert 'bootstrap-seed README' in status_text
    assert 'Backend CI now reruns the export/public-trust regression slice' in open_source_text
    assert 'docs-focused root `README.md`' in open_source_text
    assert 'issue/PR templates' in open_source_text
    assert 'contributor-intake seed' in open_source_text
    assert 'baseline `.github/CODEOWNERS` file' in open_source_text
    assert 'labels / Discussions / release-tracking / update-rhythm setup' in open_source_text
    assert 'repo-settings seed' in open_source_text
    assert 'Discussions seed' in open_source_text
    assert 'milestone seed' in open_source_text
    assert 'project-board seed' in open_source_text
    assert 'update-cadence seed' in open_source_text
    assert 'CI seed' in open_source_text
    assert 'copy-ready pinned-topic/update-post templates' in open_source_text
    assert 'repo-create/repo-settings/label/milestone seeds' in open_source_text
    assert '--verify-live --verify-live-community' in open_source_text
    assert 'seeded labels, milestones, Discussions categories, seeded discussion-topic presence, pinned-discussion presence, and seeded starter-issue routing' in open_source_text
    assert 'Dependabot seed' in open_source_text
    assert 'later default-branch protection payload' in open_source_text
    assert 'Project board seed targets' in open_source_text
    assert 'copy-ready `gh api graphql --raw-field "query=..."` commands for the automatable `createDiscussion` / `updateDiscussion` portion' in open_source_text
    assert 'docs-repo Dependabot template as a drift-guarded artifact' in open_source_text
    assert '.github/bootstrap/README.md' in open_source_text
    assert '.github/bootstrap/ancap-docs-labels.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-milestones.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-discussions.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-project-board.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-repo-settings.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-update-cadence.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-ci.json' in open_source_text
    assert '.github/bootstrap/ancap-docs-ci-workflow.yml' in open_source_text
    assert '.github/bootstrap/ancap-docs-dependabot.yml' in open_source_text
    assert '.github/workflows/docs-ci.yml' in open_source_text
    assert 'machine-readable bootstrap metadata' in open_source_text
