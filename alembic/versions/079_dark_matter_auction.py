"""Dark matter auction bids (seed lots in service memory).

Revision ID: 079_dark_matter_auction
Revises: 078_flora_auction
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "079_dark_matter_auction"
down_revision = "078_flora_auction"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dark_matter_auction_bids",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("lot_id", sa.String(length=64), nullable=False),
        sa.Column("bidder_user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="placed"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("deal_cipher_id", sa.String(length=96), nullable=True),
        sa.Column("deal_envelope_b64", sa.Text(), nullable=True),
        sa.Column("deal_content_hash", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_dark_matter_auction_bids_lot_id", "dark_matter_auction_bids", ["lot_id"])
    op.create_index("ix_dark_matter_auction_bids_bidder_user_id", "dark_matter_auction_bids", ["bidder_user_id"])
    op.create_index("ix_dark_matter_auction_bids_status", "dark_matter_auction_bids", ["status"])
    op.create_index("ix_dark_matter_auction_bids_lot_created", "dark_matter_auction_bids", ["lot_id", "created_at"])
    op.create_index("ix_dark_matter_auction_bids_lot_amount", "dark_matter_auction_bids", ["lot_id", "amount_acp"])


def downgrade() -> None:
    op.drop_index("ix_dark_matter_auction_bids_lot_amount", table_name="dark_matter_auction_bids")
    op.drop_index("ix_dark_matter_auction_bids_lot_created", table_name="dark_matter_auction_bids")
    op.drop_index("ix_dark_matter_auction_bids_status", table_name="dark_matter_auction_bids")
    op.drop_index("ix_dark_matter_auction_bids_bidder_user_id", table_name="dark_matter_auction_bids")
    op.drop_index("ix_dark_matter_auction_bids_lot_id", table_name="dark_matter_auction_bids")
    op.drop_table("dark_matter_auction_bids")
