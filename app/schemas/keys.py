"""API key schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    """Request to create an API key for an agent."""
    agent_id: str = Field(..., description="Agent ID that will own the key")
    scope: Optional[str] = Field(None, max_length=64, description="Optional scope (e.g. read, write)")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration time")


class ApiKeyCreateResponse(BaseModel):
    """Response when creating a key: raw key is returned once; store it securely."""
    id: str
    agent_id: str
    key_prefix: str = Field(..., description="First chars of the key for identification; use in X-API-Key for auth")
    key: str = Field(..., description="Full API key; shown only once, store securely")
    scope: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


class ApiKeyPublic(BaseModel):
    """Public key info (no secret)."""
    id: str
    agent_id: str
    key_prefix: str
    scope: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
