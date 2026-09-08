"""Title rails (real estate / space / antiques / patents / recipes) + ownership certificates."""

from decimal import Decimal

from app.services.exchange_office import build_assets, catalog as xo_catalog, quote
from app.schemas.exchange_office import ExchangeQuoteRequest
from app.services.otc_intake import catalog as otc_catalog, quote_goods, quote_ip, quote_real_estate, quote_space
from app.services.ownership_proofs import catalog as own_catalog


def test_otc_catalog_has_antiques_real_estate_space():
    c = otc_catalog()
    goods = {g.category for g in c.goods}
    assert "antiques" in goods
    deals = {r.deal_type for r in c.real_estate}
    assert deals == {"sale", "rental"}
    classes = {s.object_class for s in c.space_objects}
    assert "satellite" in classes
    assert "orbital_slot" in classes


def test_otc_catalog_has_patent_and_recipe_ip():
    c = otc_catalog()
    kinds = {i.kind for i in c.ip_assets}
    assert kinds == {"patent", "recipe"}
    by_kind = {i.kind: i for i in c.ip_assets}
    assert by_kind["patent"].ownership_asset_class == "patent_invention"
    assert by_kind["recipe"].ownership_asset_class == "recipe_formula"


def test_quote_real_estate_sale_and_rental():
    sale = quote_real_estate(deal_type="sale", estimated_value_acp="250000", jurisdiction="UA")
    assert sale.rail == "real_estate"
    assert Decimal(sale.estimated_acp_amount) == Decimal("250000")
    rent = quote_real_estate(
        deal_type="rental", estimated_value_acp="12000", jurisdiction="DE", lease_months=12
    )
    assert rent.details.get("lease_months") == 12


def test_quote_space_and_antiques_goods():
    sp = quote_space(object_class="satellite", estimated_value_acp="500000", norad_or_cospar_id="25544")
    assert sp.rail == "space"
    assert sp.details["norad_or_cospar_id"] == "25544"
    g = quote_goods(category="antiques", estimated_value_acp="8000")
    assert g.rail == "goods"
    assert g.details["category"] == "antiques"


def test_quote_ip_patent_and_recipe():
    patent = quote_ip(kind="patent", estimated_value_acp="75000", registration_uri="https://patents.example/EP123")
    assert patent.rail == "ip"
    assert Decimal(patent.estimated_acp_amount) == Decimal("75000")
    assert patent.details["ownership_asset_class"] == "patent_invention"
    recipe = quote_ip(kind="recipe", estimated_value_acp="1200")
    assert recipe.details["ownership_asset_class"] == "recipe_formula"


def test_exchange_catalog_includes_title_assets():
    assets = {a.id: a for a in build_assets()}
    assert "goods_antiques" in assets
    assert assets["goods_antiques"].rail == "otc_goods"
    assert "real_estate_sale" in assets
    assert "real_estate_rental" in assets
    assert assets["real_estate_sale"].rail == "otc_real_estate"
    assert "space_satellite" in assets
    assert assets["space_satellite"].rail == "otc_space"
    assert "ip_patent" in assets
    assert "ip_recipe" in assets
    assert assets["ip_patent"].rail == "otc_ip"
    assert assets["ip_recipe"].metadata.get("ownership_asset_class") == "recipe_formula"
    c = xo_catalog()
    assert any(a.id.startswith("real_estate_") for a in c.assets)
    assert any(a.id.startswith("ip_") for a in c.assets)


def test_exchange_quote_real_estate_into_acp():
    q = quote(
        ExchangeQuoteRequest(
            from_asset="real_estate_sale",
            to_asset="acp",
            from_amount="1",
            goods_estimate_acp="100000",
        )
    )
    assert Decimal(q.to_amount) == Decimal("100000")
    assert q.rail == "otc_real_estate"


def test_exchange_quote_ip_patent_into_acp():
    q = quote(
        ExchangeQuoteRequest(
            from_asset="ip_patent",
            to_asset="acp",
            from_amount="1",
            goods_estimate_acp="42000",
        )
    )
    assert Decimal(q.to_amount) == Decimal("42000")
    assert q.rail == "otc_ip"


def test_ownership_catalog_covers_intangibles():
    c = own_catalog()
    classes = {i.asset_class for i in c.asset_classes}
    assert "real_estate_title" in classes
    assert "real_estate_lease" in classes
    assert "antique_provenance" in classes
    assert "space_object_title" in classes
    assert "intellectual_property" in classes
    assert "patent_invention" in classes
    assert "recipe_formula" in classes
    assert "register" in c.disclaimer.lower() or "not a substitute" in c.disclaimer.lower()
