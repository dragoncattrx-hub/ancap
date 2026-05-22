"""Add Organization, WebhookEndpoint, WebhookDelivery models."""
from alembic import op
import sqlalchemy as sa


revision = "049_org_webhook_models"
down_revision = "048_add_search_vectors"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Organizations
    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("billing_wallet_address", sa.String(128), nullable=True),
        sa.Column("billing_agent_id", sa.UUID(), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"], unique=True)

    # Organization members
    op.create_table(
        "organization_members",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(16), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_org_members_org_id", "organization_members", ["org_id"])
    op.create_index("ix_org_members_user_id", "organization_members", ["user_id"])
    op.create_index("ix_org_member_unique", "organization_members", ["org_id", "user_id"], unique=True)

    # Webhook endpoints
    op.create_table(
        "webhook_endpoints",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("owner_user_id", sa.UUID(), nullable=False),
        sa.Column("org_id", sa.UUID(), nullable=True),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("secret", sa.String(64), nullable=False),
        sa.Column("event_types", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_webhook_owner_active", "webhook_endpoints", ["owner_user_id", "is_active"])
    op.create_index("ix_webhook_org_id", "webhook_endpoints", ["org_id"])

    # Webhook deliveries
    op.create_table(
        "webhook_deliveries",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("webhook_endpoint_id", sa.UUID(), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("response_status", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("attempt", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_webhook_delivery_endpoint_status", "webhook_deliveries", ["webhook_endpoint_id", "status"])
    op.create_index("ix_webhook_delivery_pending_retry", "webhook_deliveries", ["status", "next_retry_at"])


def downgrade() -> None:
    op.drop_table("webhook_deliveries")
    op.drop_table("webhook_endpoints")
    op.drop_table("organization_members")
    op.drop_table("organizations")
