"""Add evolution, tournaments and bug bounty tables.

Revision ID: 034
Revises: 033
Create Date: 2026-04-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "strategy_mutations",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("parent_strategy_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("child_strategy_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("mutation_type", sa.String(length=32), nullable=False),
        sa.Column("diff_spec", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("evaluation_score", sa.Numeric(12, 6), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["child_strategy_id"], ["strategies.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["parent_strategy_id"], ["strategies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_strategy_mutations_parent_strategy_id", "strategy_mutations", ["parent_strategy_id"], unique=False)
    op.create_index("ix_strategy_mutations_child_strategy_id", "strategy_mutations", ["child_strategy_id"], unique=False)
    op.create_index("ix_strategy_mutations_mutation_type", "strategy_mutations", ["mutation_type"], unique=False)
    op.create_index("ix_strategy_mutations_status", "strategy_mutations", ["status"], unique=False)

    op.create_table(
        "tournaments",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("scoring_metric", sa.String(length=64), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tournaments_status", "tournaments", ["status"], unique=False)

    op.create_table(
        "tournament_entries",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("tournament_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("strategy_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("score", sa.Numeric(12, 6), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["agent_id"], ["agents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["strategy_id"], ["strategies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tournament_id"], ["tournaments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tournament_entries_tournament_id", "tournament_entries", ["tournament_id"], unique=False)
    op.create_index("ix_tournament_entries_strategy_id", "tournament_entries", ["strategy_id"], unique=False)
    op.create_index("ix_tournament_entries_agent_id", "tournament_entries", ["agent_id"], unique=False)
    op.create_index("uq_tournament_strategy", "tournament_entries", ["tournament_id", "strategy_id"], unique=True)

    op.create_table(
        "bug_bounty_reports",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("reporter_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("reporter_agent_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=24), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("reward_currency", sa.String(length=16), nullable=True),
        sa.Column("reward_amount", sa.Numeric(38, 18), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["reporter_agent_id"], ["agents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reporter_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_bug_bounty_reports_reporter_user_id", "bug_bounty_reports", ["reporter_user_id"], unique=False)
    op.create_index("ix_bug_bounty_reports_reporter_agent_id", "bug_bounty_reports", ["reporter_agent_id"], unique=False)
    op.create_index("ix_bug_bounty_reports_severity", "bug_bounty_reports", ["severity"], unique=False)
    op.create_index("ix_bug_bounty_reports_status", "bug_bounty_reports", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_bug_bounty_reports_status", table_name="bug_bounty_reports")
    op.drop_index("ix_bug_bounty_reports_severity", table_name="bug_bounty_reports")
    op.drop_index("ix_bug_bounty_reports_reporter_agent_id", table_name="bug_bounty_reports")
    op.drop_index("ix_bug_bounty_reports_reporter_user_id", table_name="bug_bounty_reports")
    op.drop_table("bug_bounty_reports")

    op.drop_index("uq_tournament_strategy", table_name="tournament_entries")
    op.drop_index("ix_tournament_entries_agent_id", table_name="tournament_entries")
    op.drop_index("ix_tournament_entries_strategy_id", table_name="tournament_entries")
    op.drop_index("ix_tournament_entries_tournament_id", table_name="tournament_entries")
    op.drop_table("tournament_entries")

    op.drop_index("ix_tournaments_status", table_name="tournaments")
    op.drop_table("tournaments")

    op.drop_index("ix_strategy_mutations_status", table_name="strategy_mutations")
    op.drop_index("ix_strategy_mutations_mutation_type", table_name="strategy_mutations")
    op.drop_index("ix_strategy_mutations_child_strategy_id", table_name="strategy_mutations")
    op.drop_index("ix_strategy_mutations_parent_strategy_id", table_name="strategy_mutations")
    op.drop_table("strategy_mutations")

