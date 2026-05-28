from pathlib import Path


WORKFLOW_PATH = Path(".github/workflows/dependency-review.yml")


def test_dependency_review_workflow_guards_dependency_prs():
    workflow_text = WORKFLOW_PATH.read_text(encoding="utf-8")

    assert 'name: "Dependency Review"' in workflow_text
    assert 'pull_request:' in workflow_text
    assert 'branches: ["master"]' in workflow_text
    assert 'uses: actions/dependency-review-action@v4' in workflow_text
    assert 'fail-on-severity: moderate' in workflow_text

    for expected_path in [
        '      - "requirements.in"',
        '      - "requirements.txt"',
        '      - "pyproject.toml"',
        '      - "frontend-app/package.json"',
        '      - "frontend-app/package-lock.json"',
        '      - "ancap-mobile/package.json"',
        '      - "ancap-mobile/package-lock.json"',
    ]:
        assert expected_path in workflow_text
