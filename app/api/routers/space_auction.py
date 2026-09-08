"""Public galaxy auction: space bodies and radiation fields."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.space_auction import (
    SpaceAuctionBidCreate,
    SpaceAuctionBidPublic,
    SpaceAuctionCatalogPublic,
    SpaceAuctionLotPublic,
)
from app.services import space_auction as svc

router = APIRouter(tags=["Space Auction"])


@router.get("/space-auction/catalog", response_model=SpaceAuctionCatalogPublic)
async def space_auction_catalog(session: DbSession):
    return await svc.catalog(session)


@router.get("/space-auction/lots/{lot_id}", response_model=SpaceAuctionLotPublic)
async def space_auction_lot(lot_id: str, session: DbSession):
    return await svc.get_lot(session, lot_id)


@router.post(
    "/space-auction/lots/{lot_id}/bids",
    response_model=SpaceAuctionBidPublic,
    status_code=201,
)
async def space_auction_bid(
    lot_id: str,
    body: SpaceAuctionBidCreate,
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
