"""L3: Stakes and slashing schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class StakeCreateRequest(BaseModel):
    amount: str = Field(..., min_length=1)
    currency: str = Field("ACP", max_length=10)


class StakePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    agent_id: str
    amount_currency: str
    amount_value: str
    status: str
    slash_reason: Optional[str] = None
    created_at: datetime
    released_at: Optional[datetime] = None


class SlashRequest(BaseModel):
    amount: str = Field(..., min_length=1)
    currency: str = Field("ACP", max_length=10)
    reason: str = Field(..., min_length=1, max_length=500)
