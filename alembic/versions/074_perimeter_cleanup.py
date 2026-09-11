"""R-Perimeter: encrypted perimeter cleanup jobs (Abrams Suite-B vault).

Revision ID: 074_perimeter_cleanup
Revises: 073_dna_rna_bank
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "074_perimeter_cleanup"
down_revision = "073_dna_rna_bank"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "perimeter_cleanup_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("service_id", sa.String(length=64), nullable=False),
        sa.Column("contamination", sa.String(length=32), nullable=False),
        sa.Column("site_label_hint", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("cipher_id", sa.String(length=80), nullable=False),
        sa.Column("nonce_b64", sa.Text(), nullable=False),
        sa.Column("ciphertext_b64", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(length=120), nullable=False),
        sa.Column(
            "metadata_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_perimeter_jobs_owner", "perimeter_cleanup_jobs", ["owner_user_id"])
    op.create_index("ix_perimeter_jobs_service", "perimeter_cleanup_jobs", ["service_id"])
    op.create_index("ix_perimeter_jobs_contam", "perimeter_cleanup_jobs", ["contamination"])
    op.create_index("ix_perimeter_jobs_status", "perimeter_cleanup_jobs", ["status"])
    op.create_index("ix_perimeter_jobs_hash", "perimeter_cleanup_jobs", ["content_hash"])


def downgrade() -> None:
    op.drop_index("ix_perimeter_jobs_hash", table_name="perimeter_cleanup_jobs")
    op.drop_index("ix_perimeter_jobs_status", table_name="perimeter_cleanup_jobs")
    op.drop_index("ix_perimeter_jobs_contam", table_name="perimeter_cleanup_jobs")
    op.drop_index("ix_perimeter_jobs_service", table_name="perimeter_cleanup_jobs")
    op.drop_index("ix_perimeter_jobs_owner", table_name="perimeter_cleanup_jobs")
    op.drop_table("perimeter_cleanup_jobs")
