"""ACP explorer full-chain index tables.

Revision ID: 086_acp_explorer_index
Revises: 085_ancap_dating
"""

from alembic import op
import sqlalchemy as sa

revision = "086_acp_explorer_index"
down_revision = "085_ancap_dating"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "acp_explorer_indexer_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("last_scanned_height", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_scanned_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "acp_explorer_blocks",
        sa.Column("height", sa.Integer(), primary_key=True),
        sa.Column("hash", sa.String(length=128), nullable=False),
        sa.Column("time", sa.BigInteger(), nullable=True),
        sa.Column("tx_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("size", sa.Integer(), nullable=True),
    )
    op.create_index("ix_acp_explorer_blocks_hash", "acp_explorer_blocks", ["hash"])

    op.create_table(
        "acp_explorer_txs",
        sa.Column("txid", sa.String(length=128), primary_key=True),
        sa.Column("block_height", sa.Integer(), nullable=True),
        sa.Column("block_hash", sa.String(length=128), nullable=True),
        sa.Column("block_time", sa.BigInteger(), nullable=True),
        sa.Column("fee_units", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("input_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("output_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_acp_explorer_txs_block_height", "acp_explorer_txs", ["block_height"])

    op.create_table(
        "acp_explorer_address_events",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("address", sa.String(length=128), nullable=False),
        sa.Column("txid", sa.String(length=128), nullable=False),
        sa.Column("direction", sa.String(length=8), nullable=False),
        sa.Column("amount_units", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("vout", sa.Integer(), nullable=True),
        sa.Column("vin", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
    )
    op.create_index("ix_acp_explorer_address_events_address", "acp_explorer_address_events", ["address"])
    op.create_index("ix_acp_explorer_address_events_txid", "acp_explorer_address_events", ["txid"])
    op.create_index("ix_acp_explorer_address_events_height", "acp_explorer_address_events", ["height"])
    op.create_index(
        "ix_acp_explorer_addr_events_addr_height",
        "acp_explorer_address_events",
        ["address", "height"],
    )


def downgrade() -> None:
    op.drop_index("ix_acp_explorer_addr_events_addr_height", table_name="acp_explorer_address_events")
    op.drop_index("ix_acp_explorer_address_events_height", table_name="acp_explorer_address_events")
    op.drop_index("ix_acp_explorer_address_events_txid", table_name="acp_explorer_address_events")
    op.drop_index("ix_acp_explorer_address_events_address", table_name="acp_explorer_address_events")
    op.drop_table("acp_explorer_address_events")
    op.drop_index("ix_acp_explorer_txs_block_height", table_name="acp_explorer_txs")
    op.drop_table("acp_explorer_txs")
    op.drop_index("ix_acp_explorer_blocks_hash", table_name="acp_explorer_blocks")
    op.drop_table("acp_explorer_blocks")
    op.drop_table("acp_explorer_indexer_state")
