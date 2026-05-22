"""Add Organization, Webhook models."""
from __future__ import annotations

import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Integer,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Index,
    Column,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


class OrgRoleEnum(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class WebhookEventType(str, enum.Enum):
    run_completed = "run.completed"
    run_failed = "run.failed"
    payment_captured = "payment.captured"
    payment_refunded = "payment.refunded"
    receipt_ready = "receipt.ready"
    api_usage_created = "api.usage.created"
    user_registered = "user.registered"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    slug = Column(String(80), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    billing_wallet_address = Column(String(128), nullable=True)
    billing_agent_id = Column(UUID(as_uuid=False), nullable=True)
    created_by_user_id = Column(UUID(as_uuid=False), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(SQLEnum(OrgRoleEnum), nullable=False, default=OrgRoleEnum.member)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_org_member_unique", "org_id", "user_id", unique=True),
    )


class WebhookEndpoint(Base):
    __tablename__ = "webhook_endpoints"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    org_id = Column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    url = Column(String(500), nullable=False)
    secret = Column(String(64), nullable=False)
    event_types = Column(JSONB, nullable=False, default=list)  # list of WebhookEventType values
    is_active = Column(Boolean, nullable=False, default=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_webhook_owner_active", "owner_user_id", "is_active"),
    )


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    webhook_endpoint_id = Column(UUID(as_uuid=False), ForeignKey("webhook_endpoints.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(64), nullable=False)
    payload_json = Column(JSONB, nullable=False)
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    attempt = Column(Integer, nullable=False, default=1)
    status = Column(String(16), nullable=False, default="pending", index=True)  # pending | delivered | failed
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_webhook_delivery_endpoint_status", "webhook_endpoint_id", "status"),
        Index("ix_webhook_delivery_pending_retry", "status", "next_retry_at"),
    )
