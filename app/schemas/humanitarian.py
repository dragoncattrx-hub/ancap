"""Schemas for the humanitarian aid desk."""
from __future__ import annotations

from pydantic import BaseModel, Field


class HumanitarianServicePublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    price_from_acp: str
    blurb: str


class HumanitarianPartnerPublic(BaseModel):
    id: str
    review_target_id: str
    name: str
    jurisdiction: str
    website: str
    blurb: str
    verified: bool = False
    listing_kind: str = "desk_handoff"
    official_partnership: bool = False
    emblem_licensed: bool = False
    ethics_note: str = ""
    regulatory_note: str = ""


class HumanitarianCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    services: list[HumanitarianServicePublic]
    partners: list[HumanitarianPartnerPublic]
    legal_href: str = "/legal/humanitarian"
    emblem_licensed: bool = Field(default=False)
    official_partnership: bool = Field(default=False)
