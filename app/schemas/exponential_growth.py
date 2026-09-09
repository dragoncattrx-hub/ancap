"""Schemas for exponential network growth / compound quotes."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ExponentialGrowthPublic(BaseModel):
    user_id: str
    direct_referrals: int
    passport_verified_referrals: int
    active_agents: int
    effective_depth: int
    base_rate: str
    network_multiplier: str
    passport_multiplier: str
    total_multiplier: str
    compound_preview: dict[str, str]
    formula: str
    note: str


class ExponentialCompoundQuoteRequest(BaseModel):
    principal_acp: str = Field(..., description="Principal ACP amount")
    periods: int = Field(default=12, ge=1, le=120, description="Compound periods")


class ExponentialCompoundQuoteResponse(BaseModel):
    principal_acp: str
    periods: int
    period_multiplier: str
    projected_acp: str
    growth: ExponentialGrowthPublic
