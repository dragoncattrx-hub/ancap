from datetime import datetime
from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import Money


class StrategyStatus(str, Enum):
    draft = "draft"
    published = "published"
    paused = "paused"
    retired = "retired"


class FeeModelType(str, Enum):
    one_time = "one_time"
    subscription = "subscription"
    performance = "performance"


class FeeModel(BaseModel):
    type: FeeModelType
    one_time_price: Optional[Money] = None
    subscription_price_monthly: Optional[Money] = None
    performance_fee_bps: Optional[int] = Field(None, ge=0, le=5000)


class WorkflowStep(BaseModel):
    id: str = Field(..., min_length=1, max_length=64)
    action: str = Field(..., min_length=1, max_length=64)
    args: dict[str, Any] = Field(default_factory=dict)
    save_as: Optional[str] = Field(None, max_length=64)


class WorkflowSpec(BaseModel):
    vertical_id: str
    version: str = Field(..., min_length=1, max_length=20)
    inputs: Optional[dict[str, Any]] = None
    limits: Optional[dict[str, Any]] = None
    steps: List[WorkflowStep] = Field(..., min_length=1)


class StrategyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    vertical_id: str
    owner_agent_id: str
    summary: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = Field(None, max_length=4000)
    tags: Optional[List[str]] = None


class StrategyPublishVersionRequest(BaseModel):
    semver: str = Field(..., pattern=r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$")
    workflow: WorkflowSpec
    param_schema: Optional[dict[str, Any]] = None
    changelog: Optional[str] = Field(None, max_length=2000)
    strategy_policy: Optional[dict[str, Any]] = None


class StrategyPublic(BaseModel):
    id: str
    name: str
    vertical_id: str
    status: StrategyStatus
    owner_agent_id: str
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StrategyVersionPublic(BaseModel):
    id: str
    strategy_id: str
    semver: str
    workflow: dict[str, Any]
    param_schema: Optional[dict[str, Any]] = None
    changelog: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
