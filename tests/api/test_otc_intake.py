from decimal import Decimal

from app.services.otc_intake import catalog, quote_goods, quote_metal


def test_otc_metal_quote_applies_purity():
    q = quote_metal(metal="gold", weight_grams="10", purity_ppt=999)
    assert Decimal(q.estimated_acp_amount) == Decimal("2497.5")
    assert q.rail == "metal"


def test_otc_goods_quote_passthrough():
    q = quote_goods(category="electronics", estimated_value_acp="1500")
    assert q.estimated_acp_amount == "1500"
    assert q.rail == "goods"


def test_otc_catalog_has_metals_and_goods():
    c = catalog()
    assert len(c.metals) == 4
    assert len(c.goods) == 5
    assert "OTC" in c.handoff_instructions or "intake" in c.handoff_instructions.lower()
