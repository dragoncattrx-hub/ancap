from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_serializer

T = TypeVar("T")


class Error(BaseModel):
    error: str
    message: str
    details: Optional[dict[str, Any]] = None


class Pagination(BaseModel, Generic[T]):
    items: List[T]
    next_cursor: Optional[str] = None


class Money(BaseModel):
    amount: str = Field(..., pattern=r"^-?\d+(\.\d+)?$", description="Decimal string")
    currency: str = Field(..., min_length=2, max_length=10)


# RiskProfile: use str with pattern in request schemas (e.g. PoolCreateRequest)


class Timestamp(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    value: datetime
    
    @field_serializer('value')
    def serialize_datetime(self, v: datetime) -> str:
        return v.isoformat() if v else None


def datetime_serializer(v: datetime) -> str:
    return v.isoformat() if v else None
