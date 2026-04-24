"""Add decision_logs table for explainable gating.

Revision ID: 033
Revises: 032
Create Date: 2026-04-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "decision_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("decision", sa.String(length=32), nullable=False),
        sa.Column("reason_code", sa.String(length=64), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("scope", sa.String(length=64), nullable=False),
        sa.Column("actor_type", sa.String(length=32), nullable=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("subject_type", sa.String(length=32), nullable=True),
        sa.Column("subject_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("threshold_value", sa.String(length=64), nullable=True),
        sa.Column("actual_value", sa.String(length=64), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_decision_logs_decision", "decision_logs", ["decision"], unique=False)
    op.create_index("ix_decision_logs_reason_code", "decision_logs", ["reason_code"], unique=False)
    op.create_index("ix_decision_logs_scope", "decision_logs", ["scope"], unique=False)
    op.create_index("ix_decision_logs_actor_type", "decision_logs", ["actor_type"], unique=False)
    op.create_index("ix_decision_logs_actor_id", "decision_logs", ["actor_id"], unique=False)
    op.create_index("ix_decision_logs_subject_type", "decision_logs", ["subject_type"], unique=False)
    op.create_index("ix_decision_logs_subject_id", "decision_logs", ["subject_id"], unique=False)
    op.create_index("ix_decision_logs_created_at", "decision_logs", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_decision_logs_created_at", table_name="decision_logs")
    op.drop_index("ix_decision_logs_subject_id", table_name="decision_logs")
    op.drop_index("ix_decision_logs_subject_type", table_name="decision_logs")
    op.drop_index("ix_decision_logs_actor_id", table_name="decision_logs")
    op.drop_index("ix_decision_logs_actor_type", table_name="decision_logs")
    op.drop_index("ix_decision_logs_scope", table_name="decision_logs")
    op.drop_index("ix_decision_logs_reason_code", table_name="decision_logs")
    op.drop_index("ix_decision_logs_decision", table_name="decision_logs")
    op.drop_table("decision_logs")

