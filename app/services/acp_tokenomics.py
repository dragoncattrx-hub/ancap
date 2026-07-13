"""Tokenomics bucket helpers for custodial hot wallet display."""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from app.config import get_settings
from app.schemas.tokenomics import (
    AcpTokenomicsBucketSnapshot,
    AcpTokenomicsHotPool,
    AcpTokenomicsSnapshotResponse,
)
from app.services.acp_rpc import acp_rpc_call

CUSTODIAL_HOT_ADDRESS = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
ECOSYSTEM_BUCKET_ADDRESS = "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"
CREATOR_BUCKET_ADDRESS = "acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl"
VALIDATOR_BUCKET_ADDRESS = "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um"
PUBLIC_BUCKET_ADDRESS = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
GENESIS_SUPPLY_ACP = Decimal("210000000")
ACP_UNITS_PER_ACP = 100_000_000
ECOSYSTEM_BUCKET_UNITS = 10_500_000 * ACP_UNITS_PER_ACP

TOKENOMICS_BUCKET_DEFS: tuple[tuple[str, str, int, Decimal, str], ...] = (
    ("creator", "Creator", 33, Decimal("69300000"), CREATOR_BUCKET_ADDRESS),
    ("validator", "Validator Reserve", 50, Decimal("105000000"), VALIDATOR_BUCKET_ADDRESS),
    ("public", "Public & Liquidity", 12, Decimal("25200000"), PUBLIC_BUCKET_ADDRESS),
    ("ecosystem", "Ecosystem Grants", 5, Decimal("10500000"), ECOSYSTEM_BUCKET_ADDRESS),
)


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


def _decimal_to_api_str(value: Decimal) -> str:
    s = format(value.quantize(Decimal("0.00000001")), "f").rstrip("0").rstrip(".")
    return s or "0"


def _bucket_status(actual: Decimal, target: Decimal) -> str:
    delta = actual - target
    if abs(delta) < Decimal("0.000001"):
        return "ok"
    if delta < 0:
        return "deficit"
    return "excess"


async def _address_balance_acp(address: str) -> tuple[Decimal, int]:
    units_list = await _scan_address_utxo_units(address)
    return _units_to_acp(sum(units_list)), len(units_list)


async def build_tokenomics_snapshot() -> AcpTokenomicsSnapshotResponse:
    height_raw = await acp_rpc_call("getblockcount", [])
    block_height = int(height_raw or 0)

    hot_breakdown = await fetch_custodial_hot_breakdown(CUSTODIAL_HOT_ADDRESS)
    eco_on_hot = Decimal(0)
    operator_pool = Decimal(0)
    hot_total = Decimal(0)
    hot_utxos = 0
    if hot_breakdown is not None:
        hot_total = hot_breakdown.total_acp
        hot_utxos = hot_breakdown.total_utxo_count
        for b in hot_breakdown.buckets:
            if b.key == "ecosystem":
                eco_on_hot = b.acp
            elif b.key == "hot":
                operator_pool = b.acp

    bucket_rows: list[AcpTokenomicsBucketSnapshot] = []
    buckets_sum = Decimal(0)

    for key, label, share_pct, target, address in TOKENOMICS_BUCKET_DEFS:
        on_chain, utxo_count = await _address_balance_acp(address)
        location_note: str | None = None
        effective = on_chain

        if key == "ecosystem" and eco_on_hot > 0:
            effective = on_chain + eco_on_hot
            if on_chain <= 0 and eco_on_hot > 0:
                location_note = (
                    f"{_decimal_to_api_str(eco_on_hot)} ACP attributed on custodial hot "
                    f"(canonical keystore lost; not on {address})"
                )
                status = "on_hot" if abs(effective - target) < Decimal("0.000001") else _bucket_status(effective, target)
            else:
                status = _bucket_status(effective, target)
        else:
            status = _bucket_status(effective, target)

        buckets_sum += effective
        bucket_rows.append(
            AcpTokenomicsBucketSnapshot(
                key=key,
                label=label,
                share_pct=share_pct,
                target_acp=_decimal_to_api_str(target),
                address=address,
                on_chain_acp=_decimal_to_api_str(effective),
                utxo_count=utxo_count if key != "ecosystem" or on_chain > 0 else (1 if eco_on_hot > 0 else 0),
                status=status,
                location_note=location_note,
            )
        )

    aligned = all(b.status in ("ok", "on_hot") for b in bucket_rows)
    return AcpTokenomicsSnapshotResponse(
        genesis_supply_acp=_decimal_to_api_str(GENESIS_SUPPLY_ACP),
        buckets_sum_acp=_decimal_to_api_str(buckets_sum),
        alignment_status="aligned" if aligned else "partial",
        buckets=bucket_rows,
        hot_pool=AcpTokenomicsHotPool(
            total_acp=_decimal_to_api_str(hot_total),
            utxo_count=hot_utxos,
            ecosystem_on_hot_acp=_decimal_to_api_str(eco_on_hot),
            operator_pool_acp=_decimal_to_api_str(operator_pool),
        ),
        block_height=block_height or None,
    )
