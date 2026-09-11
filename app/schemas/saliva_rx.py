"""Schemas for saliva analysis + individualized Rx compounding desk."""
from __future__ import annotations

from pydantic import BaseModel


class SalivaRxServicePublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    price_from_acp: str
    blurb: str


class SalivaRxPartnerPublic(BaseModel):
    id: str
    review_target_id: str
    name: str
    jurisdiction: str
    website: str
    blurb: str
    verified: bool = False


class SalivaRxPipelineStepPublic(BaseModel):
    id: str
    label: str
    detail: str


class SalivaRxCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    pipeline: list[SalivaRxPipelineStepPublic]
    services: list[SalivaRxServicePublic]
    partners: list[SalivaRxPartnerPublic]
    legal_href: str = "/legal/saliva-rx-notice"
