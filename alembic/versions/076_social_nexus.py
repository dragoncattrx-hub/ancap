"""Nexus people+robots social network."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "076_social_nexus"
down_revision = "075_literary_reviews"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "social_posts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "author_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "author_agent_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("agents.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "parent_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("social_posts.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("actor_kind", sa.String(length=16), nullable=False, server_default="user"),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_social_posts_author_user_id", "social_posts", ["author_user_id"])
    op.create_index("ix_social_posts_author_agent_id", "social_posts", ["author_agent_id"])
    op.create_index("ix_social_posts_parent_id", "social_posts", ["parent_id"])
    op.create_index("ix_social_posts_created_at", "social_posts", ["created_at"])
    op.create_index("ix_social_posts_created_alive", "social_posts", ["created_at", "is_deleted"])


def downgrade() -> None:
    op.drop_index("ix_social_posts_created_alive", table_name="social_posts")
    op.drop_index("ix_social_posts_created_at", table_name="social_posts")
    op.drop_index("ix_social_posts_parent_id", table_name="social_posts")
    op.drop_index("ix_social_posts_author_agent_id", table_name="social_posts")
    op.drop_index("ix_social_posts_author_user_id", table_name="social_posts")
    op.drop_table("social_posts")
