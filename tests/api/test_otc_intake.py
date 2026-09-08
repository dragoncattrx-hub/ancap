from decimal import Decimal

from app.services.otc_intake import catalog, quote_commodity, quote_goods, quote_metal


def test_otc_metal_quote_applies_purity():
    q = quote_metal(metal="gold", weight_grams="10", purity_ppt=999)
    assert Decimal(q.estimated_acp_amount) == Decimal("2497.5")
    assert q.rail == "metal"


def test_otc_goods_quote_passthrough():
    q = quote_goods(category="electronics", estimated_value_acp="1500")
    assert q.estimated_acp_amount == "1500"
    assert q.rail == "goods"


def test_otc_catalog_has_metals_goods_and_commodities():
    c = catalog()
    assert len(c.metals) == 4
    assert len(c.goods) == 6
    assert any(g.category == "antiques" for g in c.goods)
    assert len(c.commodities) >= 8
    kinds = {x.kind for x in c.commodities}
    assert {"oil", "natural_gas", "uranium", "timber", "sand", "stone"} <= kinds
    assert "OTC" in c.handoff_instructions or "intake" in c.handoff_instructions.lower()


def test_otc_commodity_oil_quote():
    q = quote_commodity(commodity="oil", quantity="10")
    assert q.rail == "commodity"
    assert Decimal(q.estimated_acp_amount) == Decimal("800")
    assert q.details["unit"] == "bbl"
