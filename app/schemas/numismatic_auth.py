"""Banknote/coin authenticity + numismatic valuation (mobile prototype).

Educational desk — not a forensic lab or guaranteed appraisal.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


InstrumentKind = Literal["banknote", "coin"]
AuthVerdict = Literal["likely_genuine", "needs_review", "suspect", "insufficient_data"]
GradeCode = Literal["G", "VG", "F", "VF", "XF", "AU", "UNC", "PR"]
RarityTier = Literal["common", "scarce", "rare", "very_rare", "unique_est"]


class NumismaticCatalogCurrency(BaseModel):
    code: str
    label: str
    note_series: list[str] = Field(default_factory=list)
    coin_series: list[str] = Field(default_factory=list)


class NumismaticFeatureDef(BaseModel):
    id: str
    label: str
    applies_to: list[InstrumentKind]
    weight: float = Field(ge=0, le=1)


class NumismaticCatalogPublic(BaseModel):
    currencies: list[NumismaticCatalogCurrency]
    features: list[NumismaticFeatureDef]
    grades: list[dict[str, str]]
    rarity_tiers: list[dict[str, str]]
    disclaimer: str


class NumismaticAuthRequest(BaseModel):
    kind: InstrumentKind
    currency_code: str = Field(..., min_length=2, max_length=8)
    series_or_denomination: str = Field(..., min_length=1, max_length=80)
    year: int | None = Field(default=None, ge=1500, le=2100)
    serial_or_mint_mark: str | None = Field(default=None, max_length=64)
    # Observed security / physical checks (ids from catalog.features)
    features_present: list[str] = Field(default_factory=list)
    features_missing: list[str] = Field(default_factory=list)
    features_unchecked: list[str] = Field(default_factory=list)
    # Optional device-like measurements for coins
    measured_weight_g: str | None = None
    measured_diameter_mm: str | None = None
    magnetic: bool | None = None
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("currency_code")
    @classmethod
    def _ccy(cls, v: str) -> str:
        return (v or "").strip().upper()


class NumismaticAuthPublic(BaseModel):
    kind: InstrumentKind
    currency_code: str
    series_or_denomination: str
    authenticity_score: int = Field(ge=0, le=100)
    verdict: AuthVerdict
    checks: list[dict[str, Any]]
    flags: list[str] = Field(default_factory=list)
    next_step: str
    disclaimer: str


class NumismaticValueRequest(BaseModel):
    kind: InstrumentKind
    currency_code: str = Field(..., min_length=2, max_length=8)
    series_or_denomination: str = Field(..., min_length=1, max_length=80)
    year: int | None = Field(default=None, ge=1500, le=2100)
    grade: GradeCode = "VF"
    rarity: RarityTier = "common"
    face_value_hint: str | None = Field(
        default=None,
        description="Optional face value in local currency, e.g. 100",
    )
    authenticity_score: int | None = Field(default=None, ge=0, le=100)
    quantity: int = Field(default=1, ge=1, le=1000)

    @field_validator("currency_code")
    @classmethod
    def _ccy(cls, v: str) -> str:
        return (v or "").strip().upper()


class NumismaticValuePublic(BaseModel):
    kind: InstrumentKind
    currency_code: str
    series_or_denomination: str
    grade: GradeCode
    rarity: RarityTier
    indicative_acp_amount: str
    face_reference_acp: str | None = None
    premium_factor: str
    rate_note: str
    authenticity_note: str
    next_step: str
    disclaimer: str
