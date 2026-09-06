#!/usr/bin/env python3
"""Compare live on-chain balances vs official 210M tokenomics buckets."""
import json
import subprocess

REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"

BUCKETS = [
    ("Creator (33%)", "acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl", 69_300_000),
    ("Validator Reserve (50%)", "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um", 105_000_000),
    ("Public & Liquidity (12%)", "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm", 25_200_000),
    ("Ecosystem Grants (5%)", "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5", 10_500_000),
]
OTHER = [
    ("Custodial Hot", "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"),
    ("Genesis Treasury", "acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl"),
    ("Project Treasury", "acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902"),
    ("Bridge Reserve", "acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz"),
]


def bal(addr: str) -> dict:
    cmd = (
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
        f"walletd balance --rpc {RPC} --address {addr}"
    )
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return json.loads((r.stdout or "").strip())["result"]


def main() -> None:
    print("=== Official tokenomics buckets (target 210M) ===")
    total = 0.0
    for label, addr, target in BUCKETS:
        b = bal(addr)
        acp = float(str(b["acp"]).replace(",", ""))
        total += acp
        ok = "OK" if abs(acp - target) < 1 else "MISMATCH"
        print(f"{label:28} target={target:>14,.0f}  actual={acp:>18,.8f}  utxo={b['utxo_count']}  {ok}")

    print(f"\nSum of 4 buckets: {total:,.8f} ACP (target 210,000,000)")

    print("\n=== Operator / infra wallets ===")
    for label, addr in OTHER:
        b = bal(addr)
        acp = float(str(b["acp"]).replace(",", ""))
        print(f"{label:20} {acp:>20,.8f} ACP  utxo={b['utxo_count']}")

    print("\n=== Hot bucket split (UI logic) ===")
    script = r'''
import asyncio
from app.services.acp_tokenomics import fetch_custodial_hot_breakdown
async def main():
    r = await fetch_custodial_hot_breakdown("acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9")
    for b in r.buckets:
        print(f"{b.label}: {b.acp} ACP ({b.utxo_count} UTXO)")
    print(f"TOTAL: {r.total_acp} ACP")
asyncio.run(main())
'''
    cmd = (
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api python -c {json.dumps(script)}"
    )
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=180,
    )
    print(r.stdout or r.stderr)


if __name__ == "__main__":
    main()
