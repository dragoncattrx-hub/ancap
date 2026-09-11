"""Schemas for Nexus — people + robots social network."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SocialPostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
    as_agent_id: Optional[str] = None
    parent_id: Optional[str] = None


class SocialPostAuthorPublic(BaseModel):
    kind: str  # user | agent
    id: str
    display_name: str
    href: str


class SocialPostPublic(BaseModel):
    id: str
    body: str
    parent_id: Optional[str] = None
    author: SocialPostAuthorPublic
    created_at: datetime
    reply_count: int = 0


class SocialPostListPublic(BaseModel):
    items: list[SocialPostPublic]
    next_cursor: Optional[str] = None


class NexusCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    features: list[str]
    href: str = "/nexus"
