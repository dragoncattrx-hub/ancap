"""ACP Insurance schemas — universal coverage desk settled in ACP."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

CoverageClass = Literal[
    "wallet_theft",
    "bridge_ops",
    "cargo_shipping",
    "real_estate",
    "commodities",
    "health_travel",
    "device_nfc",
    "cyber_incident",
    "livestock",
    "space_payload",
    "custom",
]

PolicyStatus = Literal["active", "expired", "cancelled", "claimed"]
ClaimStatus = Literal["filed", "approved", "denied", "paid"]


class InsuranceProductPublic(BaseModel):
    coverage_class: CoverageClass
    label: str
    description: str
    pool_id: str
    min_sum_insured_acp: str
    max_sum_insured_acp: str
    premium_bps: int
    term_days_default: int
    asset_ref_types: list[str] = Field(default_factory=list)


class InsuranceCatalogPublic(BaseModel):
    title: str
    tagline: str
    currency: str = "ACP"
    compliance_note: str
    products: list[InsuranceProductPublic]


class InsuranceQuoteRequest(BaseModel):
    coverage_class: CoverageClass
    sum_insured_acp: str
    term_days: int = Field(default=30, ge=1, le=3650)
    asset_ref_type: Optional[str] = Field(default=None, max_length=48)
    asset_ref_id: Optional[str] = Field(default=None, max_length=128)


class InsuranceQuotePublic(BaseModel):
    coverage_class: CoverageClass
    pool_id: str
    sum_insured_acp: str
    premium_acp: str
    premium_bps: int
    term_days: int
    starts_at: datetime
    ends_at: datetime
    quote_hash: str


class InsurancePolicyCreate(BaseModel):
    coverage_class: CoverageClass
    sum_insured_acp: str
    term_days: int = Field(default=30, ge=1, le=3650)
    asset_ref_type: Optional[str] = Field(default=None, max_length=48)
    asset_ref_id: Optional[str] = Field(default=None, max_length=128)
    note: Optional[str] = Field(default=None, max_length=480)


class InsurancePolicyPublic(BaseModel):
    id: UUID
    pool_id: str
    coverage_class: CoverageClass
    coverage_json: dict[str, Any]
    asset_ref_type: Optional[str] = None
    asset_ref_id: Optional[str] = None
    sum_insured_acp: str
    premium_acp: str
    status: PolicyStatus
    contract_hash: str
    starts_at: datetime
    ends_at: datetime
    created_at: datetime


class InsuranceClaimCreate(BaseModel):
    amount_acp: str
    note: Optional[str] = Field(default=None, max_length=1000)
    evidence: dict[str, Any] = Field(default_factory=dict)

    @field_validator("evidence")
    @classmethod
    def cap_evidence(cls, value: dict[str, Any]) -> dict[str, Any]:
        import json

        blob = json.dumps(value, default=str)
        if len(blob) > 8192:
            raise ValueError("evidence payload too large (max 8KB)")
        return value


class InsuranceClaimPublic(BaseModel):
    id: UUID
    policy_id: UUID
    amount_acp: str
    status: ClaimStatus
    note: Optional[str] = None
    contract_hash: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
