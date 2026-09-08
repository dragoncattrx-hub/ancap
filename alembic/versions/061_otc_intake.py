"""OTC intake orders for precious metals and goods.

Revision ID: 061_otc_intake
Revises: 060_privacy
Create Date: 2026-09-08
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "061_otc_intake"
down_revision = "060_privacy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "acp_otc_intake_orders",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rail", sa.String(16), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="awaiting_handoff"),
        sa.Column("asset_label", sa.String(200), nullable=False),
        sa.Column("asset_detail", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("estimated_acp_amount", sa.Numeric(38, 18), nullable=False),
        sa.Column("payout_acp_address", sa.String(128), nullable=False),
        sa.Column("intake_reference", sa.String(64), nullable=False),
        sa.Column("proof_ref", sa.String(256), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("intake_reference", name="uq_acp_otc_intake_reference"),
        sa.UniqueConstraint("user_id", "idempotency_key", name="ux_otc_intake_user_idempotency"),
    )
    op.create_index("ix_acp_otc_intake_orders_user_id", "acp_otc_intake_orders", ["user_id"])
    op.create_index("ix_acp_otc_intake_orders_status", "acp_otc_intake_orders", ["status"])
    op.create_index("ix_acp_otc_intake_orders_rail", "acp_otc_intake_orders", ["rail"])
    op.create_index("ix_otc_intake_user_created", "acp_otc_intake_orders", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_otc_intake_user_created", table_name="acp_otc_intake_orders")
    op.drop_index("ix_acp_otc_intake_orders_rail", table_name="acp_otc_intake_orders")
    op.drop_index("ix_acp_otc_intake_orders_status", table_name="acp_otc_intake_orders")
    op.drop_index("ix_acp_otc_intake_orders_user_id", table_name="acp_otc_intake_orders")
    op.drop_table("acp_otc_intake_orders")
