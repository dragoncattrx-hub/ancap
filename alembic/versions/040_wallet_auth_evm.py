"""Add EVM wallet auth tables.

Revision ID: 040_wallet_auth_evm
Revises: 039
Create Date: 2026-05-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "040_wallet_auth_evm"
down_revision = "039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_evm_wallets",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("wallet_address", sa.String(length=66), nullable=False),
        sa.Column("chain_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
        sa.UniqueConstraint("wallet_address"),
    )
    op.create_index(op.f("ix_user_evm_wallets_wallet_address"), "user_evm_wallets", ["wallet_address"], unique=False)

    op.create_table(
        "wallet_auth_challenges",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("wallet_address", sa.String(length=66), nullable=False),
        sa.Column("chain_id", sa.Integer(), nullable=True),
        sa.Column("nonce", sa.String(length=128), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nonce"),
    )
    op.create_index(op.f("ix_wallet_auth_challenges_wallet_address"), "wallet_auth_challenges", ["wallet_address"], unique=False)
    op.create_index(op.f("ix_wallet_auth_challenges_nonce"), "wallet_auth_challenges", ["nonce"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_wallet_auth_challenges_nonce"), table_name="wallet_auth_challenges")
    op.drop_index(op.f("ix_wallet_auth_challenges_wallet_address"), table_name="wallet_auth_challenges")
    op.drop_table("wallet_auth_challenges")

    op.drop_index(op.f("ix_user_evm_wallets_wallet_address"), table_name="user_evm_wallets")
    op.drop_table("user_evm_wallets")
