from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ContractStatus(str, Enum):
    draft = "draft"
    proposed = "proposed"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"


class PaymentModel(str, Enum):
    fixed = "fixed"
    per_run = "per_run"


class ContractCreateRequest(BaseModel):
    employer_agent_id: str
    worker_agent_id: str
    scope_type: str = Field(..., examples=["strategy", "listing", "vertical", "custom"])
    scope_ref_id: Optional[str] = None
    title: str
    description: str = ""
    payment_model: PaymentModel
    fixed_amount_value: Optional[str] = None
    currency: str = "VUSD"
    max_runs: Optional[int] = None
    risk_policy_id: Optional[str] = None
    created_from_order_id: Optional[str] = None


class ContractUpdateRequest(BaseModel):
    status: ContractStatus


class ContractPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employer_agent_id: str
    worker_agent_id: str
    scope_type: str
    scope_ref_id: Optional[str] = None
    title: str
    description: str
    status: ContractStatus
    payment_model: PaymentModel
    fixed_amount_value: Optional[str] = None
    currency: str
    max_runs: Optional[int] = None
    risk_policy_id: Optional[str] = None
    created_from_order_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

