"""Add bridge_reserve_snapshots for reserve proof maturity (stale-data detection + mismatch alerting).

Revision ID: 9a3e1f7c2b8d
Revises: e5f2d1a80b0c
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "9a3e1f7c2b8d"
down_revision = "e5f2d1a80b0c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bridge_reserve_snapshots",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("snapshot_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reserve_balance_acp_smallest", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("total_wacp_wei_completed", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("total_wacp_wei_implied", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("backing_ratio", sa.Numeric(12, 6), nullable=True),
        sa.Column("delta_wacp_wei", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("reconciliation_ok", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("acp_reserve_address", sa.String(128), nullable=True),
        sa.Column("wacp_contract", sa.String(64), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("reserve_health", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("notes", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("last_acp_block_height", sa.BigInteger(), nullable=True),
        sa.Column("last_bsc_block_number", sa.BigInteger(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bridge_snapshots_time", "bridge_reserve_snapshots", ["snapshot_at"])


def downgrade() -> None:
    op.drop_index("ix_bridge_snapshots_time", "bridge_reserve_snapshots")
    op.drop_table("bridge_reserve_snapshots")
