"""Add workflow_runs table for monetized workflow store.

Revision ID: 042_workflow_runs
Revises: 041_auth_mail_linking
Create Date: 2026-05-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "042_workflow_runs"
down_revision = "041_auth_mail_linking"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "workflow_runs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("workflow_slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("quoted_amount", sa.Numeric(36, 18), nullable=False),
        sa.Column("quoted_currency", sa.String(length=10), nullable=False),
        sa.Column("payment_currency", sa.String(length=10), nullable=False),
        sa.Column("unlock_full_result", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("inputs_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("preview_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("receipt_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workflow_runs_owner_user_id"), "workflow_runs", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_workflow_runs_workflow_slug"), "workflow_runs", ["workflow_slug"], unique=False)
    op.create_index(op.f("ix_workflow_runs_category"), "workflow_runs", ["category"], unique=False)
    op.create_index(op.f("ix_workflow_runs_status"), "workflow_runs", ["status"], unique=False)
    op.create_index("ix_workflow_runs_owner_created", "workflow_runs", ["owner_user_id", "created_at"], unique=False)
    op.create_index("ix_workflow_runs_owner_slug", "workflow_runs", ["owner_user_id", "workflow_slug"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_workflow_runs_owner_slug", table_name="workflow_runs")
    op.drop_index("ix_workflow_runs_owner_created", table_name="workflow_runs")
    op.drop_index(op.f("ix_workflow_runs_status"), table_name="workflow_runs")
    op.drop_index(op.f("ix_workflow_runs_category"), table_name="workflow_runs")
    op.drop_index(op.f("ix_workflow_runs_workflow_slug"), table_name="workflow_runs")
    op.drop_index(op.f("ix_workflow_runs_owner_user_id"), table_name="workflow_runs")
    op.drop_table("workflow_runs")
