"""Add payment intents for workflow monetization.

Revision ID: 044_payment_intents
Revises: 043_acp_wallet_recovery_ready
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "044_payment_intents"
down_revision = "043_acp_wallet_recovery_ready"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payment_intents",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("workflow_run_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("intent_type", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("payment_method", sa.String(length=64), nullable=False),
        sa.Column("amount_currency", sa.String(length=10), nullable=False),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("payment_reference", sa.String(length=128), nullable=True),
        sa.Column("reserved_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("capture_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("refund_ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("provider_payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["capture_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["refund_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reserved_ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["workflow_run_id"], ["workflow_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payment_intents_amount_currency"), "payment_intents", ["amount_currency"], unique=False)
    op.create_index(op.f("ix_payment_intents_intent_type"), "payment_intents", ["intent_type"], unique=False)
    op.create_index(op.f("ix_payment_intents_owner_user_id"), "payment_intents", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_payment_intents_payment_reference"), "payment_intents", ["payment_reference"], unique=False)
    op.create_index(op.f("ix_payment_intents_status"), "payment_intents", ["status"], unique=False)
    op.create_index(op.f("ix_payment_intents_workflow_run_id"), "payment_intents", ["workflow_run_id"], unique=False)
    op.create_index("ix_payment_intents_owner_created", "payment_intents", ["owner_user_id", "created_at"], unique=False)
    op.create_index("ix_payment_intents_run_status", "payment_intents", ["workflow_run_id", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_payment_intents_run_status", table_name="payment_intents")
    op.drop_index("ix_payment_intents_owner_created", table_name="payment_intents")
    op.drop_index(op.f("ix_payment_intents_workflow_run_id"), table_name="payment_intents")
    op.drop_index(op.f("ix_payment_intents_status"), table_name="payment_intents")
    op.drop_index(op.f("ix_payment_intents_payment_reference"), table_name="payment_intents")
    op.drop_index(op.f("ix_payment_intents_owner_user_id"), table_name="payment_intents")
    op.drop_index(op.f("ix_payment_intents_intent_type"), table_name="payment_intents")
    op.drop_index(op.f("ix_payment_intents_amount_currency"), table_name="payment_intents")
    op.drop_table("payment_intents")
