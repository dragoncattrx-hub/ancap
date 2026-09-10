"""User-connected IMAP/SMTP provider accounts (single account per user).

Revision ID: 071_mail_provider_accounts
Revises: 070_lunar_land
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "071_mail_provider_accounts"
down_revision = "070_lunar_land"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mail_provider_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("display_name", sa.String(length=160), nullable=True),
        sa.Column("email_address", sa.String(length=320), nullable=False),
        sa.Column("provider_kind", sa.String(length=32), nullable=False, server_default="imap_smtp"),
        sa.Column("imap_host", sa.String(length=255), nullable=False),
        sa.Column("imap_port", sa.Integer(), nullable=False, server_default="993"),
        sa.Column("imap_username", sa.String(length=320), nullable=False),
        sa.Column("imap_password_enc", sa.Text(), nullable=False),
        sa.Column("imap_use_ssl", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("smtp_host", sa.String(length=255), nullable=False),
        sa.Column("smtp_port", sa.Integer(), nullable=False, server_default="587"),
        sa.Column("smtp_username", sa.String(length=320), nullable=False),
        sa.Column("smtp_password_enc", sa.Text(), nullable=False),
        sa.Column("smtp_use_tls", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("smtp_use_ssl", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="connected"),
        sa.Column("last_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("owner_user_id", name="uq_mail_provider_accounts_owner"),
    )
    op.create_index("ix_mail_provider_accounts_owner", "mail_provider_accounts", ["owner_user_id"])
    op.create_index("ix_mail_provider_accounts_status", "mail_provider_accounts", ["status"])


def downgrade() -> None:
    op.drop_index("ix_mail_provider_accounts_status", table_name="mail_provider_accounts")
    op.drop_index("ix_mail_provider_accounts_owner", table_name="mail_provider_accounts")
    op.drop_table("mail_provider_accounts")
