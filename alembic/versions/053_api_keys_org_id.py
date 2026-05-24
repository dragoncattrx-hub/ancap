"""Add org_id and name to api_keys (org-scoped API keys).

Revision ID: b7c4f9e2a1d3
Revises: 9a3e1f7c2b8d
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "b7c4f9e2a1d3"
down_revision = "9a3e1f7c2b8d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # org_id: nullable so existing personal keys (no org) continue to work
    op.add_column(
        "api_keys",
        sa.Column("org_id", sa.UUID(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True),
    )
    op.create_index("ix_api_keys_org_id", "api_keys", ["org_id"])

    # name: descriptive label for org-scoped keys
    op.add_column(
        "api_keys",
        sa.Column("name", sa.String(80), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("api_keys", "name")
    op.drop_index("ix_api_keys_org_id", "api_keys")
    op.drop_column("api_keys", "org_id")
