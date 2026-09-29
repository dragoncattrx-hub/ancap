"""Widen vault cipher_id columns for X-Wing CIPHER_ID length."""

from alembic import op
import sqlalchemy as sa

revision = "082_pqc_cipher_id_width"
down_revision = "081_mobile_acp_tx_address_txid"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = {
        "digital_passport_education_docs": "cipher_id",
        "dna_rna_bank_entries": "cipher_id",
        "perimeter_cleanup_jobs": "cipher_id",
    }
    for table, col in tables.items():
        if table not in insp.get_table_names():
            continue
        op.alter_column(
            table,
            col,
            existing_type=sa.String(length=80),
            type_=sa.String(length=96),
            existing_nullable=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for table in (
        "digital_passport_education_docs",
        "dna_rna_bank_entries",
        "perimeter_cleanup_jobs",
    ):
        if table not in insp.get_table_names():
            continue
        op.alter_column(
            table,
            "cipher_id",
            existing_type=sa.String(length=96),
            type_=sa.String(length=80),
            existing_nullable=False,
        )
