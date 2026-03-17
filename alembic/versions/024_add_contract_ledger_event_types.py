"""Add ledger event types for contracts escrow/payout.

Revision ID: 024
Revises: 023
Create Date: 2026-03-17
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Postgres enum created in 001_initial.py as name="ledgereventtypeenum"
    op.execute("ALTER TYPE ledgereventtypeenum ADD VALUE IF NOT EXISTS 'contract_escrow'")
    op.execute("ALTER TYPE ledgereventtypeenum ADD VALUE IF NOT EXISTS 'contract_payout'")


def downgrade() -> None:
    # Postgres enum values cannot be easily removed without recreating the type.
    pass

