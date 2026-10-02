#!/usr/bin/env python3
"""Stage B: V3 tick range + token amounts (planning)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_WACP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_WACP_DIR))

from v3_math import deploy_from_usdt_budget, deploy_from_wacp_amount  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--p0", type=float, required=True, help="USDT per wACP")
    parser.add_argument("--range", type=float, default=0.20, dest="range_fraction")
    parser.add_argument("--tick-spacing", type=int, default=50)
    parser.add_argument("--w-v3", type=float, help="wACP amount (token0) for Mode B1")
    parser.add_argument("--usdt-budget", type=float, help="USDT budget for Mode B2")
    parser.add_argument("--usdt-budget-max", type=float, help="Gate B: fail if required USDT exceeds this")
    parser.add_argument("--w-v3-max", type=float, help="Gate B: fail if wACP exceeds this")
    args = parser.parse_args()

    if args.w_v3 is not None and args.usdt_budget is not None:
        print("FAIL: specify only one of --w-v3 or --usdt-budget", file=sys.stderr)
        return 2
    if args.w_v3 is None and args.usdt_budget is None:
        print("FAIL: specify --w-v3 or --usdt-budget", file=sys.stderr)
        return 2

    try:
        if args.w_v3 is not None:
            plan = deploy_from_wacp_amount(
                args.w_v3,
                args.p0,
                args.range_fraction,
                args.tick_spacing,
            )
        else:
            plan = deploy_from_usdt_budget(
                float(args.usdt_budget),
                args.p0,
                args.range_fraction,
                args.tick_spacing,
            )
    except (ValueError, NotImplementedError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stderr)
        return 1

    gates = {
        "B_usdt_budget": True,
        "B_wacp_budget": True,
        "C_ticks_valid": plan.tick_lower < plan.tick_upper,
    }
    if args.usdt_budget_max is not None and plan.usdt_required > args.usdt_budget_max:
        gates["B_usdt_budget"] = False
    if args.w_v3_max is not None and plan.amount0 > args.w_v3_max:
        gates["B_wacp_budget"] = False

    ok = all(gates.values())
    payload = {
        "ok": ok,
        "p0_usdt_per_wacp": plan.p0_human,
        "range_fraction": plan.range_fraction,
        "tickLower": plan.tick_lower,
        "tickUpper": plan.tick_upper,
        "amount0_wacp": plan.amount0,
        "amount1_usdt": plan.amount1,
        "liquidity_L": plan.liquidity,
        "usdt_required": plan.usdt_required,
        "gates": gates,
    }
    print(json.dumps(payload, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
