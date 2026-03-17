from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.schemas.strategies import FeeModel


class ListingStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class ListingCreateRequest(BaseModel):
    strategy_id: str
    strategy_version_id: str
    fee_model: FeeModel
    status: ListingStatus = ListingStatus.active
    terms_url: str | None = None
    notes: str | None = None


class ListingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    strategy_id: str
    strategy_version_id: str | None = None
    fee_model: dict
    status: ListingStatus
    created_at: datetime
