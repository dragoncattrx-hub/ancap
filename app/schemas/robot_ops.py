from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ServerInstallBountyCreate(BaseModel):
    host_label: str = Field(..., min_length=2, max_length=128)
    payout_address: str = Field(..., min_length=8, max_length=128)
    amount_acp: str = Field(..., min_length=1, max_length=64)
    proof_url: Optional[str] = Field(None, max_length=1024)
    proof_note: Optional[str] = Field(None, max_length=4000)


class ServerInstallBountyPublic(BaseModel):
    id: str
    owner_user_id: str
    host_label: str
    payout_address: str
    amount_acp: str
    status: str
    proof_url: Optional[str] = None
    proof_note: Optional[str] = None
    created_at: datetime


class RobotTelemetryConsentCreate(BaseModel):
    robot_id: str = Field(..., min_length=2, max_length=128)
    retention_days: int = Field(default=30, ge=1, le=365)


class RobotTelemetryConsentPublic(BaseModel):
    id: str
    owner_user_id: str
    robot_id: str
    consent_active: bool
    retention_days: int
    created_at: datetime
    revoked_at: Optional[datetime] = None


class RobotTelemetryIngestRequest(BaseModel):
    robot_id: str = Field(..., min_length=2, max_length=128)
    event_type: str = Field(..., min_length=2, max_length=64)
    payload: dict[str, Any] = Field(default_factory=dict)


class RobotTelemetryEventPublic(BaseModel):
    id: str
    robot_id: str
    event_type: str
    created_at: datetime


class RobotDeliveryCreate(BaseModel):
    pickup_label: str = Field(..., min_length=2, max_length=255)
    dropoff_label: str = Field(..., min_length=2, max_length=255)
    amount_acp: str = Field(..., min_length=1, max_length=64)
    robot_agent_id: Optional[str] = None


class RobotDeliveryPublic(BaseModel):
    id: str
    customer_user_id: str
    robot_agent_id: Optional[str] = None
    pickup_label: str
    dropoff_label: str
    amount_acp: str
    status: str
    delivery_proof: Optional[str] = None
    created_at: datetime


class RobotDeliveryAssignRequest(BaseModel):
    robot_agent_id: str = Field(..., min_length=1, max_length=64)


class RobotDeliveryCompleteRequest(BaseModel):
    delivery_proof: str = Field(..., min_length=2, max_length=4000)
