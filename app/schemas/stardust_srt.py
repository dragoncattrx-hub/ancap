"""Schemas for StardustSRT weather-control / earth-monitoring desk."""
from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator

_STARDUST_SLUG = re.compile(r"^stardust-[a-z0-9-]{1,64}$")
_ALLOWED_REFS = {
    "https://stardustsrt.com",
    "https://www.stardustsrt.com",
    "https://stardustsrt.com/",
    "https://www.stardustsrt.com/",
}


class StardustServicePublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    price_from_acp: str
    blurb: str
    workflow_slug: str | None = None
    billing: str = "one_shot"

    @field_validator("workflow_slug")
    @classmethod
    def _safe_workflow_slug(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        if not _STARDUST_SLUG.fullmatch(value):
            raise ValueError("workflow_slug must be a stardust-* slug")
        return value

    @field_validator("price_from_acp")
    @classmethod
    def _numeric_price(cls, value: str) -> str:
        raw = str(value).strip()
        if not re.fullmatch(r"[0-9]{1,12}", raw):
            raise ValueError("price_from_acp must be a positive integer string")
        return raw


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
    website_ref: str = Field(
        default="https://stardustsrt.com",
        max_length=128,
        description="Public literacy reference URL (https only; allowlisted host).",
    )
    services: list[StardustServicePublic]
    monitoring_modules: list[StardustModulePublic] = Field(default_factory=list)
    weather_controls: list[StardustControlPublic] = Field(default_factory=list)
    outcomes: list[StardustModulePublic] = Field(default_factory=list)

    @field_validator("website_ref")
    @classmethod
    def _allowlisted_https_ref(cls, value: str) -> str:
        raw = (value or "").strip()
        if raw in _ALLOWED_REFS:
            return raw.rstrip("/")
        return "https://stardustsrt.com"

    @field_validator("legal_href")
    @classmethod
    def _internal_legal_href(cls, value: str) -> str:
        raw = (value or "").strip() or "/legal/stardust"
        if not raw.startswith("/legal/"):
            return "/legal/stardust"
        if "://" in raw or ".." in raw:
            return "/legal/stardust"
        return raw
