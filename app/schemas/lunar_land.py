"""Lunar land parcel registry + interest desk (R13)."""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class LunarParcelStatus(str, Enum):
    draft = "draft"
    listed = "listed"
    reserved = "reserved"
    settled = "settled"
    cancelled = "cancelled"


class LunarInterestKind(str, Enum):
    inquire = "inquire"
    reserve = "reserve"
    bid = "bid"


class LunarInterestStatus(str, Enum):
    draft = "draft"
    open = "open"
    matched = "matched"
    cancelled = "cancelled"
    settled = "settled"


class LunarLandStatusPublic(BaseModel):
    feature_enabled: bool
    division: str
    tagline: str
    parcels_listed: int
    interests_open: int
    science_note: str
    compliance_note: str
    lfm_reference: str
    next_gate: str


class LunarParcelPublic(BaseModel):
    id: UUID
    parcel_code: str
    name: str
    region: str
    lat_deg: float
    lon_deg: float
    area_km2: float
    list_price_acp: Decimal
    status: str
    source: str
    lfm_themes: list[str] = Field(default_factory=list)
    summary: str
    metadata_json: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class LunarInterestCreate(BaseModel):
    parcel_id: UUID
    kind: LunarInterestKind = LunarInterestKind.inquire
    budget_acp: Decimal = Field(gt=0, max_digits=36, decimal_places=18)
    notes: str | None = Field(default=None, max_length=2000)
    consent_acknowledged: bool = Field(
        description="User must acknowledge Outer Space Treaty / non-sovereign title disclaimer"
    )


class LunarInterestPublic(BaseModel):
    id: UUID
    parcel_id: UUID
    parcel_code: str | None = None
    kind: str
    status: str
    budget_acp: Decimal
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
