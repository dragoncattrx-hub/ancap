#!/usr/bin/env python3
"""Gate A: compute max additional mint from live reserve proof JSON."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.wacp_mint_envelope import compute_mint_envelope, suggest_stage_a_mint  # noqa: E402


def _fetch_proof(base_url: str) -> dict:
    url = base_url.rstrip("/") + "/wacp/reserve-proof"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ancap-wacp-mint-envelope/1.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://api.ancap.cloud/v1")
    parser.add_argument("--proof-json", help="Path to reserve-proof JSON instead of HTTP fetch")
    parser.add_argument(
        "--approved-cap-wacp",
        type=float,
        help="Human wACP cap for Stage A (same units as on-chain wACP, 18 decimals display)",
    )
    args = parser.parse_args()

    if args.proof_json:
        payload = json.loads(Path(args.proof_json).read_text(encoding="utf-8"))
    else:
        try:
            payload = _fetch_proof(args.base_url)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            print(f"FAIL: could not load reserve proof: {exc}", file=sys.stderr)
            return 2

    envelope = compute_mint_envelope(
        acp_reserve_balance_smallest=payload.get("acp_reserve_balance_smallest"),
        wacp_total_supply_acp_smallest=payload.get("wacp_total_supply_acp_smallest"),
        operational_buffer_smallest=payload.get("operational_buffer_smallest"),
    )

    cap_smallest = None
    if args.approved_cap_wacp is not None:
        cap_smallest = int(args.approved_cap_wacp * 10**8)

    suggested = suggest_stage_a_mint(envelope, cap_smallest)

    out = {
        "gate_a_pass": envelope.gate_a_pass,
        "acp_reserve_smallest": envelope.acp_reserve_smallest,
        "minted_acp_smallest": envelope.minted_acp_smallest,
        "operational_buffer_smallest": envelope.operational_buffer_smallest,
        "max_additional_mint_acp_smallest": envelope.max_additional_mint_acp_smallest,
        "max_additional_mint_wacp_human": envelope.max_additional_mint_acp_smallest / 10**8,
        "suggested_stage_a_mint_acp_smallest": suggested,
        "suggested_stage_a_mint_wacp_human": suggested / 10**8,
        "notes": envelope.notes + list(payload.get("mint_envelope_notes") or []),
        "reserve_health": payload.get("reserve_health"),
    }
    print(json.dumps(out, indent=2))
    return 0 if envelope.gate_a_pass else 1


if __name__ == "__main__":
    raise SystemExit(main())
