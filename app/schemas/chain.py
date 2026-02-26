"""L3: On-chain anchoring schemas."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class AnchorCreateRequest(BaseModel):
    chain_id: str = Field(..., max_length=32)
    payload_type: str = Field(..., max_length=32)  # stake, slash, settlement, run_anchor
    payload_hash: str = Field(..., min_length=32, max_length=64)
    payload_json: Optional[dict[str, Any]] = None


class AnchorPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    chain_id: str
    tx_hash: Optional[str] = None
    payload_type: str
    payload_hash: str
    anchored_at: datetime
