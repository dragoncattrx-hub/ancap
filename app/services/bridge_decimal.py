"""ACP native 8 decimals ↔ wACP 18 decimals (see docs/bridge-spec-v1.md)."""
from __future__ import annotations

from decimal import Decimal, ROUND_DOWN

ACP_DECIMALS = 8
WACP_DECIMALS = 18
_SCALE = Decimal(10) ** (WACP_DECIMALS - ACP_DECIMALS)  # 10^10


def acp_smallest_to_wacp_wei(acp_smallest: int) -> int:
    if acp_smallest < 0:
        raise ValueError("acp_smallest must be non-negative")
    return int(Decimal(acp_smallest) * _SCALE)


def wacp_wei_to_acp_smallest_floor(wacp_wei: int) -> tuple[int, int]:
    """Return (acp_smallest_floor, remainder_wacp_wei) rounding down ACP payout."""
    if wacp_wei < 0:
        raise ValueError("wacp_wei must be non-negative")
    base = Decimal(wacp_wei) / _SCALE
    floored = int(base.to_integral_value(rounding=ROUND_DOWN))
    remainder = wacp_wei - floored * int(_SCALE)
    return floored, remainder


def display_acp_from_smallest(acp_smallest: int) -> Decimal:
    return Decimal(acp_smallest) / (Decimal(10) ** ACP_DECIMALS)
