"""Public market-data schemas (CoinGecko indicative feed)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class MarketPriceRow(BaseModel):
    id: str
    symbol: str
    vs_currency: str
    price: str | None = None
    last_updated_at: int | None = None


class MarketPricesResponse(BaseModel):
    configured: bool
    enabled: bool = True
    provider: str = "coingecko"
    status: str
    vs_currency: str | None = None
    cache_ttl_seconds: int | None = None
    prices: list[MarketPriceRow] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    attribution: str | None = None
    http_status: int | None = None
    # allow extra diagnostic fields without breaking clients
    extras: dict[str, Any] | None = None
