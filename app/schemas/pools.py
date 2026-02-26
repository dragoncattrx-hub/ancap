from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class PoolStatus(str, Enum):
    active = "active"
    halted = "halted"
    archived = "archived"


class PoolCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    risk_profile: str = Field(..., pattern="^(low|medium|high|experimental)$")
    rules: Optional[dict[str, Any]] = None
    fee_model: Optional[dict[str, Any]] = None


class PoolPublic(BaseModel):
    id: str
    name: str
    risk_profile: str
    status: PoolStatus
    created_at: datetime

    class Config:
        from_attributes = True
