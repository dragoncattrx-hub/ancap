"""R-DNA: encrypted digital DNA/RNA bank.

Revision ID: 073_dna_rna_bank
Revises: 072_passport_education_docs
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "073_dna_rna_bank"
down_revision = "072_passport_education_docs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dna_rna_bank_entries",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("molecule", sa.String(length=16), nullable=False),
        sa.Column("entry_type", sa.String(length=64), nullable=False),
        sa.Column("title_hint", sa.String(length=200), nullable=False),
        sa.Column("species_hint", sa.String(length=120), nullable=True),
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
    op.create_index("ix_dna_rna_bank_owner", "dna_rna_bank_entries", ["owner_user_id"])
    op.create_index("ix_dna_rna_bank_molecule", "dna_rna_bank_entries", ["molecule"])
    op.create_index("ix_dna_rna_bank_type", "dna_rna_bank_entries", ["entry_type"])
    op.create_index("ix_dna_rna_bank_hash", "dna_rna_bank_entries", ["content_hash"])


def downgrade() -> None:
    op.drop_index("ix_dna_rna_bank_hash", table_name="dna_rna_bank_entries")
    op.drop_index("ix_dna_rna_bank_type", table_name="dna_rna_bank_entries")
    op.drop_index("ix_dna_rna_bank_molecule", table_name="dna_rna_bank_entries")
    op.drop_index("ix_dna_rna_bank_owner", table_name="dna_rna_bank_entries")
    op.drop_table("dna_rna_bank_entries")
