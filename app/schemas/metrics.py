from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class MetricRecordPublic(BaseModel):
    run_id: str
    name: str
    value: float | str | dict[str, Any]


class EvaluationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    strategy_version_id: str
    score: float
    confidence: float
    sample_size: int
    percentile_in_vertical: Optional[float] = None
    updated_at: datetime
