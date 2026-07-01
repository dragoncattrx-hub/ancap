"""Mobile Smart Pay durable records (intents, quotes, executions, receipts).

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c4d5e6f7a8b9"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mobile_smart_pay_records",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("session_token", sa.String(length=128), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_mobile_smart_pay_records_kind", "mobile_smart_pay_records", ["kind"])
    op.create_index("ix_mobile_smart_pay_records_owner_user_id", "mobile_smart_pay_records", ["owner_user_id"])
    op.create_index("ix_mobile_smart_pay_records_owner_kind", "mobile_smart_pay_records", ["owner_user_id", "kind"])


def downgrade() -> None:
    op.drop_index("ix_mobile_smart_pay_records_owner_kind", table_name="mobile_smart_pay_records")
    op.drop_index("ix_mobile_smart_pay_records_owner_user_id", table_name="mobile_smart_pay_records")
    op.drop_index("ix_mobile_smart_pay_records_kind", table_name="mobile_smart_pay_records")
    op.drop_table("mobile_smart_pay_records")
