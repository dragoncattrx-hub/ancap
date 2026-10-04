"""Schemas for the field-services hub (Starlink / IT / cameras / solar)."""
from __future__ import annotations

from pydantic import BaseModel, Field


class FieldGroupPublic(BaseModel):
    id: str
    label: str
    blurb: str


class FieldServicePublic(BaseModel):
    id: str
    group_id: str
    review_target_id: str
    label: str
    price_eur: str
    price_from_acp: str | None = None
    blurb: str
    workflow_slug: str | None = None
    regions: list[str] = Field(default_factory=list)


class FieldRegionPublic(BaseModel):
    id: str
    label: str
    blurb: str


class FieldPartnerPublic(BaseModel):
    id: str
    label: str
    location: str
    verified: bool = True
    blurb: str


class FieldCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    groups: list[FieldGroupPublic]
    services: list[FieldServicePublic]
    regions: list[FieldRegionPublic]
    partners: list[FieldPartnerPublic] = Field(default_factory=list)
    legal_href: str = "/legal/field-services"
    service_fee_eur: str = "3"
    official_reseller: bool = Field(default=False)
    jobcenter_guarantee: bool = Field(default=False)


class FieldQuoteRequest(BaseModel):
    service_id: str
    region: str | None = None
    payment_currency: str = Field(default="ACP", description="ACP | wACP | USDT")


class FieldQuotePublic(BaseModel):
    service_id: str
    group_id: str | None = None
    region: str | None = None
    label: str
    installation_fee_eur: str
    service_fee_eur: str
    total_eur: str
    total_usdt: str
    amount_acp: str
    amount_wacp: str
    payment_currency: str
    pay_amount: str
    oracle_wacp_usd: str
    workflow_slug: str
    provider_label: str
    provider_location: str
    escrow_note: str
