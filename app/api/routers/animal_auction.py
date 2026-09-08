"""Public FAUNA auction: companion animals bought and sold on ACP smart contracts."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.animal_auction import (
    AnimalAuctionBidCreate,
    AnimalAuctionBidPublic,
    AnimalAuctionCatalogPublic,
    AnimalAuctionListCreate,
    AnimalAuctionLotPublic,
)
from app.services import animal_auction as svc

router = APIRouter(tags=["FAUNA Auction"])


@router.get("/animal-auction/catalog", response_model=AnimalAuctionCatalogPublic)
async def animal_auction_catalog(session: DbSession):
    return await svc.catalog(session)


@router.get("/animal-auction/lots/{lot_id}", response_model=AnimalAuctionLotPublic)
async def animal_auction_lot(lot_id: str, session: DbSession):
    return await svc.get_lot(session, lot_id)


@router.post(
    "/animal-auction/lots",
    response_model=AnimalAuctionLotPublic,
    status_code=201,
)
async def animal_auction_list(
    body: AnimalAuctionListCreate,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.list_animal(session, user_id=user_id, body=body)


@router.post(
    "/animal-auction/lots/{lot_id}/bids",
    response_model=AnimalAuctionBidPublic,
    status_code=201,
)
async def animal_auction_bid(
    lot_id: str,
    body: AnimalAuctionBidCreate,
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
