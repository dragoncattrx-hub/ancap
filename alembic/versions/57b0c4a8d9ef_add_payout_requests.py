"""Add payout requests table.

Revision ID: 57b0c4a8d9ef
Revises: 56f5c6a2d1ab
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "57b0c4a8d9ef"
down_revision = "56f5c6a2d1ab"
branch_labels = None
depends_on = None


payout_status_enum = sa.Enum(
    "pending",
    "approved",
    "rejected",
    "completed",
    "failed",
    name="payoutrequeststatusenum",
)


def upgrade() -> None:
    payout_status_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "payout_requests",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("amount_currency", sa.String(length=10), nullable=False, server_default="ACP"),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("status", payout_status_enum, nullable=False, server_default="pending"),
        sa.Column("method", sa.String(length=32), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("request_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("approval_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("rejection_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["approval_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["rejection_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["request_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payout_requests_user_id"), "payout_requests", ["user_id"], unique=False)
    op.create_index(op.f("ix_payout_requests_status"), "payout_requests", ["status"], unique=False)
    op.create_index(
        "ix_payout_requests_user_status_created",
        "payout_requests",
        ["user_id", "status", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_payout_requests_user_status_created", table_name="payout_requests")
    op.drop_index(op.f("ix_payout_requests_status"), table_name="payout_requests")
    op.drop_index(op.f("ix_payout_requests_user_id"), table_name="payout_requests")
    op.drop_table("payout_requests")
    payout_status_enum.drop(op.get_bind(), checkfirst=True)
