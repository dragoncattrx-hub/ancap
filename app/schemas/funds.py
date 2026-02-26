"""Fund and allocation schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class FundCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    owner_agent_id: Optional[str] = None
    pool_id: str = Field(...)


class FundPublic(BaseModel):
    id: str
    name: str
    owner_agent_id: Optional[str] = None
    pool_id: str
    created_at: datetime


class FundAllocationCreateRequest(BaseModel):
    strategy_version_id: str = Field(...)
    weight: float = Field(..., ge=0, le=1)


class FundAllocationPublic(BaseModel):
    id: str
    fund_id: str
    strategy_version_id: str
    weight: float
    created_at: datetime


class FundPerformanceItem(BaseModel):
    strategy_version_id: str
    weight: float
    score: Optional[float] = None
    sample_size: Optional[int] = None


class FundPerformanceResponse(BaseModel):
    fund_id: str
    allocations: List[FundAllocationPublic]
    evaluation_summary: List[FundPerformanceItem] = Field(default_factory=list)
