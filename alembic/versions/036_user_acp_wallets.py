"""Add per-user ACP wallets with encrypted mnemonics.

Revision ID: 036
Revises: 035
Create Date: 2026-04-29
"""
from alembic import op
import sqlalchemy as sa


revision = "036"
down_revision = "035"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_acp_wallets",
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("address", sa.String(length=128), nullable=False),
        sa.Column("encrypted_mnemonic", sa.Text(), nullable=False),
        sa.Column("salt_b64", sa.Text(), nullable=False),
        sa.Column("nonce_b64", sa.Text(), nullable=False),
        sa.Column("derivation_path", sa.String(length=128), nullable=False, server_default="m/44'/0'/0'/0/0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("address"),
    )
    op.create_index(op.f("ix_user_acp_wallets_address"), "user_acp_wallets", ["address"], unique=False)
    op.alter_column("user_acp_wallets", "derivation_path", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_acp_wallets_address"), table_name="user_acp_wallets")
    op.drop_table("user_acp_wallets")

