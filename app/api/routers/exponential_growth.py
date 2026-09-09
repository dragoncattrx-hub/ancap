"""Exponential growth HTTP surface — compounding network levers."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.api.deps import DbSession, require_auth
from app.schemas.exponential_growth import (
    ExponentialCompoundQuoteRequest,
    ExponentialCompoundQuoteResponse,
    ExponentialGrowthPublic,
)
from app.services import exponential_growth as svc
from app.services.rate_limit import build_rate_limit_key, enforce_rate_limit, get_request_ip

router = APIRouter(tags=["Exponential Growth"])


@router.get("/growth/exponential", response_model=ExponentialGrowthPublic)
async def get_exponential_growth(
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await enforce_rate_limit(
        key=build_rate_limit_key(scope="growth:exponential", ip=get_request_ip(request), subject=user_id),
        limit=60,
        window_seconds=60,
    )
    return await svc.compute_growth(session, user_id=user_id)


@router.post("/growth/exponential/compound", response_model=ExponentialCompoundQuoteResponse)
async def quote_exponential_compound(
    body: ExponentialCompoundQuoteRequest,
    request: Request,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    await enforce_rate_limit(
        key=build_rate_limit_key(scope="growth:compound", ip=get_request_ip(request), subject=user_id),
        limit=30,
        window_seconds=60,
    )
    return await svc.quote_compound(session, user_id=user_id, body=body)
