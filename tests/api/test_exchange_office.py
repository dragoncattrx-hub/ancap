"""ACP-hub exchange office foundation tests."""

from decimal import Decimal

from app.services.exchange_office import build_pairs, catalog, quote
from app.schemas.exchange_office import ExchangeQuoteRequest


def test_catalog_has_hub_and_core_assets():
    c = catalog()
    ids = {a.id for a in c.assets}
    assert c.hub_asset == "acp"
    assert c.model == "acp_hub"
    assert "acp" in ids
    assert "usdt_trc20" in ids
    assert "wacp_bsc" in ids
    assert "metal_gold" in ids
    assert "goods_electronics" in ids
    assert "commodity_oil" in ids
    assert "commodity_uranium" in ids
    assert "fiat_usd" in ids
    assert c.quote_ttl_seconds > 0
    assert len(c.pairs) > 10


def test_quote_commodity_into_acp():
    q = quote(
        ExchangeQuoteRequest(from_asset="commodity_oil", to_asset="acp", from_amount="5")
    )
    assert Decimal(q.to_amount) == Decimal("400")
    assert q.rail == "otc_commodity"



def test_pairs_include_cross_and_direct():
    pairs = build_pairs()
    direct = next(p for p in pairs if p.from_asset == "usdt_trc20" and p.to_asset == "acp")
    assert direct.legs == 1
    assert direct.rail == "swap_desk"
    cross = next(p for p in pairs if p.from_asset == "metal_gold" and p.to_asset == "usdt_trc20")
    assert cross.legs == 2
    assert cross.rail == "hub_cross"


def test_quote_usdt_into_acp():
    q = quote(ExchangeQuoteRequest(from_asset="usdt_trc20", to_asset="acp", from_amount="100"))
    assert Decimal(q.to_amount) == Decimal("100")  # default desk rate 1
    assert q.rail == "swap_desk"
    assert len(q.legs) == 1
    assert q.quote_id


def test_quote_metal_into_acp_with_purity():
    q = quote(
        ExchangeQuoteRequest(
            from_asset="metal_gold",
            to_asset="acp",
            from_amount="10",
            purity_ppt=999,
        )
    )
    assert Decimal(q.to_amount) == Decimal("2497.5")
    assert q.rail == "otc_metal"


def test_quote_cross_metal_to_usdt():
    q = quote(
        ExchangeQuoteRequest(
            from_asset="metal_gold",
            to_asset="usdt_trc20",
            from_amount="1",
            purity_ppt=1000,
        )
    )
    assert q.rail == "hub_cross"
    assert len(q.legs) == 2
    assert Decimal(q.acp_hub_amount) == Decimal("250")
    assert Decimal(q.to_amount) > 0
