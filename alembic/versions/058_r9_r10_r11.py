"""R9/R10/R11 foundations: securities, watch fleet, orbital edge.

Revision ID: 058_r9_r10_r11
Revises: 057_org_nfc_identity
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "058_r9_r10_r11"
down_revision = "057_org_nfc_identity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "securities_instruments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("instrument_type", sa.String(length=32), nullable=False),
        sa.Column("issuer_name", sa.String(length=200), nullable=False),
        sa.Column("jurisdiction", sa.String(length=64), nullable=False),
        sa.Column("face_amount", sa.Numeric(36, 18), nullable=False),
        sa.Column("currency", sa.String(length=8), server_default="USD", nullable=False),
        sa.Column("isin", sa.String(length=16), nullable=True),
        sa.Column("maturity_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("share_count", sa.Numeric(36, 18), nullable=True),
        sa.Column("document_hash", sa.String(length=128), nullable=True),
        sa.Column("document_uri", sa.String(length=512), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_securities_instruments_org_id", "securities_instruments", ["org_id"])
    op.create_index("ix_securities_instruments_instrument_type", "securities_instruments", ["instrument_type"])

    op.create_table(
        "securities_intake_requests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("instrument_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="draft", nullable=False),
        sa.Column("submitted_by", sa.UUID(), nullable=True),
        sa.Column("reviewer_id", sa.UUID(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["instrument_id"], ["securities_instruments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_securities_intake_requests_org_id", "securities_intake_requests", ["org_id"])
    op.create_index("ix_securities_intake_requests_instrument_id", "securities_intake_requests", ["instrument_id"])
    op.create_index("ix_securities_intake_requests_status", "securities_intake_requests", ["status"])
    op.create_index("ix_securities_intake_org_status", "securities_intake_requests", ["org_id", "status"])

    op.create_table(
        "securities_custody_positions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("instrument_id", sa.UUID(), nullable=False),
        sa.Column("intake_id", sa.UUID(), nullable=False),
        sa.Column("location", sa.String(length=32), server_default="register_only", nullable=False),
        sa.Column("custodian_ref", sa.String(length=200), nullable=True),
        sa.Column("haircut_bps", sa.Integer(), server_default="2500", nullable=False),
        sa.Column("collateral_credit_acp", sa.Numeric(36, 18), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=32), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["intake_id"], ["securities_intake_requests.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["instrument_id"], ["securities_instruments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_securities_custody_positions_org_id", "securities_custody_positions", ["org_id"])
    op.create_index("ix_securities_custody_positions_instrument_id", "securities_custody_positions", ["instrument_id"])
    op.create_index("ix_securities_custody_positions_intake_id", "securities_custody_positions", ["intake_id"])
    op.create_index("ix_securities_custody_positions_status", "securities_custody_positions", ["status"])

    op.create_table(
        "watch_assets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("employee_user_id", sa.UUID(), nullable=False),
        sa.Column("slot", sa.String(length=8), nullable=False),
        sa.Column("band_color", sa.String(length=40), nullable=False),
        sa.Column("serial_number", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="spare", nullable=False),
        sa.Column("battery_percent", sa.Integer(), nullable=True),
        sa.Column("last_rotated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["employee_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_watch_assets_org_id", "watch_assets", ["org_id"])
    op.create_index("ix_watch_assets_employee_user_id", "watch_assets", ["employee_user_id"])
    op.create_index("ix_watch_assets_status", "watch_assets", ["status"])
    op.create_index(
        "ix_watch_assets_org_employee_slot",
        "watch_assets",
        ["org_id", "employee_user_id", "slot"],
        unique=True,
    )
    op.create_index("ix_watch_assets_org_serial", "watch_assets", ["org_id", "serial_number"], unique=True)

    op.create_table(
        "watch_rotation_policies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("rotation_interval_minutes", sa.Integer(), server_default="240", nullable=False),
        sa.Column("min_soc_percent", sa.Integer(), server_default="25", nullable=False),
        sa.Column("grace_minutes", sa.Integer(), server_default="15", nullable=False),
        sa.Column(
            "viewer_roles",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[\"owner\", \"admin\"]'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_watch_rotation_policies_org_id", "watch_rotation_policies", ["org_id"], unique=True)

    op.create_table(
        "watch_heart_rate_samples",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("employee_user_id", sa.UUID(), nullable=False),
        sa.Column("watch_asset_id", sa.UUID(), nullable=True),
        sa.Column("bpm", sa.Integer(), nullable=False),
        sa.Column("on_shift", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("source", sa.String(length=40), server_default="healthkit", nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ingested_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["employee_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["watch_asset_id"], ["watch_assets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_watch_heart_rate_samples_org_id", "watch_heart_rate_samples", ["org_id"])
    op.create_index("ix_watch_heart_rate_samples_employee_user_id", "watch_heart_rate_samples", ["employee_user_id"])
    op.create_index("ix_watch_heart_rate_samples_watch_asset_id", "watch_heart_rate_samples", ["watch_asset_id"])
    op.create_index("ix_watch_heart_rate_samples_recorded_at", "watch_heart_rate_samples", ["recorded_at"])
    op.create_index(
        "ix_watch_hr_org_employee_recorded",
        "watch_heart_rate_samples",
        ["org_id", "employee_user_id", "recorded_at"],
    )

    op.create_table(
        "orbital_edge_nodes",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("codename", sa.String(length=80), nullable=False),
        sa.Column("norad_id", sa.String(length=32), nullable=True),
        sa.Column("launch_provider", sa.String(length=40), server_default="spacex", nullable=False),
        sa.Column("rideshare_slot", sa.String(length=80), nullable=True),
        sa.Column("mass_kg", sa.Numeric(10, 3), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="planned", nullable=False),
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
    op.create_index("ix_orbital_edge_nodes_org_id", "orbital_edge_nodes", ["org_id"])
    op.create_index("ix_orbital_edge_nodes_status", "orbital_edge_nodes", ["status"])
    op.create_index(
        "ix_orbital_edge_nodes_org_codename",
        "orbital_edge_nodes",
        ["org_id", "codename"],
        unique=True,
    )

    op.create_table(
        "orbital_attestations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("node_id", sa.UUID(), nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("digest_sha256", sa.String(length=128), nullable=False),
        sa.Column("payload_uri", sa.String(length=512), nullable=True),
        sa.Column("verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["node_id"], ["orbital_edge_nodes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orbital_attestations_node_id", "orbital_attestations", ["node_id"])


def downgrade() -> None:
    op.drop_index("ix_orbital_attestations_node_id", table_name="orbital_attestations")
    op.drop_table("orbital_attestations")
    op.drop_index("ix_orbital_edge_nodes_org_codename", table_name="orbital_edge_nodes")
    op.drop_index("ix_orbital_edge_nodes_status", table_name="orbital_edge_nodes")
    op.drop_index("ix_orbital_edge_nodes_org_id", table_name="orbital_edge_nodes")
    op.drop_table("orbital_edge_nodes")

    op.drop_index("ix_watch_hr_org_employee_recorded", table_name="watch_heart_rate_samples")
    op.drop_index("ix_watch_heart_rate_samples_recorded_at", table_name="watch_heart_rate_samples")
    op.drop_index("ix_watch_heart_rate_samples_watch_asset_id", table_name="watch_heart_rate_samples")
    op.drop_index("ix_watch_heart_rate_samples_employee_user_id", table_name="watch_heart_rate_samples")
    op.drop_index("ix_watch_heart_rate_samples_org_id", table_name="watch_heart_rate_samples")
    op.drop_table("watch_heart_rate_samples")

    op.drop_index("ix_watch_rotation_policies_org_id", table_name="watch_rotation_policies")
    op.drop_table("watch_rotation_policies")

    op.drop_index("ix_watch_assets_org_serial", table_name="watch_assets")
    op.drop_index("ix_watch_assets_org_employee_slot", table_name="watch_assets")
    op.drop_index("ix_watch_assets_status", table_name="watch_assets")
    op.drop_index("ix_watch_assets_employee_user_id", table_name="watch_assets")
    op.drop_index("ix_watch_assets_org_id", table_name="watch_assets")
    op.drop_table("watch_assets")

    op.drop_index("ix_securities_custody_positions_status", table_name="securities_custody_positions")
    op.drop_index("ix_securities_custody_positions_intake_id", table_name="securities_custody_positions")
    op.drop_index("ix_securities_custody_positions_instrument_id", table_name="securities_custody_positions")
    op.drop_index("ix_securities_custody_positions_org_id", table_name="securities_custody_positions")
    op.drop_table("securities_custody_positions")

    op.drop_index("ix_securities_intake_org_status", table_name="securities_intake_requests")
    op.drop_index("ix_securities_intake_requests_status", table_name="securities_intake_requests")
    op.drop_index("ix_securities_intake_requests_instrument_id", table_name="securities_intake_requests")
    op.drop_index("ix_securities_intake_requests_org_id", table_name="securities_intake_requests")
    op.drop_table("securities_intake_requests")

    op.drop_index("ix_securities_instruments_instrument_type", table_name="securities_instruments")
    op.drop_index("ix_securities_instruments_org_id", table_name="securities_instruments")
    op.drop_table("securities_instruments")
