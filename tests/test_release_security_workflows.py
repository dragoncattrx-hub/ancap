from pathlib import Path


BACKEND_CI_PATH = Path(".github/workflows/backend-ci.yml")
RELEASE_WORKFLOW_PATH = Path(".github/workflows/release.yml")
RELEASE_PROCESS_PATH = Path(".github/RELEASE_PROCESS.md")
SECRET_HYGIENE_WORKFLOW_PATH = Path(".github/workflows/secret-hygiene.yml")


def test_backend_ci_keeps_honest_bandit_and_docker_build_guards():
    workflow_text = BACKEND_CI_PATH.read_text(encoding="utf-8")

    assert 'python -m bandit -r app/ -f txt 2>&1 | tee bandit-report.txt' in workflow_text
    assert 'docker build -t ancap:build-check .' in workflow_text
    assert '--target deps' not in workflow_text
    assert '|| true' not in workflow_text


def test_release_workflow_runs_secret_hygiene_gate_before_release_checks():
    workflow_text = RELEASE_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert '      - name: Secret hygiene scan' in workflow_text
    assert '        run: python scripts/check_secret_hygiene.py' in workflow_text
    assert '      - name: Secret hygiene regression' in workflow_text
    assert '        run: pytest tests/test_secret_hygiene.py -q' in workflow_text
    assert workflow_text.index('      - name: Secret hygiene scan') < workflow_text.index('      - name: Run Alembic migrations')
    assert workflow_text.index('      - name: Secret hygiene regression') < workflow_text.index('      - name: Run Alembic migrations')


def test_secret_hygiene_workflow_runs_on_push_and_pull_request():
    workflow_text = SECRET_HYGIENE_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert 'name: "Secret Hygiene"' in workflow_text
    assert 'push:' in workflow_text
    assert 'pull_request:' in workflow_text
    assert 'branches: ["master"]' in workflow_text
    assert 'group: secret-hygiene-${{ github.ref }}' in workflow_text
    assert 'uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd # v5' in workflow_text
    assert 'uses: actions/setup-python@a309ff8b426b58ec0e2a45f0f869d46889d02405 # v6' in workflow_text
    assert 'python-version: "3.11"' in workflow_text
    assert 'run: python scripts/check_secret_hygiene.py' in workflow_text


def test_release_process_doc_uses_secret_hygiene_gate():
    release_process = RELEASE_PROCESS_PATH.read_text(encoding="utf-8")

    assert 'python scripts/check_secret_hygiene.py' in release_process
    assert 'pytest tests/test_secret_hygiene.py -q' in release_process
    assert '# 2. Secret hygiene gates pass before release' in release_process
