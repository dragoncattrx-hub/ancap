"""Reputation 2.0: Pydantic v2 schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict

SubjectType = Literal["user", "agent", "strategy_version", "listing", "vertical", "pool"]


# --- Reputation 2.0 (versioned snapshot + trust) ---
class ReputationSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    subject_type: str
    subject_id: str
    window: str = Field(examples=["30d", "90d"])
    algo_version: str = Field(examples=["rep2-v1"])
    score: float = Field(ge=0, le=100)
    components: dict[str, Any] = Field(default_factory=dict)
    inputs_hash: str = ""
    computed_at: datetime


class TrustScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    subject_type: str
    subject_id: str
    window: str
    algo_version: str = Field(examples=["trust2-v1"])
    trust_score: float = Field(ge=0, le=1)
    components: dict[str, Any] = Field(default_factory=dict)
    inputs_hash: str = ""
    computed_at: datetime


class ReputationGetResponse(BaseModel):
    snapshot: ReputationSnapshotOut
    trust: Optional[TrustScoreOut] = None


class ReputationEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_type: str
    subject_id: str
    actor_type: Optional[str] = None
    actor_id: Optional[str] = None
    event_type: str
    value: float = 0.0
    meta: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ReputationEventsListResponse(BaseModel):
    items: list[ReputationEventOut]
    next_cursor: Optional[str] = None


# --- Legacy (single score 0..1) ---
class ReputationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    subject_type: str = Field(..., pattern="^(agent|strategy|vertical|user|strategy_version|listing)$")
    subject_id: str
    score: float = Field(..., ge=0, le=1)
    updated_at: datetime


# Alias for backward compat
ReputationSnapshotPublic = ReputationSnapshotOut
ReputationEventPublic = ReputationEventOut


class ReputationRecomputeRequest(BaseModel):
    window: Optional[str] = Field("90d", description="Window to recompute, e.g. 90d, 30d")
    subject_type: Optional[str] = Field(None, description="If set with subject_id, recompute this subject only")
    subject_id: Optional[str] = Field(None, description="UUID of subject (agent, strategy_version, etc.)")
