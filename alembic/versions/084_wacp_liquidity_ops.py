"""wACP V3 liquidity stage ledger (operator deployments).

Revision ID: 084_wacp_liquidity_ops
Revises: 083_user_acp_address_bindings
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "084_wacp_liquidity_ops"
down_revision = "083_user_acp_address_bindings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "wacp_liquidity_stages",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("stage_id", sa.String(length=64), nullable=False),
        sa.Column("operator_label", sa.String(length=128), nullable=True),
        sa.Column("mint_wacp_wei", sa.Numeric(38, 0), nullable=True),
        sa.Column("approval_json", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="planned"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_wacp_liquidity_stages_stage_id", "wacp_liquidity_stages", ["stage_id"], unique=True)

    op.create_table(
        "wacp_treasury_allocations",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "stage_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("wacp_liquidity_stages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("bucket", sa.String(length=16), nullable=False),
        sa.Column("fraction", sa.Numeric(8, 6), nullable=True),
        sa.Column("wacp_wei", sa.Numeric(38, 0), nullable=True),
        sa.Column("usdt_wei", sa.Numeric(38, 0), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_wacp_treasury_alloc_stage", "wacp_treasury_allocations", ["stage_id"])

    op.create_table(
        "wacp_v3_positions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "stage_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("wacp_liquidity_stages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("pool_address", sa.String(length=64), nullable=False),
        sa.Column("position_token_id", sa.String(length=78), nullable=True),
        sa.Column("tick_lower", sa.Integer(), nullable=True),
        sa.Column("tick_upper", sa.Integer(), nullable=True),
        sa.Column("amount0_wei", sa.Numeric(38, 0), nullable=True),
        sa.Column("amount1_wei", sa.Numeric(38, 0), nullable=True),
        sa.Column("mint_tx_hash", sa.String(length=80), nullable=True),
        sa.Column("pool_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_wacp_v3_positions_stage", "wacp_v3_positions", ["stage_id"])


def downgrade() -> None:
    op.drop_index("ix_wacp_v3_positions_stage", table_name="wacp_v3_positions")
    op.drop_table("wacp_v3_positions")
    op.drop_index("ix_wacp_treasury_alloc_stage", table_name="wacp_treasury_allocations")
    op.drop_table("wacp_treasury_allocations")
    op.drop_index("ix_wacp_liquidity_stages_stage_id", table_name="wacp_liquidity_stages")
    op.drop_table("wacp_liquidity_stages")
