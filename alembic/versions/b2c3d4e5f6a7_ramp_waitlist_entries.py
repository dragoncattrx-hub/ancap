"""Ramp waitlist entries for partner top-up onboarding.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b2c3d4e5f6a7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ramp_waitlist_entries",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("interest", sa.String(length=64), nullable=False, server_default="stablecoin_topup"),
        sa.Column("region", sa.String(length=64), nullable=True),
        sa.Column("notes", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ramp_waitlist_entries_email", "ramp_waitlist_entries", ["email"])
    op.create_index("ix_ramp_waitlist_entries_interest", "ramp_waitlist_entries", ["interest"])
    op.create_index("ix_ramp_waitlist_entries_status", "ramp_waitlist_entries", ["status"])


def downgrade() -> None:
    op.drop_index("ix_ramp_waitlist_entries_status", table_name="ramp_waitlist_entries")
    op.drop_index("ix_ramp_waitlist_entries_interest", table_name="ramp_waitlist_entries")
    op.drop_index("ix_ramp_waitlist_entries_email", table_name="ramp_waitlist_entries")
    op.drop_table("ramp_waitlist_entries")
