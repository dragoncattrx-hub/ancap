"""Galaxy auction bids for stars, planets, and satellites."""

from alembic import op
import sqlalchemy as sa

revision = "064_space_auction"
down_revision = "063_title_ownership"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "space_auction_bids",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("lot_id", sa.String(length=64), nullable=False),
        sa.Column(
            "bidder_user_id",
            sa.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="placed"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_space_auction_bids_lot_id", "space_auction_bids", ["lot_id"])
    op.create_index("ix_space_auction_bids_bidder_user_id", "space_auction_bids", ["bidder_user_id"])
    op.create_index("ix_space_auction_bids_status", "space_auction_bids", ["status"])
    op.create_index("ix_space_auction_bids_lot_created", "space_auction_bids", ["lot_id", "created_at"])
    op.create_index("ix_space_auction_bids_lot_amount", "space_auction_bids", ["lot_id", "amount_acp"])


def downgrade() -> None:
    op.drop_index("ix_space_auction_bids_lot_amount", table_name="space_auction_bids")
    op.drop_index("ix_space_auction_bids_lot_created", table_name="space_auction_bids")
    op.drop_index("ix_space_auction_bids_status", table_name="space_auction_bids")
    op.drop_index("ix_space_auction_bids_bidder_user_id", table_name="space_auction_bids")
    op.drop_index("ix_space_auction_bids_lot_id", table_name="space_auction_bids")
    op.drop_table("space_auction_bids")
