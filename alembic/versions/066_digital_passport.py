"""Digital passport soulbound attestation records."""

from alembic import op
import sqlalchemy as sa

revision = "066_digital_passport"
down_revision = "065_animal_auction"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "digital_passports",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("org_id", sa.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True),
        sa.Column("wallet_address", sa.String(length=42), nullable=False),
        sa.Column("token_id", sa.BigInteger(), nullable=False),
        sa.Column("claim_hash", sa.String(length=66), nullable=False),
        sa.Column("chain_id", sa.String(length=32), nullable=False, server_default="bsc"),
        sa.Column("contract_address", sa.String(length=42), nullable=True),
        sa.Column("tx_hash", sa.String(length=128), nullable=True),
        sa.Column("token_uri", sa.String(length=512), nullable=True),
        sa.Column(
            "status",
            sa.String(length=16),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "nfc_credential_id",
            sa.UUID(as_uuid=False),
            sa.ForeignKey("user_nfc_credentials.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_digital_passports_user_id", "digital_passports", ["user_id"])
    op.create_index("ix_digital_passports_org_id", "digital_passports", ["org_id"])
    op.create_index("ix_digital_passports_wallet_address", "digital_passports", ["wallet_address"])
    op.create_index("ix_digital_passports_token_id", "digital_passports", ["token_id"], unique=True)
    op.create_index("ix_digital_passports_claim_hash", "digital_passports", ["claim_hash"])
    op.create_index("ix_digital_passports_tx_hash", "digital_passports", ["tx_hash"])
    op.create_index("ix_digital_passports_nfc_credential_id", "digital_passports", ["nfc_credential_id"])
    op.create_index("ix_digital_passports_user_org", "digital_passports", ["user_id", "org_id"])


def downgrade() -> None:
    op.drop_index("ix_digital_passports_user_org", table_name="digital_passports")
    op.drop_index("ix_digital_passports_nfc_credential_id", table_name="digital_passports")
    op.drop_index("ix_digital_passports_tx_hash", table_name="digital_passports")
    op.drop_index("ix_digital_passports_claim_hash", table_name="digital_passports")
    op.drop_index("ix_digital_passports_token_id", table_name="digital_passports")
    op.drop_index("ix_digital_passports_wallet_address", table_name="digital_passports")
    op.drop_index("ix_digital_passports_org_id", table_name="digital_passports")
    op.drop_index("ix_digital_passports_user_id", table_name="digital_passports")
    op.drop_table("digital_passports")
