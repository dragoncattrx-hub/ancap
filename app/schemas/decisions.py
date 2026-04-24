from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DecisionLogPublic(BaseModel):
    id: str
    decision: str
    reason_code: str
    message: str | None = None
    scope: str
    actor_type: str | None = None
    actor_id: str | None = None
    subject_type: str | None = None
    subject_id: str | None = None
    threshold_value: str | None = None
    actual_value: str | None = None
    metadata_json: dict[str, Any] | None = None
    created_at: datetime

