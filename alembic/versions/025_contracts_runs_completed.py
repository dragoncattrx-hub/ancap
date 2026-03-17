"""Add contracts.runs_completed for atomic max_runs enforcement.

Revision ID: 025
Revises: 024
Create Date: 2026-03-17
"""

from alembic import op
import sqlalchemy as sa


revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "contracts",
        sa.Column("runs_completed", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute("UPDATE contracts SET runs_completed = 0 WHERE runs_completed IS NULL")
    op.alter_column("contracts", "runs_completed", server_default=None)


def downgrade() -> None:
    op.drop_column("contracts", "runs_completed")

