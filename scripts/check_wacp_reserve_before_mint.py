#!/usr/bin/env python3
"""Fail closed unless live wACP reserve proof is healthy before any operator mint/LP.

Usage:
  python scripts/check_wacp_reserve_before_mint.py
  python scripts/check_wacp_reserve_before_mint.py --base-url https://api.ancap.cloud/v1

Does not mint. Does not move funds. Human must still approve treasury/LP txs.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default="https://api.ancap.cloud/v1",
        help="API base including /v1",
    )
    args = parser.parse_args()
    url = args.base_url.rstrip("/") + "/wacp/reserve-proof"
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"FAIL: could not fetch reserve proof: {exc}", file=sys.stderr)
        return 2

    health = str(payload.get("reserve_health") or payload.get("status") or "").lower()
    ok_markers = {"ok", "healthy", "green", "pass"}
    # Accept explicit boolean / ratio fields when present.
    backing = payload.get("backing_ratio")
    try:
        backing_ok = backing is None or float(backing) >= 1.0
    except (TypeError, ValueError):
        backing_ok = False

    if health in ok_markers and backing_ok:
        print(json.dumps({"ok": True, "url": url, "proof": payload}, indent=2, default=str))
        print("PASS: reserve proof looks healthy. Human confirmation still required before mint/LP.")
        return 0

    print(json.dumps({"ok": False, "url": url, "proof": payload}, indent=2, default=str), file=sys.stderr)
    print("FAIL: reserve proof not healthy — do not mint or seed LP.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
