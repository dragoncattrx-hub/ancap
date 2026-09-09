"""TECH auction HTTP surface — technology licenses via AuctionEscrow."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import DbSession, get_current_user_id, require_auth
from app.schemas.tech_auction import (
    TechAuctionBidCreate,
    TechAuctionBidPublic,
    TechAuctionCatalogPublic,
    TechAuctionListCreate,
    TechAuctionLotPublic,
)
from app.services import tech_auction as svc
from app.services.rate_limit import build_rate_limit_key, enforce_rate_limit, get_request_ip

router = APIRouter(tags=["TECH Auction"])


@router.get("/tech-auction/catalog", response_model=TechAuctionCatalogPublic)
async def tech_catalog(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    return await svc.catalog(session, user_id=user_id)


@router.get("/tech-auction/lots/{lot_id}", response_model=TechAuctionLotPublic)
async def tech_get_lot(
    lot_id: str,
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
):
    return await svc.get_lot(session, lot_id, user_id=user_id)


@router.post("/tech-auction/lots", response_model=TechAuctionLotPublic, status_code=201)
async def tech_list_lot(
    body: TechAuctionListCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await enforce_rate_limit(
        key=build_rate_limit_key(scope="tech_auction:list", ip=get_request_ip(request), subject=user_id),
        limit=20,
        window_seconds=3600,
    )
    return await svc.list_tech(session, user_id=user_id, body=body)


@router.post("/tech-auction/lots/{lot_id}/bids", response_model=TechAuctionBidPublic, status_code=201)
async def tech_place_bid(
    lot_id: str,
    body: TechAuctionBidCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await enforce_rate_limit(
        key=build_rate_limit_key(scope="tech_auction:bid", ip=get_request_ip(request), subject=user_id),
        limit=60,
        window_seconds=60,
    )
    return await svc.place_bid(
        session,
        user_id=user_id,
        lot_id=lot_id,
        amount_acp=body.amount_acp,
        note=body.note,
    )
