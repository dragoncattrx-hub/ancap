"""Widen OTC rail + ownership certificates table."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "063_title_ownership"
down_revision = "062_exchange_office"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "acp_otc_intake_orders",
        "rail",
        existing_type=sa.String(length=16),
        type_=sa.String(length=32),
        existing_nullable=False,
    )
    op.create_table(
        "acp_ownership_certificates",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("owner_user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("contract_code", sa.String(32), nullable=False),
        sa.Column("asset_class", sa.String(64), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("subject_uri", sa.String(512), nullable=True),
        sa.Column("jurisdiction", sa.String(64), nullable=True),
        sa.Column("document_hash", sa.String(128), nullable=False),
        sa.Column("document_uri", sa.String(512), nullable=True),
        sa.Column("face_value_acp", sa.Numeric(38, 18), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="issued"),
        sa.Column("transfer_code_hash", sa.String(64), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("contract_code", name="ux_ownership_contract_code"),
    )
    op.create_index("ix_ownership_owner_created", "acp_ownership_certificates", ["owner_user_id", "created_at"])
    op.create_index("ix_ownership_asset_class", "acp_ownership_certificates", ["asset_class"])
    op.create_index("ix_ownership_status", "acp_ownership_certificates", ["status"])
    op.create_index("ix_ownership_transfer_hash", "acp_ownership_certificates", ["transfer_code_hash"])


def downgrade() -> None:
    op.drop_index("ix_ownership_transfer_hash", table_name="acp_ownership_certificates")
    op.drop_index("ix_ownership_status", table_name="acp_ownership_certificates")
    op.drop_index("ix_ownership_asset_class", table_name="acp_ownership_certificates")
    op.drop_index("ix_ownership_owner_created", table_name="acp_ownership_certificates")
    op.drop_table("acp_ownership_certificates")
    op.alter_column(
        "acp_otc_intake_orders",
        "rail",
        existing_type=sa.String(length=32),
        type_=sa.String(length=16),
        existing_nullable=False,
    )
