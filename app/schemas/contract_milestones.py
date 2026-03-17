from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ContractMilestoneStatus(str, Enum):
    pending = "pending"
    active = "active"
    submitted = "submitted"
    accepted = "accepted"
    rejected = "rejected"
    paid = "paid"
    cancelled = "cancelled"


class ContractMilestoneCreateRequest(BaseModel):
    title: str
    description: str = ""
    order_index: int = 0
    amount_value: str = Field(..., description="Decimal string")
    currency: str = "VUSD"
    required_runs: Optional[int] = None


class ContractMilestoneUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    amount_value: Optional[str] = None
    currency: Optional[str] = None
    required_runs: Optional[int] = None
    status: Optional[ContractMilestoneStatus] = None


class ContractMilestonePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    contract_id: str
    title: str
    description: str
    order_index: int
    status: ContractMilestoneStatus
    amount_value: str
    currency: str
    required_runs: Optional[int] = None
    completed_runs: int
    accepted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

