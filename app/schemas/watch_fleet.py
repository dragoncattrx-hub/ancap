"""Apple Watch HR fleet schemas (R10)."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class WatchSlot(str, Enum):
    a = "a"
    b = "b"
    c = "c"


class WatchAssetStatus(str, Enum):
    active = "active"
    charging = "charging"
    spare = "spare"
    lost = "lost"
    maintenance = "maintenance"


class WatchAssetCreate(BaseModel):
    employee_user_id: UUID
    slot: WatchSlot
    band_color: str = Field(min_length=1, max_length=40)
    serial_number: str = Field(min_length=3, max_length=120)
    status: WatchAssetStatus = WatchAssetStatus.spare


class WatchRotateRequest(BaseModel):
    employee_user_id: UUID
    to_slot: WatchSlot
    battery_percent: int | None = Field(default=None, ge=0, le=100)
    note: str | None = Field(default=None, max_length=400)


class WatchRotationPolicyUpsert(BaseModel):
    enabled: bool = True
    rotation_interval_minutes: int = Field(default=240, ge=30, le=24 * 60)
    min_soc_percent: int = Field(default=25, ge=5, le=95)
    grace_minutes: int = Field(default=15, ge=0, le=180)
    viewer_roles: list[str] = Field(default_factory=lambda: ["owner", "admin"])


class HeartRateIngestSample(BaseModel):
    recorded_at: datetime
    bpm: int = Field(ge=20, le=250)
    watch_asset_id: UUID | None = None
    source: str = Field(default="healthkit", max_length=40)


class HeartRateIngestRequest(BaseModel):
    employee_user_id: UUID
    on_shift: bool = True
    samples: list[HeartRateIngestSample] = Field(min_length=1, max_length=500)


class WatchAssetPublic(BaseModel):
    id: UUID
    org_id: UUID
    employee_user_id: UUID
    slot: WatchSlot
    band_color: str
    serial_number: str
    status: WatchAssetStatus
    battery_percent: int | None
    last_rotated_at: datetime | None
    created_at: datetime


class WatchRotationPolicyPublic(BaseModel):
    org_id: UUID
    enabled: bool
    rotation_interval_minutes: int
    min_soc_percent: int
    grace_minutes: int
    viewer_roles: list[str]
    updated_at: datetime


class HeartRateSamplePublic(BaseModel):
    id: UUID
    org_id: UUID
    employee_user_id: UUID
    watch_asset_id: UUID | None
    bpm: int
    on_shift: bool
    source: str
    recorded_at: datetime


class WatchFleetSummary(BaseModel):
    org_id: UUID
    watches_total: int
    watches_active: int
    employees_covered: int
    latest_hr_at: datetime | None
    rotation_enabled: bool
