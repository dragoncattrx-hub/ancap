"""Auction escrow chain columns + TECH auction tables.

Revision ID: 068_auction_escrow_tech
Revises: 067_insurance_arena
"""

from alembic import op
import sqlalchemy as sa

revision = "068_auction_escrow_tech"
down_revision = "067_insurance_arena"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("animal_auction_lots", sa.Column("tx_hash", sa.String(length=128), nullable=True))
    op.add_column("animal_auction_lots", sa.Column("contract_address", sa.String(length=42), nullable=True))
    op.add_column("animal_auction_lots", sa.Column("chain_id", sa.String(length=32), nullable=True))
    op.create_index("ix_animal_auction_lots_tx_hash", "animal_auction_lots", ["tx_hash"])

    op.add_column("animal_auction_bids", sa.Column("tx_hash", sa.String(length=128), nullable=True))
    op.create_index("ix_animal_auction_bids_tx_hash", "animal_auction_bids", ["tx_hash"])

    op.create_table(
        "tech_auction_lots",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("seller_user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("stack", sa.String(length=160), nullable=False),
        sa.Column("blurb", sa.Text(), nullable=False),
        sa.Column("starting_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="live"),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=True),
        sa.Column("contract_address", sa.String(length=42), nullable=True),
        sa.Column("chain_id", sa.String(length=32), nullable=True),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_tech_auction_lots_seller", "tech_auction_lots", ["seller_user_id"])
    op.create_index("ix_tech_auction_lots_category", "tech_auction_lots", ["category"])
    op.create_index("ix_tech_auction_lots_status", "tech_auction_lots", ["status"])

    op.create_table(
        "tech_auction_bids",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("lot_id", sa.String(length=64), nullable=False),
        sa.Column("bidder_user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="placed"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_tech_auction_bids_lot_created", "tech_auction_bids", ["lot_id", "created_at"])
    op.create_index("ix_tech_auction_bids_lot_amount", "tech_auction_bids", ["lot_id", "amount_acp"])
    op.create_index("ix_tech_auction_bids_bidder", "tech_auction_bids", ["bidder_user_id"])


def downgrade() -> None:
    op.drop_table("tech_auction_bids")
    op.drop_table("tech_auction_lots")
    op.drop_index("ix_animal_auction_bids_tx_hash", table_name="animal_auction_bids")
    op.drop_column("animal_auction_bids", "tx_hash")
    op.drop_index("ix_animal_auction_lots_tx_hash", table_name="animal_auction_lots")
    op.drop_column("animal_auction_lots", "chain_id")
    op.drop_column("animal_auction_lots", "contract_address")
    op.drop_column("animal_auction_lots", "tx_hash")
