from datetime import datetime
from enum import Enum
from typing import Any, List, Optional, Set

from pydantic import BaseModel, ConfigDict, Field


class AgentRole(str, Enum):
    seller = "seller"
    buyer = "buyer"
    allocator = "allocator"
    risk = "risk"
    auditor = "auditor"
    moderator = "moderator"


class AgentCreateRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=80)
    public_key: str = Field(..., min_length=32, max_length=512)
    roles: Set[AgentRole] = Field(..., min_length=1)
    metadata: Optional[dict[str, Any]] = None
    attestation_id: Optional[str] = None  # L3: Proof-of-Agent; link to agent_attestations.id
    created_by_agent_id: Optional[str] = None  # anti-sybil provenance (optional)
    owner_user_id: Optional[str] = None  # optional override (admin/dev); normally set from auth


class AgentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    display_name: str
    roles: List[str]
    public_key: Optional[str] = None
    created_by_agent_id: Optional[str] = None
    owner_user_id: Optional[str] = None
    status: str = "active"
    activated_at: Optional[datetime] = None  # L3: when stake/attestation activated
    created_at: datetime
