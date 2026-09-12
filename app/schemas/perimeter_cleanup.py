"""Schemas for perimeter cleanup field service (Abrams Suite-B vault)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

ContaminationKind = Literal[
    "chemical",
    "biological",
    "radiological_survey",
    "industrial",
    "oil_hydrocarbon",
    "soil",
    "water",
    "mixed_all",
]

JobStatus = Literal["draft", "quoted", "scheduled", "in_progress", "completed", "cancelled"]


class PerimeterServicePublic(BaseModel):
    id: str
    label: str
    contamination: ContaminationKind
    description: str
    price_from_acp: str
    unit: str
    licensed_operator_required: bool = True
    small_operator: bool = False


class PerimeterCatalogPublic(BaseModel):
    title: str
    tagline: str
    cipher: dict[str, str]
    compliance_note: str
    accessibility_note: str = ""
    market_structure_note: str = ""
    not_rwa_yield: bool = True
    services: list[PerimeterServicePublic]


class PerimeterCipherInfo(BaseModel):
    cipher_id: str
    algorithm: str
    kdf: str
    aad: str
    note: str


class PerimeterJobCreate(BaseModel):
    service_id: str = Field(..., min_length=2, max_length=64)
    contamination: ContaminationKind
    site_label: str = Field(..., min_length=2, max_length=200)
    perimeter_meters: str | None = Field(default=None, max_length=32)
    address_or_coords: str | None = Field(default=None, max_length=400)
    contact_hint: str | None = Field(default=None, max_length=200)
    schedule_window: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=4000)
    survey_json: dict[str, Any] | None = None
    extra: dict[str, Any] | None = None

    @field_validator("service_id", "site_label")
    @classmethod
    def _strip(cls, v: str) -> str:
        return (v or "").strip()


class PerimeterJobSummary(BaseModel):
    id: str
    service_id: str
    contamination: ContaminationKind
    site_label_hint: str
    status: JobStatus
    cipher_id: str
    content_hash: str
    created_at: datetime
    updated_at: datetime


class PerimeterJobPublic(PerimeterJobSummary):
    payload: dict[str, Any]


class PerimeterJobListResponse(BaseModel):
    items: list[PerimeterJobSummary]
    cipher_id: str
