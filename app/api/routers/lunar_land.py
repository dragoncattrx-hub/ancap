"""Lunar land trading API (R13)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.lunar_land import (
    LunarInterestCreate,
    LunarInterestPublic,
    LunarLandStatusPublic,
    LunarParcelPublic,
)
from app.services import lunar_land as svc

router = APIRouter(tags=["Lunar Land"])


@router.get("/lunar/status", response_model=LunarLandStatusPublic)
async def lunar_status(session: DbSession):
    return await svc.division_status(session)


@router.get("/lunar/parcels", response_model=list[LunarParcelPublic])
async def lunar_parcels(session: DbSession):
    return await svc.list_parcels(session)


@router.get("/lunar/parcels/{parcel_id}", response_model=LunarParcelPublic)
async def lunar_parcel(parcel_id: str, session: DbSession):
    return await svc.get_parcel(session, parcel_id)


@router.post("/lunar/interests", response_model=LunarInterestPublic, status_code=201)
async def create_interest(
    body: LunarInterestCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.create_interest(session, user_id=user_id, body=body)


@router.get("/lunar/interests", response_model=list[LunarInterestPublic])
async def list_interests(
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_interests(session, user_id=user_id)
