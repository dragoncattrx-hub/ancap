from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.session import async_session_maker
from app.scenarios.runner import run_flow


async def _main() -> int:
    p = argparse.ArgumentParser(description="Seed demo data (Flow1) for golden path")
    p.add_argument("--seed", type=int, default=42, help="Deterministic seed for demo artifacts")
    p.add_argument("--price", type=str, default="10", help="One-time listing price")
    p.add_argument("--currency", type=str, default="VUSD", help="Currency code")
    args = p.parse_args()

    params = {"one_time_price": args.price, "currency": args.currency}

    async with async_session_maker() as session:
        try:
            result = await run_flow("flow1", session, seed=args.seed, params=params)
            await session.commit()
        except Exception:
            await session.rollback()
            raise

    print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False, default=str))
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(_main()))


if __name__ == "__main__":
    main()

