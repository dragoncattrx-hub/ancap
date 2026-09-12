"""Literary auction HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import DbSession, require_auth
from app.schemas.literary_auction import (
    LiteraryAuctionBidCreate,
    LiteraryAuctionBidPublic,
    LiteraryAuctionCatalogPublic,
    LiteraryAuctionListCreate,
    LiteraryAuctionLotPublic,
)
from app.services import literary_auction as svc
from app.services.rate_limit import build_rate_limit_key, enforce_rate_limit, get_request_ip

router = APIRouter(tags=["Literary Auction"])


@router.get("/literary-auction/catalog", response_model=LiteraryAuctionCatalogPublic)
async def literary_catalog(session: DbSession):
    return await svc.catalog(session)


@router.get("/literary-auction/lots/{lot_id}", response_model=LiteraryAuctionLotPublic)
async def literary_get_lot(lot_id: str, session: DbSession):
    return await svc.get_lot(session, lot_id)


@router.post("/literary-auction/lots", response_model=LiteraryAuctionLotPublic, status_code=201)
async def literary_list_lot(
    body: LiteraryAuctionListCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await enforce_rate_limit(
        key=build_rate_limit_key(scope="literary_auction:list", ip=get_request_ip(request), subject=user_id),
        limit=20,
        window_seconds=3600,
    )
    return await svc.list_work(session, user_id=user_id, body=body)


@router.post(
    "/literary-auction/lots/{lot_id}/bids",
    response_model=LiteraryAuctionBidPublic,
    status_code=201,
)
async def literary_place_bid(
    lot_id: str,
    body: LiteraryAuctionBidCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await enforce_rate_limit(
        key=build_rate_limit_key(scope="literary_auction:bid", ip=get_request_ip(request), subject=user_id),
        limit=12,
        window_seconds=60,
    )
    return await svc.place_bid(
        session,
        user_id=user_id,
        lot_id=lot_id,
        amount_acp=body.amount_acp,
        note=body.note,
    )
