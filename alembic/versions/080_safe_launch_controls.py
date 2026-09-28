"""Safe-launch: anti-sybil signals, server bounty, robot telemetry/delivery.

Revision ID: 080_safe_launch_controls
Revises: 079_dark_matter_auction
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "080_safe_launch_controls"
down_revision = "079_dark_matter_auction"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "registration_signals",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ip_hash", sa.String(length=64), nullable=False),
        sa.Column("device_hash", sa.String(length=64), nullable=True),
        sa.Column("free_grants_allowed", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("risk_flags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_registration_signals_user_id", "registration_signals", ["user_id"])
    op.create_index("ix_registration_signals_ip_hash", "registration_signals", ["ip_hash"])
    op.create_index("ix_registration_signals_device_hash", "registration_signals", ["device_hash"])
    op.create_index("ix_registration_signals_ip_created", "registration_signals", ["ip_hash", "created_at"])
    op.create_index("ix_registration_signals_device_created", "registration_signals", ["device_hash", "created_at"])

    op.create_table(
        "server_install_bounties",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("host_label", sa.String(length=128), nullable=False),
        sa.Column("proof_url", sa.Text(), nullable=True),
        sa.Column("proof_note", sa.Text(), nullable=True),
        sa.Column("payout_address", sa.String(length=128), nullable=False),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("risk_flags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_server_install_bounties_owner_user_id", "server_install_bounties", ["owner_user_id"])

    op.create_table(
        "robot_telemetry_consents",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("robot_id", sa.String(length=128), nullable=False),
        sa.Column("consent_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("retention_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_robot_telemetry_consents_owner_user_id", "robot_telemetry_consents", ["owner_user_id"])
    op.create_index("ix_robot_telemetry_consents_robot_id", "robot_telemetry_consents", ["robot_id"])

    op.create_table(
        "robot_telemetry_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "consent_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("robot_telemetry_consents.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("robot_id", sa.String(length=128), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_robot_telemetry_events_consent_id", "robot_telemetry_events", ["consent_id"])
    op.create_index("ix_robot_telemetry_events_robot_id", "robot_telemetry_events", ["robot_id"])

    op.create_table(
        "robot_delivery_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "customer_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "robot_agent_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("agents.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("pickup_label", sa.String(length=255), nullable=False),
        sa.Column("dropoff_label", sa.String(length=255), nullable=False),
        sa.Column("amount_acp", sa.Numeric(38, 18), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("delivery_proof", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_robot_delivery_jobs_customer_user_id", "robot_delivery_jobs", ["customer_user_id"])
    op.create_index("ix_robot_delivery_jobs_robot_agent_id", "robot_delivery_jobs", ["robot_agent_id"])


def downgrade() -> None:
    op.drop_table("robot_delivery_jobs")
    op.drop_table("robot_telemetry_events")
    op.drop_table("robot_telemetry_consents")
    op.drop_table("server_install_bounties")
    op.drop_table("registration_signals")
