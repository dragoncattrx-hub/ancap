from datetime import datetime
from enum import Enum
from typing import Any, List, Optional, Set

from pydantic import BaseModel, Field


class VerticalStatus(str, Enum):
    proposed = "proposed"
    approved = "approved"
    active = "active"
    deprecated = "deprecated"
    rejected = "rejected"


class ActionSpec(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = Field(None, max_length=300)
    args_schema: dict[str, Any]
    output_schema: Optional[dict[str, Any]] = None


class MetricSpec(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = Field(None, max_length=300)
    value_schema: dict[str, Any]


class ResourceType(str, Enum):
    data_feed = "data_feed"
    connector_api = "connector_api"
    llm_api = "llm_api"
    storage = "storage"
    payment_rail = "payment_rail"
    web_request = "web_request"


class VerticalSpec(BaseModel):
    allowed_actions: List[ActionSpec] = Field(..., min_length=1)
    required_resources: Set[ResourceType] = Field(...)
    metrics: List[MetricSpec] = Field(..., min_length=1)
    risk_spec: dict[str, Any] = Field(default_factory=dict)
    workflow_schema: Optional[dict[str, Any]] = None


class VerticalProposeRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    spec: VerticalSpec
    rationale: Optional[str] = Field(None, max_length=2000)


class VerticalPublic(BaseModel):
    id: str
    name: str
    status: VerticalStatus
    owner_agent_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VerticalWithSpec(VerticalPublic):
    spec: VerticalSpec


class VerticalReviewRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = Field(None, max_length=2000)
