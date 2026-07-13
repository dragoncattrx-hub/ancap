from decimal import Decimal

from app.services.acp_tokenomics import (
    ECOSYSTEM_BUCKET_UNITS,
    _bucket_status,
    breakdown_custodial_hot_utxos,
)


def test_breakdown_splits_ecosystem_utxo():
    utxo_units = [
        ECOSYSTEM_BUCKET_UNITS,
        23_259_298_066_475_607,
        100,
    ]
    result = breakdown_custodial_hot_utxos(utxo_units)
    assert result.buckets[0].key == "ecosystem"
    assert result.buckets[0].utxo_count == 1
    assert result.buckets[0].acp == Decimal("10500000")
    assert result.buckets[1].key == "hot"
    assert result.buckets[1].utxo_count == 2
    assert result.total_acp == Decimal("10500000") + Decimal("232592980.66475607") + Decimal("0.000001")
    assert result.total_utxo_count == 3


def test_bucket_status_helpers():
    assert _bucket_status(Decimal("25200000"), Decimal("25200000")) == "ok"
    assert _bucket_status(Decimal("0"), Decimal("25200000")) == "deficit"
    assert _bucket_status(Decimal("25200001"), Decimal("25200000")) == "excess"

    result = breakdown_custodial_hot_utxos([ECOSYSTEM_BUCKET_UNITS])
    assert result.buckets[0].acp == Decimal("10500000")
    assert result.buckets[1].acp == Decimal(0)
    assert result.total_acp == Decimal("10500000")
