"""Public FLORA auction: flowers in any form, qty 1…∞, ACP escrow."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.flora_auction import (
    FloraAuctionBidCreate,
    FloraAuctionBidPublic,
    FloraAuctionCatalogPublic,
    FloraAuctionListCreate,
    FloraAuctionLotPublic,
)
from app.services import flora_auction as svc

router = APIRouter(tags=["FLORA Auction"])


@router.get("/flora-auction/catalog", response_model=FloraAuctionCatalogPublic)
async def flora_auction_catalog(session: DbSession):
    return await svc.catalog(session)


@router.get("/flora-auction/lots/{lot_id}", response_model=FloraAuctionLotPublic)
async def flora_auction_lot(lot_id: str, session: DbSession):
    return await svc.get_lot(session, lot_id)


@router.post(
    "/flora-auction/lots",
    response_model=FloraAuctionLotPublic,
    status_code=201,
)
async def flora_auction_list(
    body: FloraAuctionListCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_flora(session, user_id=user_id, body=body)


@router.post(
    "/flora-auction/lots/{lot_id}/bids",
    response_model=FloraAuctionBidPublic,
    status_code=201,
)
async def flora_auction_bid(
    lot_id: str,
    body: FloraAuctionBidCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.place_bid(
        session,
        user_id=user_id,
        lot_id=lot_id,
        amount_acp=body.amount_acp,
        note=body.note,
    )
