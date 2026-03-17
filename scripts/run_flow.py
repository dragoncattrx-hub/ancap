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
    p = argparse.ArgumentParser(description="ANCAP scenario runner (flows)")
    p.add_argument("flow_id", choices=["flow1", "flow2", "flow3", "simulation"])
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--params", type=str, default="{}", help='JSON object, e.g. \'{"agents":200}\'')
    args = p.parse_args()

    try:
        params = json.loads(args.params or "{}")
        if not isinstance(params, dict):
            raise ValueError("params must be a JSON object")
    except Exception as e:
        raise SystemExit(f"Invalid --params: {e}")

    async with async_session_maker() as session:
        try:
            result = await run_flow(args.flow_id, session, seed=args.seed, params=params)
            await session.commit()
        except Exception:
            await session.rollback()
            raise

    print(result.model_dump_json(indent=2))
    return 0


def main() -> None:
    raise SystemExit(asyncio.run(_main()))


if __name__ == "__main__":
    main()

