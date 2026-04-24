from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import DecisionLog


async def log_reject_decision(
    session: AsyncSession,
    *,
    reason_code: str,
    message: str | None,
    scope: str,
    actor_type: str | None = None,
    actor_id: UUID | None = None,
    subject_type: str | None = None,
    subject_id: UUID | None = None,
    threshold_value: str | None = None,
    actual_value: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    row = DecisionLog(
        decision="reject",
        reason_code=reason_code,
        message=message,
        scope=scope,
        actor_type=actor_type,
        actor_id=actor_id,
        subject_type=subject_type,
        subject_id=subject_id,
        threshold_value=threshold_value,
        actual_value=actual_value,
        metadata_json=metadata or {},
    )
    session.add(row)
    await session.flush()
    # Persist even if caller raises HTTPException and request transaction is rolled back.
    await session.commit()

