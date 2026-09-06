"""Organization NFC identity: member verification + user credentials + org policy.

Revision ID: 057_org_nfc_identity
Revises: e8f9a0b1c2d3
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "057_org_nfc_identity"
down_revision = "e8f9a0b1c2d3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organization_members", sa.Column("employee_code", sa.String(length=64), nullable=True))
    op.add_column(
        "organization_members",
        sa.Column(
            "verification_status",
            sa.String(length=16),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column("organization_members", sa.Column("nfc_uid_hash", sa.String(length=128), nullable=True))
    op.add_column("organization_members", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("organization_members", sa.Column("verified_by_user_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_organization_members_verified_by_user_id_users",
        "organization_members",
        "users",
        ["verified_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "user_nfc_credentials",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("label", sa.String(length=120), nullable=True),
        sa.Column("uid_hash", sa.String(length=128), nullable=False),
        sa.Column("vendor", sa.String(length=32), nullable=False, server_default="biohax"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_nfc_credentials_user_id", "user_nfc_credentials", ["user_id"], unique=False)
    op.create_index("ix_user_nfc_credentials_uid_hash", "user_nfc_credentials", ["uid_hash"], unique=True)

    op.create_table(
        "organization_nfc_policies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("require_nfc_for_admins", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("require_nfc_for_payments", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_organization_nfc_policies_org_id", "organization_nfc_policies", ["org_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_organization_nfc_policies_org_id", table_name="organization_nfc_policies")
    op.drop_table("organization_nfc_policies")

    op.drop_index("ix_user_nfc_credentials_uid_hash", table_name="user_nfc_credentials")
    op.drop_index("ix_user_nfc_credentials_user_id", table_name="user_nfc_credentials")
    op.drop_table("user_nfc_credentials")

    op.drop_constraint("fk_organization_members_verified_by_user_id_users", "organization_members", type_="foreignkey")
    op.drop_column("organization_members", "verified_by_user_id")
    op.drop_column("organization_members", "verified_at")
    op.drop_column("organization_members", "nfc_uid_hash")
    op.drop_column("organization_members", "verification_status")
    op.drop_column("organization_members", "employee_code")
