from decimal import Decimal

from app.services.acp_tokenomics import (
    CUSTODIAL_HOT_ADDRESS,
    GENESIS_TREASURY_ADDRESS,
    _bucket_status,
    acp_supply_layout,
    breakdown_custodial_hot_utxos,
)


def test_breakdown_operator_pool_only():
    utxo_units = [23_259_298_066_475_607, 100]
    result = breakdown_custodial_hot_utxos(utxo_units)
    assert len(result.buckets) == 1
    assert result.buckets[0].key == "hot"
    assert result.buckets[0].label == "Operator pool"
    assert result.buckets[0].utxo_count == 2
    assert result.total_utxo_count == 2
    assert result.total_acp == Decimal("232592980.66475607") + Decimal("0.000001")


def test_bucket_status_helpers():
    assert _bucket_status(Decimal("25200000"), Decimal("25200000")) == "ok"
    assert _bucket_status(Decimal("0"), Decimal("25200000")) == "deficit"
    assert _bucket_status(Decimal("25200001"), Decimal("25200000")) == "excess"


def test_acp_supply_layout_has_exact_canonical_genesis_buckets():
    layout = acp_supply_layout()
    assert Decimal(layout["genesis_supply_acp"]) == Decimal("210000000")
    roles = {r["key"]: r for r in layout["roles"]}
    assert roles["public"]["address"] == GENESIS_TREASURY_ADDRESS
    canonical = sum(
        Decimal(roles[key]["design_acp"])
        for key in ("creator", "validator", "public", "ecosystem")
    )
    assert canonical == Decimal("210000000")
    assert roles["custodial_hot"]["address"] == CUSTODIAL_HOT_ADDRESS
    assert Decimal(roles["custodial_hot"]["design_acp"]) == Decimal("0")
    assert "Dilithium" in layout["signing_security"] or "dilithium" in layout["signing_security"]
