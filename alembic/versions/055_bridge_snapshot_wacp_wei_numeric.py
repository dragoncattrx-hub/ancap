"""Widen bridge_reserve_snapshots wACP wei columns to NUMERIC (wei exceeds int64).

Revision ID: d4a7c2e91f0b
Revises: c4d5e6f7a8b9
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d4a7c2e91f0b"
down_revision = "c4d5e6f7a8b9"
branch_labels = None
depends_on = None

_WEI_NUMERIC = sa.Numeric(38, 0)


def upgrade() -> None:
    op.alter_column(
        "bridge_reserve_snapshots",
        "total_wacp_wei_completed",
        existing_type=sa.BigInteger(),
        type_=_WEI_NUMERIC,
        existing_nullable=False,
        postgresql_using="total_wacp_wei_completed::numeric",
    )
    op.alter_column(
        "bridge_reserve_snapshots",
        "total_wacp_wei_implied",
        existing_type=sa.BigInteger(),
        type_=_WEI_NUMERIC,
        existing_nullable=False,
        postgresql_using="total_wacp_wei_implied::numeric",
    )
    op.alter_column(
        "bridge_reserve_snapshots",
        "delta_wacp_wei",
        existing_type=sa.BigInteger(),
        type_=_WEI_NUMERIC,
        existing_nullable=False,
        postgresql_using="delta_wacp_wei::numeric",
    )


def downgrade() -> None:
    op.alter_column(
        "bridge_reserve_snapshots",
        "delta_wacp_wei",
        existing_type=_WEI_NUMERIC,
        type_=sa.BigInteger(),
        existing_nullable=False,
        postgresql_using="delta_wacp_wei::bigint",
    )
    op.alter_column(
        "bridge_reserve_snapshots",
        "total_wacp_wei_implied",
        existing_type=_WEI_NUMERIC,
        type_=sa.BigInteger(),
        existing_nullable=False,
        postgresql_using="total_wacp_wei_implied::bigint",
    )
    op.alter_column(
        "bridge_reserve_snapshots",
        "total_wacp_wei_completed",
        existing_type=_WEI_NUMERIC,
        type_=sa.BigInteger(),
        existing_nullable=False,
        postgresql_using="total_wacp_wei_completed::bigint",
    )
