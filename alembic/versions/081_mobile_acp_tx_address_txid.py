"""Fix mobile_acp_txs uniqueness: allow same txid for multiple addresses."""

from alembic import op
import sqlalchemy as sa

revision = "081_mobile_acp_tx_address_txid"
down_revision = "080_safe_launch_controls"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop global unique on txid if present; enforce (address, txid) uniqueness.
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if "mobile_acp_txs" not in insp.get_table_names():
        return
    uniques = {u["name"]: u for u in insp.get_unique_constraints("mobile_acp_txs")}
    # Common auto-name from SQLAlchemy unique=True on column
    for name, meta in list(uniques.items()):
        cols = meta.get("column_names") or []
        if cols == ["txid"] or (len(cols) == 1 and cols[0] == "txid"):
            op.drop_constraint(name, "mobile_acp_txs", type_="unique")
    # Also drop unique indexes named like ix/uq on txid alone
    indexes = {i["name"]: i for i in insp.get_indexes("mobile_acp_txs")}
    for name, meta in list(indexes.items()):
        cols = meta.get("column_names") or []
        if meta.get("unique") and cols == ["txid"]:
            op.drop_index(name, table_name="mobile_acp_txs")

    existing = {i["name"] for i in insp.get_indexes("mobile_acp_txs")}
    constraints = {u["name"] for u in insp.get_unique_constraints("mobile_acp_txs")}
    if "uq_mobile_acp_txs_address_txid" not in constraints and "uq_mobile_acp_txs_address_txid" not in existing:
        op.create_unique_constraint(
            "uq_mobile_acp_txs_address_txid",
            "mobile_acp_txs",
            ["address", "txid"],
        )


def downgrade() -> None:
    op.drop_constraint("uq_mobile_acp_txs_address_txid", "mobile_acp_txs", type_="unique")
    op.create_unique_constraint("mobile_acp_txs_txid_key", "mobile_acp_txs", ["txid"])
