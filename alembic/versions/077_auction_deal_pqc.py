"""R16: seal auction deals with X-Wing draft-10 PQC envelopes.

Revision ID: 077_auction_deal_pqc
Revises: 076_social_nexus
"""

from alembic import op
import sqlalchemy as sa

revision = "077_auction_deal_pqc"
down_revision = "076_social_nexus"
branch_labels = None
depends_on = None

_TABLES = (
    "tech_auction_bids",
    "literary_auction_bids",
    "animal_auction_bids",
    "space_auction_bids",
)


def upgrade() -> None:
    for table in _TABLES:
        op.add_column(table, sa.Column("deal_cipher_id", sa.String(length=96), nullable=True))
        op.add_column(table, sa.Column("deal_envelope_b64", sa.Text(), nullable=True))
        op.add_column(table, sa.Column("deal_content_hash", sa.String(length=120), nullable=True))


def downgrade() -> None:
    for table in reversed(_TABLES):
        op.drop_column(table, "deal_content_hash")
        op.drop_column(table, "deal_envelope_b64")
        op.drop_column(table, "deal_cipher_id")
