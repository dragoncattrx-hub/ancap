"""Orbital sealed-edge schemas (R11)."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class OrbitalNodeStatus(str, Enum):
    planned = "planned"
    flatsat = "flatsat"
    manifested = "manifested"
    launched = "launched"
    leop = "leop"
    nominal = "nominal"
    anomaly = "anomaly"
    deorbit = "deorbit"
    retired = "retired"


class OrbitalAttestationKind(str, Enum):
    sealed_boot = "sealed_boot"
    encrypted_volume = "encrypted_volume"
    command_path = "command_path"
    health_ping = "health_ping"


class OrbitalNodeCreate(BaseModel):
    codename: str = Field(min_length=2, max_length=80)
    norad_id: str | None = Field(default=None, max_length=32)
    launch_provider: str = Field(default="spacex", max_length=40)
    rideshare_slot: str | None = Field(default=None, max_length=80)
    mass_kg: float | None = Field(default=None, gt=0, le=500)
    status: OrbitalNodeStatus = OrbitalNodeStatus.planned
    metadata_json: dict = Field(default_factory=dict)


class OrbitalNodeUpdate(BaseModel):
    status: OrbitalNodeStatus | None = None
    norad_id: str | None = Field(default=None, max_length=32)
    rideshare_slot: str | None = Field(default=None, max_length=80)
    metadata_json: dict | None = None


class OrbitalAttestationCreate(BaseModel):
    kind: OrbitalAttestationKind
    digest_sha256: str = Field(min_length=64, max_length=128)
    payload_uri: str | None = Field(default=None, max_length=512)
    verified: bool = False
    metadata_json: dict = Field(default_factory=dict)


class OrbitalNodePublic(BaseModel):
    id: UUID
    codename: str
    norad_id: str | None
    launch_provider: str
    rideshare_slot: str | None
    mass_kg: float | None
    status: OrbitalNodeStatus
    feature_enabled: bool
    metadata_json: dict
    created_at: datetime
    updated_at: datetime


class OrbitalAttestationPublic(BaseModel):
    id: UUID
    node_id: UUID
    kind: OrbitalAttestationKind
    digest_sha256: str
    payload_uri: str | None
    verified: bool
    created_at: datetime
    metadata_json: dict


class OrbitalEdgeStatusPublic(BaseModel):
    feature_enabled: bool
    nodes_total: int
    nodes_nominal: int
    attestations_verified: int
    next_gate: str
    notes: str
