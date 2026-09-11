"""R-P5.5: encrypted education documents on digital passports.

Revision ID: 072_passport_education_docs
Revises: 071_mail_provider_accounts
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "072_passport_education_docs"
down_revision = "071_mail_provider_accounts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "digital_passport_education_docs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "passport_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("digital_passports.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("doc_type", sa.String(length=64), nullable=False),
        sa.Column("title_hint", sa.String(length=200), nullable=False),
        sa.Column("institution_hint", sa.String(length=200), nullable=True),
        sa.Column("cipher_id", sa.String(length=64), nullable=False),
        sa.Column("nonce_b64", sa.Text(), nullable=False),
        sa.Column("ciphertext_b64", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(length=80), nullable=False),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(
        "ix_passport_edu_docs_passport",
        "digital_passport_education_docs",
        ["passport_id"],
    )
    op.create_index(
        "ix_passport_edu_docs_owner",
        "digital_passport_education_docs",
        ["owner_user_id"],
    )
    op.create_index(
        "ix_passport_edu_docs_type",
        "digital_passport_education_docs",
        ["doc_type"],
    )
    op.create_index(
        "ix_passport_edu_docs_hash",
        "digital_passport_education_docs",
        ["content_hash"],
    )


def downgrade() -> None:
    op.drop_index("ix_passport_edu_docs_hash", table_name="digital_passport_education_docs")
    op.drop_index("ix_passport_edu_docs_type", table_name="digital_passport_education_docs")
    op.drop_index("ix_passport_edu_docs_owner", table_name="digital_passport_education_docs")
    op.drop_index("ix_passport_edu_docs_passport", table_name="digital_passport_education_docs")
    op.drop_table("digital_passport_education_docs")
