"""Add LLM usage events.

Revision ID: 047_llm_usage_events
Revises: 046_paid_api_usage
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "047_llm_usage_events"
down_revision = "046_paid_api_usage"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "llm_usage_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("workflow_run_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("provider", sa.String(length=40), nullable=False),
        sa.Column("model", sa.String(length=120), nullable=False),
        sa.Column("prompt_hash", sa.String(length=64), nullable=False),
        sa.Column("input_tokens_estimate", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_tokens_estimate", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("error", sa.String(length=1000), nullable=True),
        sa.Column("cost_currency", sa.String(length=10), nullable=False, server_default="ACP"),
        sa.Column("cost_amount", sa.Numeric(36, 18), nullable=False, server_default="0"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["workflow_run_id"], ["workflow_runs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_llm_usage_events_owner_user_id"), "llm_usage_events", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_llm_usage_events_prompt_hash"), "llm_usage_events", ["prompt_hash"], unique=False)
    op.create_index(op.f("ix_llm_usage_events_provider"), "llm_usage_events", ["provider"], unique=False)
    op.create_index(op.f("ix_llm_usage_events_status"), "llm_usage_events", ["status"], unique=False)
    op.create_index(op.f("ix_llm_usage_events_workflow_run_id"), "llm_usage_events", ["workflow_run_id"], unique=False)
    op.create_index("ix_llm_usage_events_owner_created", "llm_usage_events", ["owner_user_id", "created_at"], unique=False)
    op.create_index("ix_llm_usage_events_provider_status", "llm_usage_events", ["provider", "status"], unique=False)
    op.create_index("ix_llm_usage_events_run_created", "llm_usage_events", ["workflow_run_id", "created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_llm_usage_events_run_created", table_name="llm_usage_events")
    op.drop_index("ix_llm_usage_events_provider_status", table_name="llm_usage_events")
    op.drop_index("ix_llm_usage_events_owner_created", table_name="llm_usage_events")
    op.drop_index(op.f("ix_llm_usage_events_workflow_run_id"), table_name="llm_usage_events")
    op.drop_index(op.f("ix_llm_usage_events_status"), table_name="llm_usage_events")
    op.drop_index(op.f("ix_llm_usage_events_provider"), table_name="llm_usage_events")
    op.drop_index(op.f("ix_llm_usage_events_prompt_hash"), table_name="llm_usage_events")
    op.drop_index(op.f("ix_llm_usage_events_owner_user_id"), table_name="llm_usage_events")
    op.drop_table("llm_usage_events")
