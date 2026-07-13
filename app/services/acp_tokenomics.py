"""Tokenomics bucket helpers for custodial hot wallet display."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from app.config import get_settings
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


def _json_chain_amount_to_int(value: object) -> int:
    if value is None:
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return 0
        try:
            return int(Decimal(s))
        except (InvalidOperation, ValueError):
            return 0
    if isinstance(value, float):
        try:
            return int(Decimal(str(value)))
        except (InvalidOperation, ValueError):
            return 0
    try:
        return int(Decimal(str(value)))
    except (InvalidOperation, ValueError):
        return 0


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


def breakdown_custodial_hot_utxos(utxo_units: list[int]) -> CustodialHotBreakdown:
    """Split custodial hot UTXOs into ecosystem (10.5M) vs operator hot pool."""
    ecosystem_units = 0
    ecosystem_utxos = 0
    hot_units = 0
    hot_utxos = 0
    for units in utxo_units:
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


async def _scan_address_utxo_units(address: str) -> list[int]:
    """Scan chain outputs for an address (walletd-style, no listunspent RPC)."""
    target = (address or "").strip()
    if not target:
        return []
    rpc_url = (get_settings().acp_rpc_url or "").strip()
    if not rpc_url:
        return []

    best_height = int(await acp_rpc_call("getblockcount", []) or 0)
    if best_height <= 0:
        return []

    unspent: dict[str, int] = {}
    spent: set[str] = set()

    for height in range(1, best_height + 1):
        block_hash = await acp_rpc_call("getblockhash", {"height": height})
        block = await acp_rpc_call("getblock", {"blockhash": block_hash, "verbose": 2}) or {}
        for tx in block.get("tx") or []:
            txid = str(tx.get("txid") or "")
            if not txid:
                continue
            for vin in tx.get("vin") or []:
                prev_txid = vin.get("prev_txid")
                prev_vout = vin.get("vout")
                if prev_txid is None or prev_vout is None:
                    continue
                key = f"{prev_txid}:{int(prev_vout)}"
                spent.add(key)
                unspent.pop(key, None)
            for idx, vout in enumerate(tx.get("vout") or []):
                out_addr = str(vout.get("recipient_address") or "")
                if out_addr != target:
                    continue
                key = f"{txid}:{idx}"
                if key in spent:
                    continue
                unspent[key] = _json_chain_amount_to_int(vout.get("amount"))

    return list(unspent.values())


async def fetch_custodial_hot_breakdown(address: str) -> CustodialHotBreakdown | None:
    target = (address or "").strip()
    if target != CUSTODIAL_HOT_ADDRESS:
        return None
    utxo_units = await _scan_address_utxo_units(target)
    return breakdown_custodial_hot_utxos(utxo_units)
