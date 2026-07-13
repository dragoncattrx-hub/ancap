"""Tokenomics bucket helpers for custodial hot wallet display."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.services.acp_rpc import acp_rpc_call

CUSTODIAL_HOT_ADDRESS = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
ECOSYSTEM_BUCKET_ADDRESS = "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"
ACP_UNITS_PER_ACP = 100_000_000
# Official protocol bucket size (10.5M ACP) — UTXO swept to hot is attributed by exact units.
ECOSYSTEM_BUCKET_UNITS = 10_500_000 * ACP_UNITS_PER_ACP


@dataclass(frozen=True)
class HotBucketSlice:
    key: str
    label: str
    acp: Decimal
    utxo_count: int


@dataclass(frozen=True)
class CustodialHotBreakdown:
    buckets: tuple[HotBucketSlice, ...]
    total_acp: Decimal
    total_utxo_count: int


def _units_to_acp(units: int) -> Decimal:
    return Decimal(units) / Decimal(ACP_UNITS_PER_ACP)


def _utxo_units(item: dict) -> int:
    if not isinstance(item, dict):
        return 0
    raw_units = item.get("amount_units")
    if raw_units is not None:
        try:
            return int(raw_units)
        except (TypeError, ValueError):
            return 0
    try:
        return int((Decimal(str(item.get("amount", 0))) * Decimal(ACP_UNITS_PER_ACP)).to_integral_value())
    except Exception:
        return 0


def breakdown_custodial_hot_utxos(utxos: list[dict]) -> CustodialHotBreakdown:
    """Split custodial hot UTXOs into ecosystem (10.5M) vs operator hot pool."""
    ecosystem_units = 0
    ecosystem_utxos = 0
    hot_units = 0
    hot_utxos = 0
    for item in utxos:
        units = _utxo_units(item)
        if units <= 0:
            continue
        if units == ECOSYSTEM_BUCKET_UNITS:
            ecosystem_units += units
            ecosystem_utxos += 1
        else:
            hot_units += units
            hot_utxos += 1
    ecosystem = HotBucketSlice(
        key="ecosystem",
        label="On-chain Ecosystem",
        acp=_units_to_acp(ecosystem_units),
        utxo_count=ecosystem_utxos,
    )
    hot = HotBucketSlice(
        key="hot",
        label="On-chain Hot",
        acp=_units_to_acp(hot_units),
        utxo_count=hot_utxos,
    )
    total_units = ecosystem_units + hot_units
    return CustodialHotBreakdown(
        buckets=(ecosystem, hot),
        total_acp=_units_to_acp(total_units),
        total_utxo_count=ecosystem_utxos + hot_utxos,
    )


async def fetch_custodial_hot_breakdown(address: str) -> CustodialHotBreakdown | None:
    target = (address or "").strip()
    if target != CUSTODIAL_HOT_ADDRESS:
        return None
    utxos = await acp_rpc_call("listunspent", [0, 9_999_999, [target]])
    if not isinstance(utxos, list):
        utxos = []
    return breakdown_custodial_hot_utxos(utxos)
