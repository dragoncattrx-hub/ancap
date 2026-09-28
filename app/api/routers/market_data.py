"""Public market-data surface (CoinGecko-backed, indicative)."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.schemas.market_data import MarketPricesResponse
from app.services import coingecko
from app.services.free_distribution import free_distribution_status

router = APIRouter(prefix="/market", tags=["Market data"])


@router.get("/prices", response_model=MarketPricesResponse)
async def market_prices(
    vs: str = Query(default="usd", min_length=3, max_length=8),
):
    payload = await coingecko.fetch_market_board(vs=vs.lower().strip() or "usd")
    payload.pop("cache_key", None)
    return MarketPricesResponse(**{k: v for k, v in payload.items() if k in MarketPricesResponse.model_fields})


@router.get("/status")
async def market_status():
    return {
        "provider": "coingecko",
        "configured": coingecko.is_configured(),
        "docs": "/legal/market-data",
    }


@router.get("/free-distribution")
async def market_free_distribution(session: DbSession):
    """Public status of promotional free ACP (welcome + faucet + referral signup)."""
    status = await free_distribution_status(session)
    return {
        **status,
        "note": (
            "Promotional platform credit only — not a retail ACP sale price. "
            "Spot wACP/USDT is separate (GeckoTerminal / PancakeSwap)."
        ),
        "docs": "/legal/welcome-grant",
    }
