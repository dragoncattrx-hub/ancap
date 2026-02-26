from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas import MetricRecordPublic
from app.api.deps import DbSession
from app.db.models import MetricRecord as MetricRecordModel
from sqlalchemy import select

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("", response_model=dict)
async def list_metrics_for_run(session: DbSession, run_id: UUID):
    q = select(MetricRecordModel).where(MetricRecordModel.run_id == run_id)
    r = await session.execute(q)
    rows = r.scalars().all()
    return {
        "items": [
            MetricRecordPublic(run_id=str(m.run_id), name=m.name, value=m.value)
            for m in rows
        ]
    }


