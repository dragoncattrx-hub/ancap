"""Add search vector columns and GIN indexes for full-text search.

Searches across: agents, strategies, workflow run records.
Listings are searched via their linked Strategy.
"""
from alembic import op
import sqlalchemy as sa


revision = "048_add_search_vectors"
down_revision = "047_llm_usage_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agent: display_name + metadata bio
    op.add_column(
        "agents",
        sa.Column("search_vector", sa.Text(), nullable=True),
    )
    op.execute(
        "UPDATE agents SET search_vector = coalesce(display_name, '') WHERE search_vector IS NULL"
    )
    op.execute(
        "CREATE INDEX ix_agents_search ON agents USING GIN(to_tsvector('english', search_vector))"
    )

    # Strategy: name + description
    op.add_column(
        "strategies",
        sa.Column("search_vector", sa.Text(), nullable=True),
    )
    op.execute(
        "UPDATE strategies SET search_vector = coalesce(name, '') || ' ' || coalesce(description, '') WHERE search_vector IS NULL"
    )
    op.execute(
        "CREATE INDEX ix_strategies_search ON strategies USING GIN(to_tsvector('english', search_vector))"
    )

    # Workflow run records: title + slug
    op.add_column(
        "workflow_runs",
        sa.Column("search_vector", sa.Text(), nullable=True),
    )
    op.execute(
        "UPDATE workflow_runs SET search_vector = coalesce(title, '') || ' ' || coalesce(workflow_slug, '') WHERE search_vector IS NULL"
    )
    op.execute(
        "CREATE INDEX ix_workflow_runs_search ON workflow_runs USING GIN(to_tsvector('english', search_vector))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_workflow_runs_search")
    op.drop_column("workflow_runs", "search_vector")
    op.execute("DROP INDEX IF EXISTS ix_strategies_search")
    op.drop_column("strategies", "search_vector")
    op.execute("DROP INDEX IF EXISTS ix_agents_search")
    op.drop_column("agents", "search_vector")
