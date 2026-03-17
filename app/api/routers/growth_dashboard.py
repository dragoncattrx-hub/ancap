from datetime import date, timedelta

from fastapi import APIRouter, Query
from sqlalchemy import select, desc

from app.api.deps import DbSession
from app.db.models import GrowthMetricRollup
from app.schemas import GrowthMetricItemPublic


router = APIRouter(prefix="/system", tags=["Growth Metrics"])


@router.get("/growth-metrics", response_model=list[GrowthMetricItemPublic])
async def get_growth_metrics(
    session: DbSession,
    days: int = Query(7, ge=1, le=90),
):
    since = date.today() - timedelta(days=days)
    q = (
        select(GrowthMetricRollup)
        .where(GrowthMetricRollup.metric_date >= since)
        .order_by(desc(GrowthMetricRollup.metric_date), GrowthMetricRollup.metric_key.asc())
        .limit(1000)
    )
    r = await session.execute(q)
    out = []
    for m in r.scalars().all():
        out.append(
            GrowthMetricItemPublic(
                metric_date=m.metric_date,
                metric_key=m.metric_key,
                metric_value=str(m.metric_value),
                dimensions=m.dimensions_json or {},
            )
        )
    return out

