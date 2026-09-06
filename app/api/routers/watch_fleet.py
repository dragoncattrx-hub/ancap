"""Apple Watch HR fleet API (R10)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_auth
from app.schemas.watch_fleet import (
    HeartRateIngestRequest,
    HeartRateSamplePublic,
    WatchAssetCreate,
    WatchAssetPublic,
    WatchFleetSummary,
    WatchRotateRequest,
    WatchRotationPolicyPublic,
    WatchRotationPolicyUpsert,
)
from app.services import watch_fleet as svc

router = APIRouter(prefix="/organizations/{org_id}/watch-fleet", tags=["Watch Fleet"])


@router.get("/summary", response_model=WatchFleetSummary)
async def fleet_summary(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.fleet_summary(session, org_id=org_id, user_id=user_id)


@router.post("/watches", response_model=WatchAssetPublic, status_code=201)
async def create_watch(
    org_id: str,
    body: WatchAssetCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_watch_asset(session, org_id=org_id, user_id=user_id, body=body)


@router.get("/watches", response_model=list[WatchAssetPublic])
async def list_watches(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
    employee_user_id: str | None = Query(default=None),
):
    return await svc.list_watch_assets(
        session, org_id=org_id, user_id=user_id, employee_user_id=employee_user_id
    )


@router.post("/watches/rotate", response_model=list[WatchAssetPublic])
async def rotate_watches(
    org_id: str,
    body: WatchRotateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.rotate_watches(session, org_id=org_id, user_id=user_id, body=body)


@router.put("/rotation-policy", response_model=WatchRotationPolicyPublic)
async def upsert_policy(
    org_id: str,
    body: WatchRotationPolicyUpsert,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.upsert_rotation_policy(session, org_id=org_id, user_id=user_id, body=body)


@router.get("/rotation-policy", response_model=WatchRotationPolicyPublic | None)
async def get_policy(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.get_rotation_policy(session, org_id=org_id, user_id=user_id)


@router.post("/vitals/heartbeat/ingest", response_model=list[HeartRateSamplePublic], status_code=201)
async def ingest_hr(
    org_id: str,
    body: HeartRateIngestRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.ingest_heart_rate(session, org_id=org_id, user_id=user_id, body=body)


@router.get("/vitals/heartbeat", response_model=list[HeartRateSamplePublic])
async def list_hr(
    org_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
    employee_user_id: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    return await svc.list_heart_rate(
        session,
        org_id=org_id,
        user_id=user_id,
        employee_user_id=employee_user_id,
        limit=limit,
    )
