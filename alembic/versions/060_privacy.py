"""ACP privacy: view wire + unlinkable receive subaddresses.

Revision ID: 060_privacy
Revises: 059_aeterna
Create Date: 2026-09-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "060_privacy"
down_revision = "059_aeterna"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_acp_wallets",
        sa.Column("view_pubkey_wire_hex", sa.Text(), nullable=True),
    )
    op.add_column(
        "user_acp_wallets",
        sa.Column("privacy_next_index", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_table(
        "user_acp_privacy_addresses",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("address", sa.String(128), nullable=False),
        sa.Column("sub_index", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("address", name="uq_user_acp_privacy_addresses_address"),
        sa.UniqueConstraint("user_id", "sub_index", name="uq_user_acp_privacy_addresses_user_index"),
    )
    op.create_index("ix_user_acp_privacy_addresses_user_id", "user_acp_privacy_addresses", ["user_id"])
    op.create_index("ix_user_acp_privacy_addresses_address", "user_acp_privacy_addresses", ["address"])


def downgrade() -> None:
    op.drop_index("ix_user_acp_privacy_addresses_address", table_name="user_acp_privacy_addresses")
    op.drop_index("ix_user_acp_privacy_addresses_user_id", table_name="user_acp_privacy_addresses")
    op.drop_table("user_acp_privacy_addresses")
    op.drop_column("user_acp_wallets", "privacy_next_index")
    op.drop_column("user_acp_wallets", "view_pubkey_wire_hex")
