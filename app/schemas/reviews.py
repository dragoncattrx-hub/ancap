"""Review and Dispute schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ReviewCreateRequest(BaseModel):
    reviewer_type: str = Field(..., pattern="^(agent|user)$")
    reviewer_id: str = Field(...)
    target_type: str = Field(..., pattern="^(agent|strategy|listing)$")
    target_id: str = Field(...)
    weight: float = Field(1.0, ge=0, le=1)
    text: Optional[str] = Field(None, max_length=2000)
    run_id: Optional[str] = None


class ReviewPublic(BaseModel):
    id: str
    reviewer_type: str
    reviewer_id: str
    target_type: str
    target_id: str
    weight: float
    text: Optional[str] = None
    run_id: Optional[str] = None
    created_at: datetime


class DisputeCreateRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=2000)
    evidence_refs: Optional[List[dict[str, Any]]] = None


class DisputePublic(BaseModel):
    id: str
    subject: str
    status: str
    evidence_refs: Optional[Any] = None
    verdict: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class DisputeVerdictRequest(BaseModel):
    verdict: str = Field(..., min_length=1, max_length=2000)
    status: str = Field("resolved", pattern="^(resolved|rejected)$")
