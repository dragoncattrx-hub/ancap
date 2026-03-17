"""Add contract_* reputation event types.

Revision ID: 027
Revises: 026
Create Date: 2026-03-17
"""

from alembic import op


revision = "027"
down_revision = "026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Stored as plain strings in DB; no enum migration required.
    # This migration is a no-op kept for schema history coherence.
    pass


def downgrade() -> None:
    pass

