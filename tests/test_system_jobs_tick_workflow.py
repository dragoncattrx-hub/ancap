from pathlib import Path


WORKFLOW_PATH = Path(".github/workflows/system-jobs-tick.yml")


def test_system_jobs_tick_workflow_requires_async_endpoint_guard():
    workflow_text = WORKFLOW_PATH.read_text(encoding="utf-8")

    assert "ANCAP_SYSTEM_JOBS_TICK_URL must target /v1/system/jobs/tick/async" in workflow_text
    assert '*/v1/system/jobs/tick/async' in workflow_text
    assert 'curl --fail-with-body --silent --show-error \\\n            -X POST \\\n            -H "X-Cron-Secret: $CRON_SECRET" \\\n            "$SYSTEM_JOBS_TICK_URL"' in workflow_text
