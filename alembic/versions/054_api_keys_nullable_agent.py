"""Allow agent_id to be NULL in api_keys (org-owned keys have no agent).

Revision ID: c3e8f1b5d4a6
Revises: b7c4f9e2a1d3
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "c3e8f1b5d4a6"
down_revision = "b7c4f9e2a1d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Org-owned keys have no agent; allow agent_id to be null
    op.alter_column("api_keys", "agent_id", existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column("api_keys", "agent_id", existing_type=sa.UUID(), nullable=False)
