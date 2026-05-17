"""Add recovery-ready envelope fields for ACP wallets.

Revision ID: 043_acp_wallet_recovery_ready
Revises: 042_workflow_runs
Create Date: 2026-05-16
"""

from alembic import op
import sqlalchemy as sa


revision = "043_acp_wallet_recovery_ready"
down_revision = "042_workflow_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_acp_wallets", sa.Column("secret_box_version", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("user_acp_wallets", sa.Column("secret_wrapped_b64", sa.Text(), nullable=True))
    op.add_column("user_acp_wallets", sa.Column("secret_wrap_salt_b64", sa.Text(), nullable=True))
    op.add_column("user_acp_wallets", sa.Column("secret_wrap_nonce_b64", sa.Text(), nullable=True))
    op.add_column("user_acp_wallets", sa.Column("recovery_secret_box_b64", sa.Text(), nullable=True))
    op.add_column("user_acp_wallets", sa.Column("recovery_secret_nonce_b64", sa.Text(), nullable=True))
    op.add_column("user_acp_wallets", sa.Column("recovery_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("user_acp_wallets", "recovery_enabled")
    op.drop_column("user_acp_wallets", "recovery_secret_nonce_b64")
    op.drop_column("user_acp_wallets", "recovery_secret_box_b64")
    op.drop_column("user_acp_wallets", "secret_wrap_nonce_b64")
    op.drop_column("user_acp_wallets", "secret_wrap_salt_b64")
    op.drop_column("user_acp_wallets", "secret_wrapped_b64")
    op.drop_column("user_acp_wallets", "secret_box_version")
