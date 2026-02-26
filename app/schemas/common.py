from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

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
    value: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


def datetime_serializer(v: datetime) -> str:
    return v.isoformat() if v else None
