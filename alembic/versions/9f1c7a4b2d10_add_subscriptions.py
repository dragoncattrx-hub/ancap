"""Add subscriptions table.

Revision ID: 9f1c7a4b2d10
Revises: 57b0c4a8d9ef
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "9f1c7a4b2d10"
down_revision = "57b0c4a8d9ef"
branch_labels = None
depends_on = None


subscription_status_enum = postgresql.ENUM(
    "active",
    "paused",
    "cancelled",
    "past_due",
    name="subscriptionstatusenum",
    create_type=False,
)

subscription_billing_period_enum = postgresql.ENUM(
    "monthly",
    "quarterly",
    "annual",
    name="subscriptionbillingperiodenum",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    subscription_status_enum.create(bind, checkfirst=True)
    subscription_billing_period_enum.create(bind, checkfirst=True)

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("plan_id", sa.String(length=64), nullable=True),
        sa.Column("status", subscription_status_enum, nullable=False, server_default="active"),
        sa.Column("billing_period", subscription_billing_period_enum, nullable=False, server_default="monthly"),
        sa.Column("price_acp", sa.Numeric(36, 18), nullable=False),
        sa.Column("next_billing_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_order_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["last_order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["listing_id"], ["listings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_subscriptions_user_id"), "subscriptions", ["user_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_listing_id"), "subscriptions", ["listing_id"], unique=False)
    op.create_index(op.f("ix_subscriptions_status"), "subscriptions", ["status"], unique=False)
    op.create_index(op.f("ix_subscriptions_next_billing_at"), "subscriptions", ["next_billing_at"], unique=False)
    op.create_index(
        "ix_subscriptions_user_status_created",
        "subscriptions",
        ["user_id", "status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ux_subscriptions_user_listing_period_active",
        "subscriptions",
        ["user_id", "listing_id", "billing_period"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ux_subscriptions_user_listing_period_active", table_name="subscriptions")
    op.drop_index("ix_subscriptions_user_status_created", table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_next_billing_at"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_status"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_listing_id"), table_name="subscriptions")
    op.drop_index(op.f("ix_subscriptions_user_id"), table_name="subscriptions")
    op.drop_table("subscriptions")
    subscription_billing_period_enum.drop(op.get_bind(), checkfirst=True)
    subscription_status_enum.drop(op.get_bind(), checkfirst=True)
