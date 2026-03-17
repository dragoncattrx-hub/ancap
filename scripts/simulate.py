from __future__ import annotations

import argparse
import asyncio

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.run_flow import _main as _run_flow_main


def main() -> None:
    # Back-compat wrapper: `python scripts/simulate.py --agents 500 ...`
    # We translate args into `scripts/run_flow.py simulation --params '{...}'`.
    p = argparse.ArgumentParser(description="ANCAP simulation mode (wrapper around flow runner)")
    p.add_argument("--agents", type=int, default=200)
    p.add_argument("--strategies-per-agent", type=int, default=1)
    p.add_argument("--orders", type=int, default=None, help="defaults to agents")
    p.add_argument("--runs-per-order", type=int, default=1)
    p.add_argument("--tick-every", type=int, default=50)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--currency", type=str, default="VUSD")
    args = p.parse_args()

    orders = args.orders if args.orders is not None else args.agents
    params = {
        "agents": args.agents,
        "strategies_per_agent": args.strategies_per_agent,
        "orders": orders,
        "runs_per_order": args.runs_per_order,
        "tick_every": args.tick_every,
        "currency": args.currency,
    }

    # Reuse run_flow entrypoint by patching sys.argv minimally.
    import sys, json

    sys.argv = [
        sys.argv[0].replace("simulate.py", "run_flow.py"),
        "simulation",
        "--seed",
        str(args.seed),
        "--params",
        json.dumps(params),
    ]
    raise SystemExit(asyncio.run(_run_flow_main()))


if __name__ == "__main__":
    main()

