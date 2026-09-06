"""Securities intake API (R9)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.securities import (
    SecurityCustodyPositionPublic,
    SecurityDeskSummary,
    SecurityIntakeCreate,
    SecurityIntakePublic,
    SecurityIntakeReview,
)
from app.services import securities_intake as svc

router = APIRouter(prefix="/organizations/{org_id}/securities", tags=["Securities"])


@router.get("/summary", response_model=SecurityDeskSummary)
async def securities_summary(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.desk_summary(session, org_id=org_id, user_id=user_id)


@router.post("/intake", response_model=SecurityIntakePublic, status_code=201)
async def create_intake(
    org_id: str,
    body: SecurityIntakeCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_intake(session, org_id=org_id, user_id=user_id, body=body)


@router.get("/intake", response_model=list[SecurityIntakePublic])
async def list_intakes(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_intakes(session, org_id=org_id, user_id=user_id)


@router.get("/intake/{intake_id}", response_model=SecurityIntakePublic)
async def get_intake(
    org_id: str,
    intake_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.get_intake(session, org_id=org_id, user_id=user_id, intake_id=intake_id)


@router.post("/intake/{intake_id}/submit", response_model=SecurityIntakePublic)
async def submit_intake(
    org_id: str,
    intake_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.submit_intake(session, org_id=org_id, user_id=user_id, intake_id=intake_id)


@router.post("/intake/{intake_id}/review", response_model=SecurityIntakePublic)
async def review_intake(
    org_id: str,
    intake_id: str,
    body: SecurityIntakeReview,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.review_intake(
        session, org_id=org_id, user_id=user_id, intake_id=intake_id, body=body
    )


@router.get("/positions", response_model=list[SecurityCustodyPositionPublic])
async def list_positions(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_positions(session, org_id=org_id, user_id=user_id)
