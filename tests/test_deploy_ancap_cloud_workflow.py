from __future__ import annotations

from pathlib import Path


WORKFLOW_PATH = Path(".github/workflows/deploy-ancap-cloud.yml")


def test_deploy_ancap_cloud_workflow_fails_closed_when_secrets_missing() -> None:
    workflow_text = WORKFLOW_PATH.read_text(encoding="utf-8")

    assert 'echo "::error::Missing required secret backing ${var}; deploy cannot run."' in workflow_text
    assert "Deploy failed closed: required ANCAP_DEPLOY_* secrets are not configured." in workflow_text
    assert "exit 1" in workflow_text
    assert "Skip deploy (missing secrets)" not in workflow_text
    assert "can_deploy=false" not in workflow_text
    assert "steps.validate_secrets.outputs.can_deploy" not in workflow_text
    assert "STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}" in workflow_text
    assert "STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}" in workflow_text
    assert "STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}" in workflow_text
    assert "sync Stripe adapter keys into host .env" in workflow_text
