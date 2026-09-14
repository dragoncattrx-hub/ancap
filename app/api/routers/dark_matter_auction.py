"""Public dark-matter title auction."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_auth
from app.schemas.dark_matter_auction import (
    DarkMatterBidCreate,
    DarkMatterBidPublic,
    DarkMatterCatalogPublic,
    DarkMatterLotPublic,
)
from app.services import dark_matter_auction as svc

router = APIRouter(tags=["Dark Matter Auction"])


@router.get("/dark-matter-auction/catalog", response_model=DarkMatterCatalogPublic)
async def dark_matter_auction_catalog(session: DbSession):
    return await svc.catalog(session)


@router.get("/dark-matter-auction/lots/{lot_id}", response_model=DarkMatterLotPublic)
async def dark_matter_auction_lot(lot_id: str, session: DbSession):
    return await svc.get_lot(session, lot_id)


@router.post(
    "/dark-matter-auction/lots/{lot_id}/bids",
    response_model=DarkMatterBidPublic,
    status_code=201,
)
async def dark_matter_auction_bid(
    lot_id: str,
    body: DarkMatterBidCreate,
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
