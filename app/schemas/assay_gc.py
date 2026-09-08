"""Gas-chromatography / assay purity prototype schemas.

Educational desk prototype — not a certified laboratory instrument.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


AssayMode = Literal["metal_xrf_proxy", "gas_chromatograph"]
AssayConfidence = Literal["high", "medium", "low", "simulated"]


class AssayPeak(BaseModel):
    """One chromatographic / spectral peak."""

    label: str = Field(..., min_length=1, max_length=64)
    retention_or_energy: str = Field(
        ...,
        description="Retention time (min) for GC, or keV/channel for metal XRF proxy",
    )
    area_pct: str = Field(..., description="Relative peak area %, 0..100")
    notes: str | None = Field(default=None, max_length=200)


class AssayGcCatalogItem(BaseModel):
    mode: AssayMode
    label: str
    target_assets: list[str]
    unit_hint: str
    note: str


class AssayGcCatalogPublic(BaseModel):
    modes: list[AssayGcCatalogItem]
    disclaimer: str
    device_prototype: str = "ANCAP GC/XRF desk prototype v0"


class AssayGcAnalyzeRequest(BaseModel):
    mode: AssayMode
    # Target material
    metal: Literal["gold", "silver", "platinum", "palladium"] | None = None
    commodity: Literal["natural_gas", "oil"] | None = None
    quantity: str = Field(..., description="Grams for metal, m³ for gas, bbl for oil")
    # Device reading
    peaks: list[AssayPeak] | None = Field(
        default=None,
        description="Raw peaks from GC/XRF-like device. If omitted with simulate=true, synthetic peaks are generated.",
    )
    simulate: bool = Field(
        default=False,
        description="Generate a synthetic chromatogram/spectrum for demo when peaks omitted",
    )
    declared_purity_ppt: int | None = Field(
        default=None,
        ge=100,
        le=1000,
        description="Optional claimed purity (metals) used only for simulate=true",
    )
    device_id: str | None = Field(default=None, max_length=64)
    sample_id: str | None = Field(default=None, max_length=64)

    @field_validator("quantity")
    @classmethod
    def _qty(cls, v: str) -> str:
        s = (v or "").strip()
        if not s:
            raise ValueError("quantity required")
        return s


class AssayComponentResult(BaseModel):
    label: str
    area_pct: str
    role: Literal["target", "diluent", "contaminant", "inert", "unknown"]
    value_weight: str = Field(description="0..1 contribution to assay purity score")


class AssayGcAnalyzePublic(BaseModel):
    mode: AssayMode
    sample_id: str
    device_id: str | None
    asset_label: str
    quantity: str
    quantity_unit: str
    purity_pct: str
    purity_ppt: int | None = None
    composition: list[AssayComponentResult]
    peaks_normalized: list[AssayPeak]
    indicative_acp_amount: str
    rate_note: str
    confidence: AssayConfidence
    flags: list[str] = Field(default_factory=list)
    next_step: str
    disclaimer: str
    details: dict[str, Any] = Field(default_factory=dict)
