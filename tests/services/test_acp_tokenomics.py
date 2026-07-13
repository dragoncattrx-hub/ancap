from decimal import Decimal

from app.services.acp_tokenomics import (
    _bucket_status,
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
