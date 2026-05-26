from pathlib import Path


WORKFLOW_PATH = Path(".github/workflows/codeql.yml")


def test_codeql_workflow_covers_expected_languages_and_schedule():
    workflow_text = WORKFLOW_PATH.read_text(encoding="utf-8")

    assert 'name: "CodeQL"' in workflow_text
    assert 'push:' in workflow_text
    assert 'pull_request:' in workflow_text
    assert 'cron: "0 6 * * 1"' in workflow_text
    assert 'languages: "python"' in workflow_text
    assert 'languages: "javascript-typescript"' in workflow_text
    assert 'languages: "actions"' in workflow_text
    assert workflow_text.count('queries: "security-and-quality"') == 3
    assert 'category: "/language:python"' in workflow_text
    assert 'category: "/language:javascript-typescript"' in workflow_text
    assert 'category: "/language:actions"' in workflow_text
