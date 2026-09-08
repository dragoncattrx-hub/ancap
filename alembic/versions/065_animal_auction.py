"""FAUNA companion-animal auction lots and ACP escrow bids."""

from alembic import op
import sqlalchemy as sa

revision = "065_animal_auction"
down_revision = "064_space_auction"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "animal_auction_lots",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "seller_user_id",
            sa.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("species", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("breed", sa.String(length=80), nullable=False),
        sa.Column("age_months", sa.Integer(), nullable=True),
        sa.Column("blurb", sa.Text(), nullable=False),
        sa.Column("starting_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="live"),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_animal_auction_lots_seller_user_id", "animal_auction_lots", ["seller_user_id"])
    op.create_index("ix_animal_auction_lots_species", "animal_auction_lots", ["species"])
    op.create_index("ix_animal_auction_lots_status", "animal_auction_lots", ["status"])

    op.create_table(
        "animal_auction_bids",
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
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_animal_auction_bids_lot_id", "animal_auction_bids", ["lot_id"])
    op.create_index("ix_animal_auction_bids_bidder_user_id", "animal_auction_bids", ["bidder_user_id"])
    op.create_index("ix_animal_auction_bids_status", "animal_auction_bids", ["status"])
    op.create_index("ix_animal_auction_bids_lot_created", "animal_auction_bids", ["lot_id", "created_at"])
    op.create_index("ix_animal_auction_bids_lot_amount", "animal_auction_bids", ["lot_id", "amount_acp"])


def downgrade() -> None:
    op.drop_index("ix_animal_auction_bids_lot_amount", table_name="animal_auction_bids")
    op.drop_index("ix_animal_auction_bids_lot_created", table_name="animal_auction_bids")
    op.drop_index("ix_animal_auction_bids_status", table_name="animal_auction_bids")
    op.drop_index("ix_animal_auction_bids_bidder_user_id", table_name="animal_auction_bids")
    op.drop_index("ix_animal_auction_bids_lot_id", table_name="animal_auction_bids")
    op.drop_table("animal_auction_bids")
    op.drop_index("ix_animal_auction_lots_status", table_name="animal_auction_lots")
    op.drop_index("ix_animal_auction_lots_species", table_name="animal_auction_lots")
    op.drop_index("ix_animal_auction_lots_seller_user_id", table_name="animal_auction_lots")
    op.drop_table("animal_auction_lots")
