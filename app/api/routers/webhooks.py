from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, get_current_user_id
from app.config import get_settings


router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


class WebhookCreate(BaseModel):
    url: str
    event_types: list[str]
    description: str | None = None


class WebhookPublic(BaseModel):
    id: str
    url: str
    event_types: list[str]
    description: str | None = None
    is_active: bool = True
    created_at: str | None = None


class WebhookDeliveryPublic(BaseModel):
    id: str
    event_type: str
    status: str
    attempt: int
    response_status: int | None = None
    created_at: str | None = None
    delivered_at: str | None = None


def sign_webhook_payload(payload: str, secret: str) -> str:
    """Generate HMAC-SHA256 signature for webhook payload."""
    return "sha256=" + hmac.new(
        secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()


def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """Verify HMAC-SHA256 signature."""
    if not signature.startswith("sha256="):
        return False
    expected = sign_webhook_payload(payload, secret)
    return hmac.compare_digest(expected, signature)


def generate_webhook_secret() -> str:
    return secrets.token_hex(32)


@router.get("", response_model=list[WebhookPublic])
async def list_webhooks(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """List user's webhook endpoints."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Placeholder: implement once WebhookEndpoint model is registered
    return []


@router.post("", response_model=WebhookPublic, status_code=201)
async def create_webhook(
    body: WebhookCreate,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """Register a new webhook endpoint."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not body.event_types:
        raise HTTPException(status_code=400, detail="At least one event type is required")
    if not body.url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL must be https")
    secret = generate_webhook_secret()
    # Placeholder: create WebhookEndpoint record once model is registered
    return WebhookPublic(
        id=str(uuid.uuid4()),
        url=body.url,
        event_types=body.event_types,
        description=body.description,
        is_active=True,
        created_at=datetime.now(timezone.utc).isoformat(),
    )


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(
    webhook_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """Delete a webhook endpoint."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Placeholder: delete WebhookEndpoint record


@router.get("/{webhook_id}/deliveries", response_model=list[WebhookDeliveryPublic])
async def list_webhook_deliveries(
    webhook_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
    limit: int = Query(50, ge=1, le=200),
):
    """List delivery attempts for a webhook."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Placeholder: query WebhookDelivery table once model is registered
    return []


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    """Send a test event to a webhook endpoint."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Placeholder: deliver test event via dispatch_webhook_event()
    return {"delivered": True, "webhook_id": webhook_id}


import uuid
