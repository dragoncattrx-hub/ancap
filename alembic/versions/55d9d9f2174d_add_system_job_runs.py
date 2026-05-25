"""Add system job runs queue for async jobs tick retries.

Revision ID: 55d9d9f2174d
Revises: 911774c4bec4
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "55d9d9f2174d"
down_revision = "911774c4bec4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "system_job_runs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("job_name", sa.String(length=64), nullable=False),
        sa.Column("trigger_source", sa.String(length=32), nullable=False, server_default="api"),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="queued"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("result_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_system_job_runs_job_status_created",
        "system_job_runs",
        ["job_name", "status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_system_job_runs_job_retry",
        "system_job_runs",
        ["job_name", "status", "next_retry_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_system_job_runs_job_retry", table_name="system_job_runs")
    op.drop_index("ix_system_job_runs_job_status_created", table_name="system_job_runs")
    op.drop_table("system_job_runs")
