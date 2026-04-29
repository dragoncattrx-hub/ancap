"""Add persistent ACP swap orders and referral on-chain payout jobs.

Revision ID: 038
Revises: 037
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "038"
down_revision = "037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "acp_swap_orders",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("usdt_trc20_amount", sa.Numeric(precision=38, scale=18), nullable=False),
        sa.Column("rate_acp_per_usdt", sa.Numeric(precision=38, scale=18), nullable=False),
        sa.Column("estimated_acp_amount", sa.Numeric(precision=38, scale=18), nullable=False),
        sa.Column("payout_acp_address", sa.String(length=128), nullable=False),
        sa.Column("deposit_trc20_address", sa.String(length=128), nullable=False),
        sa.Column("deposit_reference", sa.String(length=64), nullable=False),
        sa.Column("tron_txid", sa.String(length=256), nullable=True),
        sa.Column("payout_txid", sa.String(length=128), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_acp_swap_orders_user_id", "acp_swap_orders", ["user_id"], unique=False)
    op.create_index("ix_acp_swap_orders_status", "acp_swap_orders", ["status"], unique=False)
    op.create_index("ix_acp_swap_orders_deposit_reference", "acp_swap_orders", ["deposit_reference"], unique=True)
    op.create_index("ix_acp_swap_orders_tron_txid", "acp_swap_orders", ["tron_txid"], unique=False)
    op.create_index("ix_acp_swap_orders_payout_txid", "acp_swap_orders", ["payout_txid"], unique=False)
    op.create_index("ix_swap_orders_user_created", "acp_swap_orders", ["user_id", "created_at"], unique=False)
    op.create_index("ux_swap_user_idempotency", "acp_swap_orders", ["user_id", "idempotency_key"], unique=True)

    op.create_table(
        "referral_onchain_payout_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("reward_event_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("to_address", sa.String(length=128), nullable=False),
        sa.Column("amount_value", sa.Numeric(precision=38, scale=18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("txid", sa.String(length=128), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["reward_event_id"], ["referral_reward_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_referral_onchain_payout_jobs_status", "referral_onchain_payout_jobs", ["status"], unique=False)
    op.create_index("ix_referral_onchain_payout_jobs_txid", "referral_onchain_payout_jobs", ["txid"], unique=False)
    op.create_index(
        "ix_ref_payout_status_created",
        "referral_onchain_payout_jobs",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ux_ref_payout_reward_event",
        "referral_onchain_payout_jobs",
        ["reward_event_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ux_ref_payout_reward_event", table_name="referral_onchain_payout_jobs")
    op.drop_index("ix_ref_payout_status_created", table_name="referral_onchain_payout_jobs")
    op.drop_index("ix_referral_onchain_payout_jobs_txid", table_name="referral_onchain_payout_jobs")
    op.drop_index("ix_referral_onchain_payout_jobs_status", table_name="referral_onchain_payout_jobs")
    op.drop_table("referral_onchain_payout_jobs")

    op.drop_index("ux_swap_user_idempotency", table_name="acp_swap_orders")
    op.drop_index("ix_swap_orders_user_created", table_name="acp_swap_orders")
    op.drop_index("ix_acp_swap_orders_payout_txid", table_name="acp_swap_orders")
    op.drop_index("ix_acp_swap_orders_tron_txid", table_name="acp_swap_orders")
    op.drop_index("ix_acp_swap_orders_deposit_reference", table_name="acp_swap_orders")
    op.drop_index("ix_acp_swap_orders_status", table_name="acp_swap_orders")
    op.drop_index("ix_acp_swap_orders_user_id", table_name="acp_swap_orders")
    op.drop_table("acp_swap_orders")
