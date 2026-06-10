"""Commerce: merchant pay, payment links, invoices, claim codes.

Revision ID: a1b2c3d4e5f6
Revises: 2f6c7a9b1d20
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a1b2c3d4e5f6"
down_revision = "2f6c7a9b1d20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "merchant_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("display_name", sa.String(length=128), nullable=False, server_default="Merchant"),
        sa.Column("plan_tier", sa.String(length=32), nullable=False, server_default="starter"),
        sa.Column("fee_bps", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner_user_id"),
    )
    op.create_index("ix_merchant_accounts_owner_user_id", "merchant_accounts", ["owner_user_id"])

    op.create_table(
        "payment_links",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("merchant_account_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("amount_currency", sa.String(length=10), nullable=False, server_default="ACP"),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_intent_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("payer_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["merchant_account_id"], ["merchant_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_intent_id"], ["payment_intents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["payer_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_payment_links_code", "payment_links", ["code"])
    op.create_index("ix_payment_links_owner_created", "payment_links", ["owner_user_id", "created_at"])

    op.create_table(
        "merchant_invoices",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("merchant_account_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("invoice_number", sa.String(length=64), nullable=False),
        sa.Column("customer_email", sa.String(length=255), nullable=True),
        sa.Column("line_items_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("amount_currency", sa.String(length=10), nullable=False, server_default="ACP"),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payment_link_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["merchant_account_id"], ["merchant_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["payment_link_id"], ["payment_links.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_merchant_invoices_owner_created", "merchant_invoices", ["owner_user_id", "created_at"])

    op.create_table(
        "claim_codes",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("secret_hash", sa.String(length=128), nullable=False),
        sa.Column("code_hint", sa.String(length=8), nullable=False),
        sa.Column("amount_currency", sa.String(length=10), nullable=False, server_default="ACP"),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("max_redemptions", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("redemption_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("campaign_label", sa.String(length=128), nullable=True),
        sa.Column("pin_hash", sa.String(length=128), nullable=True),
        sa.Column("lock_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lock_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_claim_codes_owner_created", "claim_codes", ["owner_user_id", "created_at"])


def downgrade() -> None:
    op.drop_table("claim_codes")
    op.drop_table("merchant_invoices")
    op.drop_table("payment_links")
    op.drop_table("merchant_accounts")
