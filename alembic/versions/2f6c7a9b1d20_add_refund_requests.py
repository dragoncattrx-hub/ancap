"""Add refund requests table.

Revision ID: 2f6c7a9b1d20
Revises: 8c3d4b9a1f2e
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "2f6c7a9b1d20"
down_revision = "8c3d4b9a1f2e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "refund_requests",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("payment_intent_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("amount_currency", sa.String(length=10), nullable=False, server_default="ACP"),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("refund_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["payment_intent_id"], ["payment_intents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["refund_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_refund_requests_payment_intent_id"), "refund_requests", ["payment_intent_id"], unique=False)
    op.create_index(op.f("ix_refund_requests_user_id"), "refund_requests", ["user_id"], unique=False)
    op.create_index(op.f("ix_refund_requests_status"), "refund_requests", ["status"], unique=False)
    op.create_index(
        "ix_refund_requests_payment_status_created",
        "refund_requests",
        ["payment_intent_id", "status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_refund_requests_user_status_created",
        "refund_requests",
        ["user_id", "status", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_refund_requests_user_status_created", table_name="refund_requests")
    op.drop_index("ix_refund_requests_payment_status_created", table_name="refund_requests")
    op.drop_index(op.f("ix_refund_requests_status"), table_name="refund_requests")
    op.drop_index(op.f("ix_refund_requests_user_id"), table_name="refund_requests")
    op.drop_index(op.f("ix_refund_requests_payment_intent_id"), table_name="refund_requests")
    op.drop_table("refund_requests")
