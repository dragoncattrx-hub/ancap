"""Create user_acp_address_bindings for deposit/privacy address history."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "083_user_acp_address_bindings"
down_revision = "082_pqc_cipher_id_width"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_acp_address_bindings",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=False),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("address", sa.String(length=128), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("bound_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("unbound_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "address", name="uq_user_acp_address_bindings_user_address"),
    )
    op.create_index(
        "ix_user_acp_address_bindings_user_id",
        "user_acp_address_bindings",
        ["user_id"],
    )
    op.create_index(
        "ix_user_acp_address_bindings_address",
        "user_acp_address_bindings",
        ["address"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_acp_address_bindings_address", table_name="user_acp_address_bindings")
    op.drop_index("ix_user_acp_address_bindings_user_id", table_name="user_acp_address_bindings")
    op.drop_table("user_acp_address_bindings")
