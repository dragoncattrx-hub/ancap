"""sACP foundation tests — docs/STABLECOIN_SACP_SPEC.md."""

from decimal import Decimal

from app.schemas.exchange_office import ExchangeQuoteRequest
from app.schemas.mobile_acp import SmartPayRouteStep
from app.services import sacp as sacp_svc
from app.services.exchange_office import catalog, quote


def test_sacp_public_status_shape():
    st = sacp_svc.public_status()
    assert st["peg_target"] == "USD"
    assert st["decimals"] == 18
    assert "acp_per_usd" in st
    assert "min_collateral_ratio" in st
    assert isinstance(st["notes"], list)


def test_sacp_reserve_proof_stub():
    import asyncio

    proof = asyncio.run(sacp_svc.reserve_proof(None))
    assert proof["reserve_health"] in {"ok", "unknown", "not_configured", "disabled", "paused"}
    assert proof["sacp_circulating"] == "0"


def test_indicative_mint_math():
    # default 4 ACP/USD * 1.5 ratio => 6 ACP per 1 sACP
    assert sacp_svc.indicative_acp_for_sacp(Decimal("1")) == Decimal("6")
    assert sacp_svc.indicative_sacp_for_acp(Decimal("6")) == Decimal("1")


def test_catalog_includes_sacp():
    c = catalog()
    ids = {a.id for a in c.assets}
    assert "sacp_bsc" in ids
    asset = next(a for a in c.assets if a.id == "sacp_bsc")
    assert asset.kind == "stablecoin"
    assert asset.quote_mode == "stable_peg"
    assert asset.rail == "stablecoin"


def test_quote_acp_to_sacp():
    q = quote(ExchangeQuoteRequest(from_asset="acp", to_asset="sacp_bsc", from_amount="6"))
    assert Decimal(q.to_amount) == Decimal("1")
    assert q.rail == "stablecoin"


def test_quote_sacp_to_acp():
    q = quote(ExchangeQuoteRequest(from_asset="sacp_bsc", to_asset="acp", from_amount="1"))
    assert Decimal(q.to_amount) == Decimal("6")
    assert q.rail == "stablecoin"


def test_smart_pay_route_step_allows_mint():
    step = SmartPayRouteStep(
        kind="mint",
        network="bsc",
        dex_or_rail="sacp_rail_v1",
        from_asset="ACP",
        to_asset="sACP",
        estimated_out="1",
    )
    assert step.kind == "mint"


def test_sacp_routes_registered():
    from app.main import app

    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/v1/sacp/status" in paths
    assert "/v1/sacp/intents/mint" in paths
    assert "/v1/sacp/intents/redeem" in paths
    assert "/v1/sacp/admin/snapshots" in paths
