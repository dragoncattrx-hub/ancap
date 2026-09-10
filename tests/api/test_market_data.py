"""CoinGecko market-data client tests (mocked HTTP)."""

from __future__ import annotations

import pytest

from app.services import coingecko


class _Resp:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


@pytest.mark.asyncio
async def test_fetch_simple_prices_ok(monkeypatch):
    coingecko.clear_cache()
    monkeypatch.setenv("COINGECKO_API_KEY", "CG-test-key")
    from app.config import get_settings

    get_settings.cache_clear()

    class _Client:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def get(self, url, params=None, headers=None):
            assert "x-cg-demo-api-key" in (headers or {})
            return _Resp(
                200,
                {
                    "bitcoin": {"usd": 100000.0, "last_updated_at": 1},
                    "ethereum": {"usd": 3500.0, "last_updated_at": 1},
                    "tether": {"usd": 1.0, "last_updated_at": 1},
                    "binancecoin": {"usd": 600.0, "last_updated_at": 1},
                    "solana": {"usd": 150.0, "last_updated_at": 1},
                },
            )

    monkeypatch.setattr(coingecko.httpx, "AsyncClient", _Client)
    data = await coingecko.fetch_simple_prices()
    assert data["status"] == "ok"
    assert data["configured"] is True
    symbols = [p["symbol"] for p in data["prices"]]
    assert symbols == ["BTC", "ETH", "USDT", "BNB", "SOL"]
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_fetch_market_board_includes_platform(monkeypatch):
    coingecko.clear_cache()
    monkeypatch.setenv("COINGECKO_API_KEY", "CG-test-key")
    monkeypatch.setenv("USDT_TRC20_TO_ACP_RATE", "4")
    from app.config import get_settings

    get_settings.cache_clear()

    class _Client:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def get(self, url, params=None, headers=None):
            return _Resp(
                200,
                {
                    "bitcoin": {"usd": 100000.0, "last_updated_at": 1},
                    "ethereum": {"usd": 3500.0, "last_updated_at": 1},
                    "tether": {"usd": 1.0, "last_updated_at": 1},
                    "binancecoin": {"usd": 600.0, "last_updated_at": 1},
                    "solana": {"usd": 150.0, "last_updated_at": 1},
                },
            )

    monkeypatch.setattr(coingecko.httpx, "AsyncClient", _Client)
    data = await coingecko.fetch_market_board()
    assert data["status"] == "ok"
    symbols = [p["symbol"] for p in data["prices"]]
    assert symbols[:3] == ["ACP", "wACP", "sACP"]
    assert "BTC" in symbols
    acp = next(p for p in data["prices"] if p["symbol"] == "ACP")
    assert float(acp["price"]) == 0.25  # 1 USDT / 4 ACP
    sacp = next(p for p in data["prices"] if p["symbol"] == "sACP")
    assert float(sacp["price"]) == 1.0
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_wacp_geckoterminal_spot(monkeypatch):
    coingecko.clear_cache()
    monkeypatch.setenv("COINGECKO_API_KEY", "")
    from app.config import get_settings

    get_settings.cache_clear()

    class _Client:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def get(self, url, params=None, headers=None):
            if "pools" in url:
                return _Resp(
                    200,
                    {
                        "data": [
                            {
                                "attributes": {
                                    "base_token_price_usd": "0.00042",
                                    "token_price_usd": "0.00042",
                                }
                            }
                        ]
                    },
                )
            return _Resp(200, {"data": {"attributes": {"price_usd": None}}})

    monkeypatch.setattr(coingecko.httpx, "AsyncClient", _Client)
    board = await coingecko.fetch_market_board()
    wacp = next(p for p in board["prices"] if p["symbol"] == "wACP")
    assert float(wacp["price"]) == 0.00042
    assert any("geckoterminal" in n for n in board["notes"])
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_fetch_not_configured(monkeypatch):
    coingecko.clear_cache()
    monkeypatch.setenv("COINGECKO_API_KEY", "")
    from app.config import get_settings

    get_settings.cache_clear()
    data = await coingecko.fetch_simple_prices()
    assert data["status"] == "not_configured"
    board = await coingecko.fetch_market_board()
    assert board["status"] == "partial"
    assert [p["symbol"] for p in board["prices"][:3]] == ["ACP", "wACP", "sACP"]
    get_settings.cache_clear()


def test_market_routes_registered():
    from app.main import app

    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/v1/market/prices" in paths
    assert "/v1/market/status" in paths
