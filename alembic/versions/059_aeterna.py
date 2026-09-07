"""R12 AETERNA longevity marketplace foundation.

Revision ID: 059_aeterna
Revises: 058_r9_r10_r11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "059_aeterna"
down_revision = "058_r9_r10_r11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "aeterna_dna_vault",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=True),
        sa.Column("owner_user_id", sa.UUID(), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=False),
        sa.Column("source", sa.String(length=32), server_default="upload", nullable=False),
        sa.Column("source_uri", sa.String(length=512), nullable=True),
        sa.Column("content_sha256", sa.String(length=128), nullable=False),
        sa.Column("format_hint", sa.String(length=32), server_default="vcf", nullable=False),
        sa.Column("status", sa.String(length=32), server_default="pending", nullable=False),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_aeterna_dna_vault_org_id", "aeterna_dna_vault", ["org_id"])
    op.create_index("ix_aeterna_dna_vault_owner_user_id", "aeterna_dna_vault", ["owner_user_id"])
    op.create_index("ix_aeterna_dna_vault_status", "aeterna_dna_vault", ["status"])
    op.create_index("ix_aeterna_dna_vault_owner_created", "aeterna_dna_vault", ["owner_user_id", "created_at"])

    op.create_table(
        "aeterna_intent_orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=True),
        sa.Column("owner_user_id", sa.UUID(), nullable=False),
        sa.Column("intent_kind", sa.String(length=48), nullable=False),
        sa.Column("vault_id", sa.UUID(), nullable=True),
        sa.Column("workflow_slug", sa.String(length=80), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("budget_acp", sa.Numeric(36, 18), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["vault_id"], ["aeterna_dna_vault.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_aeterna_intent_orders_org_id", "aeterna_intent_orders", ["org_id"])
    op.create_index("ix_aeterna_intent_orders_owner_user_id", "aeterna_intent_orders", ["owner_user_id"])
    op.create_index("ix_aeterna_intent_orders_intent_kind", "aeterna_intent_orders", ["intent_kind"])
    op.create_index("ix_aeterna_intent_orders_vault_id", "aeterna_intent_orders", ["vault_id"])
    op.create_index("ix_aeterna_intent_orders_status", "aeterna_intent_orders", ["status"])
    op.create_index(
        "ix_aeterna_intent_orders_owner_created",
        "aeterna_intent_orders",
        ["owner_user_id", "created_at"],
    )

    op.create_table(
        "aeterna_partners",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("jurisdiction", sa.String(length=64), nullable=False),
        sa.Column("license_ref", sa.String(length=200), nullable=True),
        sa.Column("website", sa.String(length=512), nullable=True),
        sa.Column(
            "supported_intents",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_aeterna_partners_org_id", "aeterna_partners", ["org_id"])
    op.create_index("ix_aeterna_partners_verified", "aeterna_partners", ["verified"])
    op.create_index("ix_aeterna_partners_org_name", "aeterna_partners", ["org_id", "name"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_aeterna_partners_org_name", table_name="aeterna_partners")
    op.drop_index("ix_aeterna_partners_verified", table_name="aeterna_partners")
    op.drop_index("ix_aeterna_partners_org_id", table_name="aeterna_partners")
    op.drop_table("aeterna_partners")

    op.drop_index("ix_aeterna_intent_orders_owner_created", table_name="aeterna_intent_orders")
    op.drop_index("ix_aeterna_intent_orders_status", table_name="aeterna_intent_orders")
    op.drop_index("ix_aeterna_intent_orders_vault_id", table_name="aeterna_intent_orders")
    op.drop_index("ix_aeterna_intent_orders_intent_kind", table_name="aeterna_intent_orders")
    op.drop_index("ix_aeterna_intent_orders_owner_user_id", table_name="aeterna_intent_orders")
    op.drop_index("ix_aeterna_intent_orders_org_id", table_name="aeterna_intent_orders")
    op.drop_table("aeterna_intent_orders")

    op.drop_index("ix_aeterna_dna_vault_owner_created", table_name="aeterna_dna_vault")
    op.drop_index("ix_aeterna_dna_vault_status", table_name="aeterna_dna_vault")
    op.drop_index("ix_aeterna_dna_vault_owner_user_id", table_name="aeterna_dna_vault")
    op.drop_index("ix_aeterna_dna_vault_org_id", table_name="aeterna_dna_vault")
    op.drop_table("aeterna_dna_vault")
