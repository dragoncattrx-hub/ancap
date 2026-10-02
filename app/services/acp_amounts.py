"""Exact ACP amount conversions shared by chain-facing services."""
from __future__ import annotations

from decimal import Decimal

UNITS_PER_ACP = 100_000_000
MAX_U64 = (1 << 64) - 1


def rpc_amount_units(value: object) -> int:
    """Return an ACP node RPC amount without guessing its denomination.

    ACP node JSON-RPC serializes transaction amounts as integer base units.
    Accepting decimal strings/floats here is ambiguous and can silently apply
    a second 10^8 conversion, so malformed payloads fail closed.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError("ACP RPC amount must be an integer number of base units")
    if value < 0 or value > MAX_U64:
        raise ValueError("ACP RPC amount is outside the u64 range")
    return value


def units_to_acp(units: int) -> Decimal:
    return Decimal(rpc_amount_units(units)) / Decimal(UNITS_PER_ACP)
