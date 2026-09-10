"""sACP operations + reserve snapshots.

Revision ID: 069_sacp_stablecoin
Revises: 068_auction_escrow_tech
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "069_sacp_stablecoin"
down_revision = "068_auction_escrow_tech"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sacp_operations",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("user_bsc_address", sa.String(length=66), nullable=True),
        sa.Column("user_acp_address", sa.String(length=128), nullable=True),
        sa.Column("amount_acp_smallest", sa.Numeric(38, 0), nullable=False, server_default="0"),
        sa.Column("amount_sacp_wei", sa.Numeric(38, 0), nullable=False, server_default="0"),
        sa.Column("acp_per_usd", sa.Numeric(36, 18), nullable=False),
        sa.Column("min_collateral_ratio", sa.Numeric(12, 6), nullable=False),
        sa.Column("acp_tx_hash", sa.String(length=128), nullable=True),
        sa.Column("bsc_tx_hash", sa.String(length=128), nullable=True),
        sa.Column("collateral_ref_hex", sa.String(length=66), nullable=True),
        sa.Column("correlation_id", sa.String(length=128), nullable=True),
        sa.Column("notes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_sacp_ops_status", "sacp_operations", ["status"])
    op.create_index("ix_sacp_ops_user", "sacp_operations", ["user_id"])
    op.create_index("ix_sacp_ops_created", "sacp_operations", ["created_at"])

    op.create_table(
        "sacp_reserve_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("snapshot_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("reserve_balance_acp_smallest", sa.Numeric(38, 0), nullable=False, server_default="0"),
        sa.Column("sacp_total_supply_wei", sa.Numeric(38, 0), nullable=False, server_default="0"),
        sa.Column("implied_collateral_usd", sa.Numeric(36, 18), nullable=True),
        sa.Column("required_collateral_usd", sa.Numeric(36, 18), nullable=True),
        sa.Column("collateral_ratio", sa.Numeric(12, 6), nullable=True),
        sa.Column("reconciliation_ok", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("acp_reserve_address", sa.String(length=128), nullable=True),
        sa.Column("sacp_contract", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("reserve_health", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("notes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
    )
    op.create_index("ix_sacp_snapshots_time", "sacp_reserve_snapshots", ["snapshot_at"])


def downgrade() -> None:
    op.drop_index("ix_sacp_snapshots_time", table_name="sacp_reserve_snapshots")
    op.drop_table("sacp_reserve_snapshots")
    op.drop_index("ix_sacp_ops_created", table_name="sacp_operations")
    op.drop_index("ix_sacp_ops_user", table_name="sacp_operations")
    op.drop_index("ix_sacp_ops_status", table_name="sacp_operations")
    op.drop_table("sacp_operations")
