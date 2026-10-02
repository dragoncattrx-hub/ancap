#!/usr/bin/env python3
"""Size regenesis v3 bridge funding from live BSC wACP totalSupply()."""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from decimal import Decimal, ROUND_UP


def main() -> int:
    rpc = os.environ.get("BSC_RPC", "").strip()
    contract = os.environ.get("WACP_CONTRACT", "").strip()
    if not rpc or not contract:
        print("BRIDGE_BSC_RPC_URL / BRIDGE_WACP_CONTRACT is not configured", file=sys.stderr)
        return 1
    public_hint = Decimal(os.environ["PUBLIC_HINT"])
    ecosystem_hint = Decimal(os.environ["ECOSYSTEM_HINT"])
    reserve_pad = Decimal(os.environ["FEE_BUFFER"])
    body = json.dumps(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "eth_call",
            "params": [{"to": contract, "data": "0x18160ddd"}, "latest"],
        }
    ).encode()
    req = urllib.request.Request(rpc, body, {"content-type": "application/json"})
    payload = json.load(urllib.request.urlopen(req, timeout=20))
    if payload.get("error"):
        print("BSC totalSupply RPC failed: %s" % (payload["error"],), file=sys.stderr)
        return 1
    total_wei = int(payload["result"], 16)
    quantum = Decimal("0.00000001")
    liability = (Decimal(total_wei) / (Decimal(10) ** 18)).quantize(
        quantum, rounding=ROUND_UP
    )
    needed = liability + reserve_pad
    public = min(public_hint, needed)
    ecosystem = needed - public
    if ecosystem < 0:
        print("bridge reserve split underflow", file=sys.stderr)
        return 1
    hint = public_hint + ecosystem_hint
    if needed > hint:
        print(
            "live wACP %s + reserve pad %s = %s ACP exceeds planned split %s"
            % (liability, reserve_pad, needed, hint),
            file=sys.stderr,
        )
        return 2
    print(public)
    print(ecosystem)
    print(
        "wACP totalSupply=%s wei; liability=%s ACP; reserve_pad=%s ACP; "
        "fund Public=%s Ecosystem=%s"
        % (total_wei, liability, reserve_pad, public, ecosystem),
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
