"""Allow payment intents without workflow runs.

Revision ID: 045_payment_intents_topup
Revises: 044_payment_intents
Create Date: 2026-05-17
"""

from alembic import op


revision = "045_payment_intents_topup"
down_revision = "044_payment_intents"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("payment_intents", "workflow_run_id", nullable=True)


def downgrade() -> None:
    op.alter_column("payment_intents", "workflow_run_id", nullable=False)
