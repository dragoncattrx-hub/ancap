"""FLORA flower auction lots and ACP escrow bids (qty 1…∞).

Revision ID: 078_flora_auction
Revises: 077_auction_deal_pqc
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "078_flora_auction"
down_revision = "077_auction_deal_pqc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "flora_auction_lots",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "seller_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("form", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("variety", sa.String(length=120), nullable=False),
        sa.Column("quantity", sa.BigInteger(), nullable=True),
        sa.Column("blurb", sa.Text(), nullable=False),
        sa.Column("starting_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="live"),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=True),
        sa.Column("contract_address", sa.String(length=42), nullable=True),
        sa.Column("chain_id", sa.String(length=32), nullable=True, server_default="bsc"),
        sa.Column("image_href", sa.String(length=160), nullable=True),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_flora_auction_lots_seller_user_id", "flora_auction_lots", ["seller_user_id"])
    op.create_index("ix_flora_auction_lots_form", "flora_auction_lots", ["form"])
    op.create_index("ix_flora_auction_lots_status", "flora_auction_lots", ["status"])

    op.create_table(
        "flora_auction_bids",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("lot_id", sa.String(length=64), nullable=False),
        sa.Column(
            "bidder_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="placed"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=True),
        sa.Column("deal_cipher_id", sa.String(length=96), nullable=True),
        sa.Column("deal_envelope_b64", sa.Text(), nullable=True),
        sa.Column("deal_content_hash", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_flora_auction_bids_lot_id", "flora_auction_bids", ["lot_id"])
    op.create_index("ix_flora_auction_bids_bidder_user_id", "flora_auction_bids", ["bidder_user_id"])
    op.create_index("ix_flora_auction_bids_status", "flora_auction_bids", ["status"])
    op.create_index("ix_flora_auction_bids_lot_created", "flora_auction_bids", ["lot_id", "created_at"])
    op.create_index("ix_flora_auction_bids_lot_amount", "flora_auction_bids", ["lot_id", "amount_acp"])


def downgrade() -> None:
    op.drop_index("ix_flora_auction_bids_lot_amount", table_name="flora_auction_bids")
    op.drop_index("ix_flora_auction_bids_lot_created", table_name="flora_auction_bids")
    op.drop_index("ix_flora_auction_bids_status", table_name="flora_auction_bids")
    op.drop_index("ix_flora_auction_bids_bidder_user_id", table_name="flora_auction_bids")
    op.drop_index("ix_flora_auction_bids_lot_id", table_name="flora_auction_bids")
    op.drop_table("flora_auction_bids")
    op.drop_index("ix_flora_auction_lots_status", table_name="flora_auction_lots")
    op.drop_index("ix_flora_auction_lots_form", table_name="flora_auction_lots")
    op.drop_index("ix_flora_auction_lots_seller_user_id", table_name="flora_auction_lots")
    op.drop_table("flora_auction_lots")
