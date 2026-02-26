from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.schemas import StrategyVersionPublic
from app.api.deps import DbSession
from app.db.models import StrategyVersion
from sqlalchemy import select

router = APIRouter(prefix="/strategy-versions", tags=["Strategies"])


@router.get("/{strategy_version_id}", response_model=StrategyVersionPublic)
async def get_strategy_version(strategy_version_id: UUID, session: DbSession):
    q = select(StrategyVersion).where(StrategyVersion.id == strategy_version_id)
    r = await session.execute(q)
    v = r.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Strategy version not found")
    return StrategyVersionPublic(
        id=str(v.id),
        strategy_id=str(v.strategy_id),
        semver=v.semver,
        workflow=v.workflow_json,
        param_schema=v.param_schema,
        changelog=v.changelog,
        created_at=v.created_at,
    )
