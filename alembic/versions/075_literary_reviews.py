"""R15: literary auction + service reviews rating.

Revision ID: 075_literary_reviews
Revises: 074_perimeter_cleanup
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "075_literary_reviews"
down_revision = "074_perimeter_cleanup"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "literary_auction_lots",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "seller_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("genre", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("author", sa.String(length=120), nullable=False),
        sa.Column("blurb", sa.Text(), nullable=False),
        sa.Column("starting_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="live"),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("tx_hash", sa.String(length=128), nullable=True),
        sa.Column("contract_address", sa.String(length=42), nullable=True),
        sa.Column("chain_id", sa.String(length=32), nullable=True, server_default="bsc"),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("review_target_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_lit_auction_lots_seller", "literary_auction_lots", ["seller_user_id"])
    op.create_index("ix_lit_auction_lots_genre", "literary_auction_lots", ["genre"])
    op.create_index("ix_lit_auction_lots_status", "literary_auction_lots", ["status"])
    op.create_index("ix_lit_auction_lots_tx", "literary_auction_lots", ["tx_hash"])

    op.create_table(
        "literary_auction_bids",
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
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_lit_auction_bids_lot", "literary_auction_bids", ["lot_id"])
    op.create_index("ix_lit_auction_bids_bidder", "literary_auction_bids", ["bidder_user_id"])
    op.create_index("ix_lit_auction_bids_status", "literary_auction_bids", ["status"])
    op.create_index("ix_literary_auction_bids_lot_created", "literary_auction_bids", ["lot_id", "created_at"])
    op.create_index("ix_literary_auction_bids_lot_amount", "literary_auction_bids", ["lot_id", "amount_acp"])

    op.add_column("reviews", sa.Column("rating", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("reviews", "rating")
    op.drop_index("ix_literary_auction_bids_lot_amount", table_name="literary_auction_bids")
    op.drop_index("ix_literary_auction_bids_lot_created", table_name="literary_auction_bids")
    op.drop_index("ix_lit_auction_bids_status", table_name="literary_auction_bids")
    op.drop_index("ix_lit_auction_bids_bidder", table_name="literary_auction_bids")
    op.drop_index("ix_lit_auction_bids_lot", table_name="literary_auction_bids")
    op.drop_table("literary_auction_bids")
    op.drop_index("ix_lit_auction_lots_tx", table_name="literary_auction_lots")
    op.drop_index("ix_lit_auction_lots_status", table_name="literary_auction_lots")
    op.drop_index("ix_lit_auction_lots_genre", table_name="literary_auction_lots")
    op.drop_index("ix_lit_auction_lots_seller", table_name="literary_auction_lots")
    op.drop_table("literary_auction_lots")
