"""Schemas for the worldwide legal counsel desk."""
from __future__ import annotations

from pydantic import BaseModel, Field


class CounselServicePublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    price_from_acp: str
    blurb: str
    workflow_slug: str | None = None
    regions: list[str] = Field(default_factory=list)


class CounselRegionPublic(BaseModel):
    id: str
    label: str
    blurb: str


class CounselCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    services: list[CounselServicePublic]
    regions: list[CounselRegionPublic]
    legal_href: str = "/legal/counsel"
    practices_law: bool = Field(default=False)
    attorney_client: bool = Field(default=False)
