"""Add paid API usage events.

Revision ID: 046_paid_api_usage
Revises: 045_payment_intents_topup
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "046_paid_api_usage"
down_revision = "045_payment_intents_topup"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "api_usage_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("api_key_prefix", sa.String(length=24), nullable=True),
        sa.Column("product_slug", sa.String(length=80), nullable=False),
        sa.Column("endpoint", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("amount_currency", sa.String(length=10), nullable=False),
        sa.Column("amount_value", sa.Numeric(36, 18), nullable=False),
        sa.Column("ledger_event_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("request_hash", sa.String(length=64), nullable=False),
        sa.Column("response_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["agent_id"], ["agents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ledger_event_id"], ["ledger_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_api_usage_events_agent_id"), "api_usage_events", ["agent_id"], unique=False)
    op.create_index(op.f("ix_api_usage_events_amount_currency"), "api_usage_events", ["amount_currency"], unique=False)
    op.create_index(op.f("ix_api_usage_events_api_key_prefix"), "api_usage_events", ["api_key_prefix"], unique=False)
    op.create_index(op.f("ix_api_usage_events_owner_user_id"), "api_usage_events", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_api_usage_events_product_slug"), "api_usage_events", ["product_slug"], unique=False)
    op.create_index(op.f("ix_api_usage_events_request_hash"), "api_usage_events", ["request_hash"], unique=False)
    op.create_index(op.f("ix_api_usage_events_status"), "api_usage_events", ["status"], unique=False)
    op.create_index("ix_api_usage_events_agent_created", "api_usage_events", ["agent_id", "created_at"], unique=False)
    op.create_index("ix_api_usage_events_owner_created", "api_usage_events", ["owner_user_id", "created_at"], unique=False)
    op.create_index("ix_api_usage_events_product_status", "api_usage_events", ["product_slug", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_api_usage_events_product_status", table_name="api_usage_events")
    op.drop_index("ix_api_usage_events_owner_created", table_name="api_usage_events")
    op.drop_index("ix_api_usage_events_agent_created", table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_status"), table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_request_hash"), table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_product_slug"), table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_owner_user_id"), table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_api_key_prefix"), table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_amount_currency"), table_name="api_usage_events")
    op.drop_index(op.f("ix_api_usage_events_agent_id"), table_name="api_usage_events")
    op.drop_table("api_usage_events")
