"""ACP exchange-office tickets (mobile multi-asset hub).

Revision ID: 062_exchange_office
Revises: 061_otc_intake
Create Date: 2026-09-08
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "062_exchange_office"
down_revision = "061_otc_intake"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "acp_exchange_tickets",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="opened"),
        sa.Column("from_asset", sa.String(64), nullable=False),
        sa.Column("to_asset", sa.String(64), nullable=False),
        sa.Column("from_amount", sa.Numeric(38, 18), nullable=False),
        sa.Column("to_amount_estimated", sa.Numeric(38, 18), nullable=False),
        sa.Column("acp_hub_amount", sa.Numeric(38, 18), nullable=False),
        sa.Column("rail", sa.String(32), nullable=False),
        sa.Column("rail_ref_type", sa.String(32), nullable=True),
        sa.Column("rail_ref_id", sa.String(64), nullable=True),
        sa.Column("quote_id", sa.String(64), nullable=False),
        sa.Column("quote_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("payout_acp_address", sa.String(128), nullable=True),
        sa.Column("counterparty_address", sa.String(256), nullable=True),
        sa.Column("intake_reference", sa.String(64), nullable=True),
        sa.Column("handoff_instructions", sa.Text(), nullable=True),
        sa.Column("next_step", sa.Text(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(128), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("intake_reference", name="uq_acp_exchange_tickets_intake_reference"),
        sa.UniqueConstraint("user_id", "idempotency_key", name="ux_exchange_tickets_user_idempotency"),
    )
    op.create_index("ix_acp_exchange_tickets_user_id", "acp_exchange_tickets", ["user_id"])
    op.create_index("ix_acp_exchange_tickets_status", "acp_exchange_tickets", ["status"])
    op.create_index("ix_acp_exchange_tickets_from_asset", "acp_exchange_tickets", ["from_asset"])
    op.create_index("ix_acp_exchange_tickets_to_asset", "acp_exchange_tickets", ["to_asset"])
    op.create_index("ix_acp_exchange_tickets_rail", "acp_exchange_tickets", ["rail"])
    op.create_index("ix_acp_exchange_tickets_quote_id", "acp_exchange_tickets", ["quote_id"])
    op.create_index("ix_acp_exchange_tickets_rail_ref_id", "acp_exchange_tickets", ["rail_ref_id"])
    op.create_index("ix_exchange_tickets_user_created", "acp_exchange_tickets", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_exchange_tickets_user_created", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_rail_ref_id", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_quote_id", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_rail", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_to_asset", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_from_asset", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_status", table_name="acp_exchange_tickets")
    op.drop_index("ix_acp_exchange_tickets_user_id", table_name="acp_exchange_tickets")
    op.drop_table("acp_exchange_tickets")
