"""Watermark v2: (last_created_at, last_id) as opaque JSON for cursor-style incremental jobs."""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import JobWatermark


@dataclass(frozen=True)
class TsIdWatermark:
    ts: datetime
    id: str  # uuid string or any sortable id


def _ensure_tz(ts: datetime) -> datetime:
    if ts.tzinfo is None:
        return ts.replace(tzinfo=timezone.utc)
    return ts


async def get_ts_id_watermark(session: AsyncSession, key: str) -> Optional[TsIdWatermark]:
    r = await session.execute(select(JobWatermark).where(JobWatermark.key == key))
    row = r.scalar_one_or_none()
    if not row or not row.value:
        return None
    try:
        data = json.loads(row.value)
        ts = datetime.fromisoformat(data["ts"])
        return TsIdWatermark(ts=_ensure_tz(ts), id=str(data["id"]))
    except (json.JSONDecodeError, KeyError, TypeError):
        return None


async def set_ts_id_watermark(session: AsyncSession, key: str, wm: TsIdWatermark) -> None:
    value = json.dumps(
        {"ts": _ensure_tz(wm.ts).isoformat(), "id": wm.id},
        separators=(",", ":"),
        sort_keys=True,
    )
    stmt = insert(JobWatermark).values(key=key, value=value).on_conflict_do_update(
        index_elements=["key"],
        set_={"value": value, "updated_at": func.now()},
    )
    await session.execute(stmt)
