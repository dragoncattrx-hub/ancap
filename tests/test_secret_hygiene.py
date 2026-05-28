from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
README = REPO_ROOT / "README.md"
SECURITY = REPO_ROOT / "SECURITY.md"
SECRET_ROTATION_RUNBOOK = REPO_ROOT / "docs" / "SECRET_ROTATION_RUNBOOK.md"
PRODUCTION_SECRET_BASELINE = REPO_ROOT / "docs" / "PRODUCTION_SECRET_BASELINE.md"
STATUS_MATRIX = REPO_ROOT / "docs" / "STATUS_MATRIX.md"
MASTER_ROADMAP = REPO_ROOT / "MASTER_ROADMAP.md"
PRODUCTION_ROADMAP = REPO_ROOT / "PRODUCTION_ROADMAP.md"
RELEASE_PROCESS = REPO_ROOT / ".github" / "RELEASE_PROCESS.md"
ENV_EXAMPLE = REPO_ROOT / ".env.example"


def test_secret_rotation_runbook_exists_and_is_linked_from_security_docs():
    runbook_text = SECRET_ROTATION_RUNBOOK.read_text(encoding="utf-8")
    security_text = SECURITY.read_text(encoding="utf-8")
    readme_text = README.read_text(encoding="utf-8")

    assert "Treat the exposed value as compromised" in runbook_text
    assert "Revoke or rotate at the upstream provider first" in runbook_text
    assert "pytest tests/test_secret_hygiene.py -q" in runbook_text
    assert "docs/SECRET_ROTATION_RUNBOOK.md" in security_text
    assert "docs/SECRET_ROTATION_RUNBOOK.md" in readme_text


def test_status_and_roadmap_keep_manual_secret_rotation_tail_explicit():
    status_text = STATUS_MATRIX.read_text(encoding="utf-8")
    roadmap_text = MASTER_ROADMAP.read_text(encoding="utf-8")

    assert "upstream revoke/rotation" in status_text
    assert "docs/SECRET_ROTATION_RUNBOOK.md" in status_text
    assert "Revoke the compromised provider key at the upstream dashboard/API" in roadmap_text


def test_production_secret_baseline_doc_is_linked_and_keeps_manual_follow_through_explicit():
    baseline_text = PRODUCTION_SECRET_BASELINE.read_text(encoding="utf-8")
    readme_text = README.read_text(encoding="utf-8")
    roadmap_text = MASTER_ROADMAP.read_text(encoding="utf-8")
    production_text = PRODUCTION_ROADMAP.read_text(encoding="utf-8")
    release_text = RELEASE_PROCESS.read_text(encoding="utf-8")
    status_text = STATUS_MATRIX.read_text(encoding="utf-8")

    assert "docker compose -f docker-compose.prod.yml config --quiet" in baseline_text
    assert "required production secrets are provisioned outside the repo" in baseline_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in readme_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in roadmap_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in production_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in release_text
    assert "docs/PRODUCTION_SECRET_BASELINE.md" in status_text


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
