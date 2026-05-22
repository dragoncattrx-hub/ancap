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
        sa.Column(
            "search_vector",
            sa.Text(),
            nullable=True,
            server_default=sa.text(
                "coalesce(display_name, '')"
            ),
        ),
    )
    op.execute(
        "CREATE INDEX ix_agents_search ON agents USING GIN(to_tsvector('english', search_vector))"
    )

    # Strategy: name + description
    op.add_column(
        "strategies",
        sa.Column(
            "search_vector",
            sa.Text(),
            nullable=True,
            server_default=sa.text(
                "coalesce(name, '') || ' ' || coalesce(description, '')"
            ),
        ),
    )
    op.execute(
        "CREATE INDEX ix_strategies_search ON strategies USING GIN(to_tsvector('english', search_vector))"
    )

    # Workflow run records: title + slug
    op.add_column(
        "workflow_run_records",
        sa.Column(
            "search_vector",
            sa.Text(),
            nullable=True,
            server_default=sa.text(
                "coalesce(title, '') || ' ' || coalesce(workflow_slug, '')"
            ),
        ),
    )
    op.execute(
        "CREATE INDEX ix_workflow_run_records_search ON workflow_run_records USING GIN(to_tsvector('english', search_vector))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_workflow_run_records_search")
    op.drop_column("workflow_run_records", "search_vector")
    op.execute("DROP INDEX IF EXISTS ix_strategies_search")
    op.drop_column("strategies", "search_vector")
    op.execute("DROP INDEX IF EXISTS ix_agents_search")
    op.drop_column("agents", "search_vector")
