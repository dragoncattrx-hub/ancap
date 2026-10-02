"""ANCAP Dating tables.

Revision ID: 085_ancap_dating
Revises: 084_wacp_liquidity_ops
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "085_ancap_dating"
down_revision = "084_wacp_liquidity_ops"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dating_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("age_attested_18", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("visibility", sa.String(length=24), nullable=False, server_default="nearby"),
        sa.Column("lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("lon", sa.Numeric(10, 7), nullable=True),
        sa.Column("mesh_peer_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_dating_profiles_user_id", "dating_profiles", ["user_id"], unique=True)

    op.create_table(
        "dating_access_points",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("creator_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("lat", sa.Numeric(10, 7), nullable=False),
        sa.Column("lon", sa.Numeric(10, 7), nullable=False),
        sa.Column("ble_service_hint", sa.String(length=64), nullable=False, server_default="a11c0001-a11c-4a7e-9c01-444154494e47"),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_dating_access_points_creator", "dating_access_points", ["creator_user_id"])

    op.create_table(
        "dating_likes",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("from_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("to_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_dating_likes_from_to", "dating_likes", ["from_user_id", "to_user_id"], unique=True)

    op.create_table(
        "dating_matches",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_a_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_b_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_dating_matches_users", "dating_matches", ["user_a_id", "user_b_id"], unique=True)

    op.create_table(
        "dating_messages",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("match_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("dating_matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_dating_messages_match", "dating_messages", ["match_id"])

    op.create_table(
        "dating_reports",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("reporter_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("dating_reports")
    op.drop_index("ix_dating_messages_match", table_name="dating_messages")
    op.drop_table("dating_messages")
    op.drop_index("ix_dating_matches_users", table_name="dating_matches")
    op.drop_table("dating_matches")
    op.drop_index("ix_dating_likes_from_to", table_name="dating_likes")
    op.drop_table("dating_likes")
    op.drop_index("ix_dating_access_points_creator", table_name="dating_access_points")
    op.drop_table("dating_access_points")
    op.drop_index("ix_dating_profiles_user_id", table_name="dating_profiles")
    op.drop_table("dating_profiles")
