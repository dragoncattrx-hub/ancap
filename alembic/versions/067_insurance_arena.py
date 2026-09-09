"""ACP Insurance + Arena (prediction/house games) tables.

Revision ID: 067_insurance_arena
Revises: 066_digital_passport
"""

from alembic import op
import sqlalchemy as sa

revision = "067_insurance_arena"
down_revision = "066_digital_passport"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "insurance_pools",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("coverage_class", sa.String(length=48), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="open"),
        sa.Column("collateral_spec_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_insurance_pools_coverage_class", "insurance_pools", ["coverage_class"])

    op.create_table(
        "insurance_policies",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("pool_id", sa.String(length=64), sa.ForeignKey("insurance_pools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("holder_user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("coverage_class", sa.String(length=48), nullable=False),
        sa.Column("coverage_json", sa.JSON(), nullable=False),
        sa.Column("asset_ref_type", sa.String(length=48), nullable=True),
        sa.Column("asset_ref_id", sa.String(length=128), nullable=True),
        sa.Column("sum_insured_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("premium_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="active"),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_insurance_policies_holder", "insurance_policies", ["holder_user_id"])
    op.create_index("ix_insurance_policies_pool", "insurance_policies", ["pool_id"])
    op.create_index("ix_insurance_policies_status", "insurance_policies", ["status"])

    op.create_table(
        "insurance_claims",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("policy_id", sa.UUID(as_uuid=False), sa.ForeignKey("insurance_policies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("claimant_user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="filed"),
        sa.Column("ref_json", sa.JSON(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_insurance_claims_policy", "insurance_claims", ["policy_id"])
    op.create_index("ix_insurance_claims_status", "insurance_claims", ["status"])

    op.create_table(
        "arena_markets",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=48), nullable=False, server_default="event"),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="open"),
        sa.Column("outcome_yes_label", sa.String(length=80), nullable=False, server_default="YES"),
        sa.Column("outcome_no_label", sa.String(length=80), nullable=False, server_default="NO"),
        sa.Column("closes_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_outcome", sa.String(length=8), nullable=True),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_arena_markets_status", "arena_markets", ["status"])
    op.create_index("ix_arena_markets_category", "arena_markets", ["category"])

    op.create_table(
        "arena_bets",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("market_id", sa.String(length=64), sa.ForeignKey("arena_markets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("side", sa.String(length=8), nullable=False),
        sa.Column("stake_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="open"),
        sa.Column("payout_acp", sa.Numeric(38, 18), nullable=True),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_arena_bets_market", "arena_bets", ["market_id"])
    op.create_index("ix_arena_bets_user", "arena_bets", ["user_id"])

    op.create_table(
        "arena_house_rounds",
        sa.Column("id", sa.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=False), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("game", sa.String(length=24), nullable=False),
        sa.Column("stake_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("choice", sa.String(length=32), nullable=False),
        sa.Column("server_seed_hash", sa.String(length=64), nullable=False),
        sa.Column("server_seed", sa.String(length=128), nullable=True),
        sa.Column("result", sa.String(length=32), nullable=True),
        sa.Column("won", sa.Boolean(), nullable=True),
        sa.Column("payout_acp", sa.Numeric(38, 18), nullable=True),
        sa.Column("house_edge_bps", sa.Integer(), nullable=False, server_default="200"),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="resolved"),
        sa.Column("contract_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_arena_house_rounds_user", "arena_house_rounds", ["user_id"])
    op.create_index("ix_arena_house_rounds_game", "arena_house_rounds", ["game"])


def downgrade() -> None:
    op.drop_table("arena_house_rounds")
    op.drop_table("arena_bets")
    op.drop_table("arena_markets")
    op.drop_table("insurance_claims")
    op.drop_table("insurance_policies")
    op.drop_table("insurance_pools")
