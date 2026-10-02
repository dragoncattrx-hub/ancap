"""ANCAP Dating cloud API."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_auth
from app.schemas.dating import (
    DatingAccessPointCreate,
    DatingAccessPointPublic,
    DatingCatalogPublic,
    DatingLikeRequest,
    DatingMatchPublic,
    DatingMessageCreate,
    DatingMessagePublic,
    DatingProfilePublic,
    DatingProfileUpsert,
    DatingReportCreate,
)
from app.services import dating as svc

router = APIRouter(prefix="/dating", tags=["ANCAP Dating"])


@router.get("/catalog", response_model=DatingCatalogPublic)
async def dating_catalog():
    return svc.catalog()


@router.get("/access-points", response_model=list[DatingAccessPointPublic])
async def dating_list_access_points(session: DbSession, limit: int = Query(100, ge=1, le=200)):
    rows = await svc.list_access_points(session, limit=limit)
    return [DatingAccessPointPublic(**svc.access_point_public(r)) for r in rows]


@router.post("/access-points", response_model=DatingAccessPointPublic, status_code=201)
async def dating_create_access_point(
    body: DatingAccessPointCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await svc.create_access_point(session, UUID(user_id), body)
    return DatingAccessPointPublic(**svc.access_point_public(row))


@router.get("/profile", response_model=DatingProfilePublic | None)
async def dating_get_profile(session: DbSession, user_id: str = Depends(require_auth)):
    row = await svc.get_profile(session, UUID(user_id))
    if row is None:
        return None
    return DatingProfilePublic(**svc._profile_public(row))


@router.put("/profile", response_model=DatingProfilePublic)
async def dating_put_profile(
    body: DatingProfileUpsert,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await svc.upsert_profile(session, UUID(user_id), body)
    return DatingProfilePublic(**svc._profile_public(row))


@router.post("/like")
async def dating_like(
    body: DatingLikeRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.like_user(session, UUID(user_id), UUID(body.to_user_id))


@router.get("/matches", response_model=list[DatingMatchPublic])
async def dating_matches(session: DbSession, user_id: str = Depends(require_auth)):
    rows = await svc.list_matches(session, UUID(user_id))
    return [DatingMatchPublic(**r) for r in rows]


@router.post("/messages", response_model=DatingMessagePublic, status_code=201)
async def dating_send_message(
    body: DatingMessageCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await svc.send_message(session, UUID(user_id), body)
    return DatingMessagePublic(
        id=str(row.id),
        match_id=str(row.match_id),
        sender_user_id=str(row.sender_user_id),
        body=row.body,
        created_at=row.created_at,
    )


@router.get("/messages", response_model=list[DatingMessagePublic])
async def dating_list_messages(
    match_id: str,
    session: DbSession,
    user_id: str = Depends(require_auth),
    limit: int = Query(50, ge=1, le=200),
):
    rows = await svc.list_messages(session, UUID(user_id), match_id, limit=limit)
    return [
        DatingMessagePublic(
            id=str(r.id),
            match_id=str(r.match_id),
            sender_user_id=str(r.sender_user_id),
            body=r.body,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/report", status_code=201)
async def dating_report(
    body: DatingReportCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await svc.report_user(session, UUID(user_id), body)
    return {"id": str(row.id), "ok": True}
