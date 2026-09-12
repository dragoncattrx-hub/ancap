"""Schemas for the startup-investment literacy desk."""
from __future__ import annotations

from pydantic import BaseModel, Field


class StartupInvestRefPublic(BaseModel):
    id: str
    title: str
    url: str
    note: str


class StartupInvestSectorPublic(BaseModel):
    id: str
    label: str
    role: str
    thesis: str


class StartupInvestBriefPublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    sector: str
    price_from_acp: str
    blurb: str


class StartupInvestPrinciplePublic(BaseModel):
    id: str
    title: str
    body: str


class StartupInvestCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    as_of: str
    research_ref: StartupInvestRefPublic
    research_refs: list[StartupInvestRefPublic] = Field(default_factory=list)
    sectors: list[StartupInvestSectorPublic] = Field(default_factory=list)
    principles: list[StartupInvestPrinciplePublic] = Field(default_factory=list)
    briefs: list[StartupInvestBriefPublic]
    principles_doc: str = "docs/STARTUP_INVEST_DESK.md"
    legal_href: str = "/legal/research-refs"
