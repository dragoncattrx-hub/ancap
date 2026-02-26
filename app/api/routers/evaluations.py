from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas import EvaluationPublic
from app.api.deps import DbSession
from app.db.models import Evaluation
from sqlalchemy import select

router = APIRouter(prefix="/evaluations", tags=["Metrics"])


@router.get("/{strategy_version_id}", response_model=EvaluationPublic)
async def get_evaluation(strategy_version_id: UUID, session: DbSession):
    q = select(Evaluation).where(Evaluation.strategy_version_id == strategy_version_id)
    r = await session.execute(q)
    ev = r.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return EvaluationPublic(
        strategy_version_id=str(ev.strategy_version_id),
        score=float(ev.score),
        confidence=float(ev.confidence),
        sample_size=ev.sample_size,
        percentile_in_vertical=float(ev.percentile_in_vertical) if ev.percentile_in_vertical else None,
        updated_at=ev.updated_at,
    )
