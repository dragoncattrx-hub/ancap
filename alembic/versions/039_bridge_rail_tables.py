"""Bridge rail: wACP clearing operations, checkpoints, audit, allowlist.

Revision ID: 039
Revises: 038
Create Date: 2026-05-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "039"
down_revision = "038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bridge_watcher_checkpoints",
        sa.Column("chain_key", sa.String(length=32), nullable=False),
        sa.Column("last_block_height", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("chain_key"),
    )
    op.create_table(
        "bridge_allowlist_addresses",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("bsc_address", sa.String(length=66), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bridge_allowlist_bsc", "bridge_allowlist_addresses", ["bsc_address"], unique=True)

    op.create_table(
        "bridge_operations",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("direction", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("user_bsc_address", sa.String(length=66), nullable=True),
        sa.Column("user_acp_address", sa.String(length=128), nullable=True),
        sa.Column("amount_acp_smallest", sa.Numeric(precision=38, scale=0), nullable=False),
        sa.Column("amount_wacp_wei", sa.Numeric(precision=38, scale=0), nullable=False),
        sa.Column("remainder_wacp_wei", sa.Numeric(precision=38, scale=0), nullable=False, server_default="0"),
        sa.Column("acp_chain_id", sa.String(length=32), nullable=False, server_default="acp"),
        sa.Column("acp_tx_hash", sa.String(length=128), nullable=True),
        sa.Column("acp_out_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("bsc_tx_hash_mint", sa.String(length=128), nullable=True),
        sa.Column("bsc_tx_hash_burn", sa.String(length=128), nullable=True),
        sa.Column("bsc_log_index", sa.Integer(), nullable=True),
        sa.Column("bsc_chain_id", sa.String(length=32), nullable=False, server_default="bsc"),
        sa.Column("deposit_ref_hex", sa.String(length=66), nullable=True),
        sa.Column("correlation_id", sa.String(length=128), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bridge_ops_status", "bridge_operations", ["status"], unique=False)
    op.create_index("ix_bridge_ops_user", "bridge_operations", ["user_id"], unique=False)
    op.create_index("ix_bridge_ops_created", "bridge_operations", ["created_at"], unique=False)
    op.create_index(
        "ux_bridge_ops_acp_tx",
        "bridge_operations",
        ["acp_chain_id", "acp_tx_hash", "acp_out_index"],
        unique=True,
        postgresql_where=sa.text("acp_tx_hash IS NOT NULL"),
    )
    op.create_index(
        "ux_bridge_ops_bsc_burn_tx",
        "bridge_operations",
        ["bsc_chain_id", "bsc_tx_hash_burn"],
        unique=True,
        postgresql_where=sa.text("bsc_tx_hash_burn IS NOT NULL"),
    )

    op.create_table(
        "bridge_state_transitions",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("from_status", sa.String(length=40), nullable=True),
        sa.Column("to_status", sa.String(length=40), nullable=False),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["operation_id"], ["bridge_operations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bridge_transitions_op", "bridge_state_transitions", ["operation_id"], unique=False)

    op.create_table(
        "bridge_audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("operation_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["operation_id"], ["bridge_operations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bridge_audit_op", "bridge_audit_events", ["operation_id"], unique=False)
    op.create_index("ix_bridge_audit_type_time", "bridge_audit_events", ["event_type", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_bridge_audit_type_time", table_name="bridge_audit_events")
    op.drop_index("ix_bridge_audit_op", table_name="bridge_audit_events")
    op.drop_table("bridge_audit_events")
    op.drop_index("ix_bridge_transitions_op", table_name="bridge_state_transitions")
    op.drop_table("bridge_state_transitions")
    op.drop_index("ux_bridge_ops_bsc_burn_tx", table_name="bridge_operations")
    op.drop_index("ux_bridge_ops_acp_tx", table_name="bridge_operations")
    op.drop_index("ix_bridge_ops_created", table_name="bridge_operations")
    op.drop_index("ix_bridge_ops_user", table_name="bridge_operations")
    op.drop_index("ix_bridge_ops_status", table_name="bridge_operations")
    op.drop_table("bridge_operations")
    op.drop_index("ix_bridge_allowlist_bsc", table_name="bridge_allowlist_addresses")
    op.drop_table("bridge_allowlist_addresses")
    op.drop_table("bridge_watcher_checkpoints")
