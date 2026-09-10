"""R13 lunar land parcel registry + interest orders.

Revision ID: 070_lunar_land
Revises: 069_sacp_stablecoin
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "070_lunar_land"
down_revision = "069_sacp_stablecoin"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lunar_parcels",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("parcel_code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("lat_deg", sa.Float(), nullable=False),
        sa.Column("lon_deg", sa.Float(), nullable=False),
        sa.Column("area_km2", sa.Float(), nullable=False),
        sa.Column("list_price_acp", sa.Numeric(36, 18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="listed"),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="catalog"),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("parcel_code", name="uq_lunar_parcels_code"),
    )
    op.create_index("ix_lunar_parcels_status", "lunar_parcels", ["status"])
    op.create_index("ix_lunar_parcels_region", "lunar_parcels", ["region"])

    op.create_table(
        "lunar_interest_orders",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parcel_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("lunar_parcels.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("budget_acp", sa.Numeric(36, 18), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_lunar_interest_owner_created", "lunar_interest_orders", ["owner_user_id", "created_at"])
    op.create_index("ix_lunar_interest_parcel", "lunar_interest_orders", ["parcel_id"])
    op.create_index("ix_lunar_interest_status", "lunar_interest_orders", ["status"])


def downgrade() -> None:
    op.drop_index("ix_lunar_interest_status", table_name="lunar_interest_orders")
    op.drop_index("ix_lunar_interest_parcel", table_name="lunar_interest_orders")
    op.drop_index("ix_lunar_interest_owner_created", table_name="lunar_interest_orders")
    op.drop_table("lunar_interest_orders")
    op.drop_index("ix_lunar_parcels_region", table_name="lunar_parcels")
    op.drop_index("ix_lunar_parcels_status", table_name="lunar_parcels")
    op.drop_table("lunar_parcels")
