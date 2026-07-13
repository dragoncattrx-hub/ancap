from decimal import Decimal

from app.services.acp_tokenomics import (
    ECOSYSTEM_BUCKET_UNITS,
    breakdown_custodial_hot_utxos,
)


def test_breakdown_splits_ecosystem_utxo():
    utxos = [
        {"amount_units": ECOSYSTEM_BUCKET_UNITS},
        {"amount_units": 232_592_980_66475607},
        {"amount_units": 100},
    ]
    result = breakdown_custodial_hot_utxos(utxos)
    assert result.buckets[0].key == "ecosystem"
    assert result.buckets[0].utxo_count == 1
    assert result.buckets[0].acp == Decimal("10500000")
    assert result.buckets[1].key == "hot"
    assert result.buckets[1].utxo_count == 2
    assert result.total_acp == Decimal("10500000") + Decimal("232592980.66475607") + Decimal("0.000001")
    assert result.total_utxo_count == 3


def test_breakdown_empty_hot_pool():
    utxos = [{"amount": 10_500_000}]
    result = breakdown_custodial_hot_utxos(utxos)
    assert result.buckets[0].acp == Decimal("10500000")
    assert result.buckets[1].acp == Decimal(0)
    assert result.total_acp == Decimal("10500000")
