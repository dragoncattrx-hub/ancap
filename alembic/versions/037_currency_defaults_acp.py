"""Switch pricing defaults to ACP and backfill legacy currencies.

Revision ID: 037
Revises: 036
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa


revision = "037"
down_revision = "036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("contracts", "currency", server_default=sa.text("'ACP'"))
    op.alter_column("contract_milestones", "currency", server_default=sa.text("'ACP'"))

    op.execute("UPDATE contracts SET currency='ACP' WHERE currency IN ('USD', 'VUSD')")
    op.execute("UPDATE contract_milestones SET currency='ACP' WHERE currency IN ('USD', 'VUSD')")


def downgrade() -> None:
    op.alter_column("contracts", "currency", server_default=sa.text("'USD'"))
    op.alter_column("contract_milestones", "currency", server_default=sa.text("'USD'"))

    op.execute("UPDATE contracts SET currency='USD' WHERE currency='ACP'")
    op.execute("UPDATE contract_milestones SET currency='USD' WHERE currency='ACP'")

