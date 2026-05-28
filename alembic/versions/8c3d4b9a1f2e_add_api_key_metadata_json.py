"""Add metadata_json to api_keys for org spend caps.

Revision ID: 8c3d4b9a1f2e
Revises: 9f1c7a4b2d10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "8c3d4b9a1f2e"
down_revision = "9f1c7a4b2d10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "api_keys",
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
    )


def downgrade() -> None:
    op.drop_column("api_keys", "metadata_json")
