"""Currency defaults: USD for pricing, ACP for fees.

Revision ID: c5df567b5ed0
Revises: 029
Create Date: 2026-03-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5df567b5ed0"
down_revision: Union[str, None] = "029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Server-side defaults (DB-level) for pricing currencies.
    op.alter_column("contracts", "currency", server_default=sa.text("'USD'"))
    op.alter_column("contract_milestones", "currency", server_default=sa.text("'USD'"))

    # Backfill legacy test currency where it represented USD.
    op.execute("UPDATE contracts SET currency='USD' WHERE currency='VUSD'")
    op.execute("UPDATE contract_milestones SET currency='USD' WHERE currency='VUSD'")


def downgrade() -> None:
    op.alter_column("contracts", "currency", server_default=sa.text("'VUSD'"))
    op.alter_column("contract_milestones", "currency", server_default=sa.text("'VUSD'"))
    op.execute("UPDATE contracts SET currency='VUSD' WHERE currency='USD'")
    op.execute("UPDATE contract_milestones SET currency='VUSD' WHERE currency='USD'")

