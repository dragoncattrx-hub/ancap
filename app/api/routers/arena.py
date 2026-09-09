"""ACP Arena HTTP surface — prediction desk + commit-reveal house games."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import DbSession, require_auth
from app.schemas.arena import (
    ArenaBetCreate,
    ArenaBetPublic,
    ArenaCatalogPublic,
    ArenaHouseCommitRequest,
    ArenaHousePlayRequest,
    ArenaHouseRevealRequest,
    ArenaHouseRoundPublic,
)
from app.services import arena as svc
from app.services.rate_limit import build_rate_limit_key, enforce_rate_limit, get_request_ip

router = APIRouter(tags=["ACP Arena"])


async def _arena_rl(request: Request, user_id: str, scope: str) -> None:
    await enforce_rate_limit(
        key=build_rate_limit_key(scope=f"arena:{scope}", ip=get_request_ip(request), subject=user_id),
        limit=30,
        window_seconds=60,
    )


@router.get("/arena/catalog", response_model=ArenaCatalogPublic)
async def arena_catalog(session: DbSession):
    return await svc.catalog(session)


@router.post("/arena/markets/{market_id}/bets", response_model=ArenaBetPublic, status_code=201)
async def arena_place_bet(
    market_id: str,
    body: ArenaBetCreate,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await _arena_rl(request, user_id, "bet")
    return await svc.place_bet(session, user_id=user_id, market_id=market_id, body=body)


@router.post("/arena/house/commit", response_model=ArenaHouseRoundPublic, status_code=201)
async def arena_house_commit(
    body: ArenaHouseCommitRequest,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await _arena_rl(request, user_id, "house_commit")
    return await svc.commit_house(session, user_id=user_id, body=body)


@router.post("/arena/house/reveal", response_model=ArenaHouseRoundPublic)
async def arena_house_reveal(
    body: ArenaHouseRevealRequest,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await _arena_rl(request, user_id, "house_reveal")
    return await svc.reveal_house(session, user_id=user_id, body=body)


@router.post("/arena/house/play", response_model=ArenaHouseRoundPublic, status_code=201)
async def arena_house_play(
    body: ArenaHousePlayRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    return await svc.play_house(session, user_id=user_id, body=body)
