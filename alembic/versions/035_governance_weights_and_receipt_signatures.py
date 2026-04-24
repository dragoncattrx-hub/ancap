"""Add governance vote weight and chain receipt signatures.

Revision ID: 035
Revises: 034
Create Date: 2026-04-24
"""
from alembic import op
import sqlalchemy as sa


revision = "035"
down_revision = "034"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("governance_votes", sa.Column("vote_weight", sa.Numeric(12, 6), nullable=False, server_default="1"))
    op.alter_column("governance_votes", "vote_weight", server_default=None)
    op.add_column("chain_receipts", sa.Column("node_signature", sa.Text(), nullable=True))
    op.add_column("chain_receipts", sa.Column("node_public_key", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("chain_receipts", "node_public_key")
    op.drop_column("chain_receipts", "node_signature")
    op.drop_column("governance_votes", "vote_weight")

