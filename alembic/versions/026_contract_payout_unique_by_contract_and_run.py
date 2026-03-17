"""Enforce one per-run payout per (contract_id, run_id).

Revision ID: 026
Revises: 025
Create Date: 2026-03-17
"""

from alembic import op


revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Expression unique index over JSONB metadata.
    #
    # We include `type` in the index instead of using a partial predicate to:
    # - avoid Postgres "unsafe new enum value" issues when enum values are added just before this migration
    # - avoid non-IMMUTABLE casts/functions in index predicates
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_contract_payout_contract_run
        ON ledger_events (type, (metadata->>'contract_id'), (metadata->>'run_id'))
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_ledger_contract_payout_contract_run")

