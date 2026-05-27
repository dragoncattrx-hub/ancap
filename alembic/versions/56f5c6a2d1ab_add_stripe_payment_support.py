"""Add Stripe payment support fields and webhook event table.

Revision ID: 56f5c6a2d1ab
Revises: 55d9d9f2174d
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "56f5c6a2d1ab"
down_revision = "55d9d9f2174d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_users_stripe_customer_id"), "users", ["stripe_customer_id"], unique=True)

    op.add_column("payment_intents", sa.Column("stripe_payment_intent_id", sa.String(length=128), nullable=True))
    op.create_index(
        op.f("ix_payment_intents_stripe_payment_intent_id"),
        "payment_intents",
        ["stripe_payment_intent_id"],
        unique=True,
    )

    op.create_table(
        "stripe_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("stripe_event_id", sa.String(length=128), nullable=False),
        sa.Column("event_type", sa.String(length=128), nullable=False),
        sa.Column("processed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_stripe_events_stripe_event_id"), "stripe_events", ["stripe_event_id"], unique=True)
    op.create_index(op.f("ix_stripe_events_event_type"), "stripe_events", ["event_type"], unique=False)
    op.create_index("ix_stripe_events_type_processed", "stripe_events", ["event_type", "processed"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_stripe_events_type_processed", table_name="stripe_events")
    op.drop_index(op.f("ix_stripe_events_event_type"), table_name="stripe_events")
    op.drop_index(op.f("ix_stripe_events_stripe_event_id"), table_name="stripe_events")
    op.drop_table("stripe_events")

    op.drop_index(op.f("ix_payment_intents_stripe_payment_intent_id"), table_name="payment_intents")
    op.drop_column("payment_intents", "stripe_payment_intent_id")

    op.drop_index(op.f("ix_users_stripe_customer_id"), table_name="users")
    op.drop_column("users", "stripe_customer_id")
