"""Schemas for StardustSRT weather-control / earth-monitoring desk."""
from __future__ import annotations

from pydantic import BaseModel, Field


class StardustServicePublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    price_from_acp: str
    blurb: str
    workflow_slug: str | None = None
    billing: str = "one_shot"


class StardustModulePublic(BaseModel):
    id: str
    label: str
    role: str
    blurb: str = ""


class StardustControlPublic(BaseModel):
    id: str
    label: str
    icon: str
    blurb: str


class StardustCatalogPublic(BaseModel):
    title: str
    brand: str = "StardustSRT"
    tagline: str
    compliance_note: str
    legal_href: str = "/legal/stardust"
    website_ref: str = "https://stardustsrt.com"
    services: list[StardustServicePublic]
    monitoring_modules: list[StardustModulePublic] = Field(default_factory=list)
    weather_controls: list[StardustControlPublic] = Field(default_factory=list)
    outcomes: list[StardustModulePublic] = Field(default_factory=list)
