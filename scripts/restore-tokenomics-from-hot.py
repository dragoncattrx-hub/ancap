#!/usr/bin/env python3
"""Restore official tokenomics buckets from custodial hot.

Moves Public (25.2M) and Validator top-up back to canonical addresses.
Ecosystem 10.5M stays on hot (canonical keystore lost) — attributed in tokenomics API.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time

REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"
HOT_KS = "/run/secrets/custodial-hot.keystore.json"

CREATOR = "acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl"
VALIDATOR = "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um"
PUBLIC = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
ECOSYSTEM = "acp1qq9t4lf4z7lprt7a6nr682cl02f5tcyh45stakdf"
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"

TARGETS = {
    "creator": 69_300_000,
    "validator": 105_000_000,
    "public": 25_200_000,
    "ecosystem": 10_500_000,
}


def ssh(cmd: str, timeout: int = 600) -> str:
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "ssh failed").strip())
    return (r.stdout or "").strip()


def walletd(args: str) -> dict:
    out = ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api walletd {args}"
    )
    data = json.loads(out)
    if not data.get("ok"):
        raise RuntimeError(data.get("error") or out)
    return data["result"]


def acp_float(s: str) -> float:
    return float(str(s).replace(",", ""))


def tick(n: int = 1) -> None:
    for _ in range(n):
        ssh(
            f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
            "sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick "
            "-H \"content-type: application/json\" -H \"X-Cron-Secret: $CRON_SECRET\" -d \"{}\"' >/dev/null"
        )
        time.sleep(8)


def transfer_to(label: str, to_addr: str, amount_acp: str) -> None:
    print(f"=== {label}: {amount_acp} ACP -> {to_addr} ===")
    res = walletd(
        f"transfer --rpc {RPC} --keystore-file {HOT_KS} "
        f"--to {to_addr} --amount-acp {amount_acp}"
    )
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        raise RuntimeError(f"transfer not accepted: {label}")
    tick(4)


def main() -> int:
    hot_addr = walletd(f"address --keystore-file {HOT_KS}")["address"]
    if hot_addr != HOT:
        print(f"Hot keystore address mismatch: {hot_addr}", file=sys.stderr)
        return 1

    print("=== Balances before ===")
    for label, addr in [
        ("creator", CREATOR),
        ("validator", VALIDATOR),
        ("public", PUBLIC),
        ("ecosystem", ECOSYSTEM),
        ("hot", HOT),
    ]:
        b = walletd(f"balance --rpc {RPC} --address {addr}")
        print(f"{label:10} {b['acp']:>22} ACP")

    plan: list[tuple[str, str, str]] = []

    pb = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    pub = acp_float(pb["acp"])
    pub_need = max(0.0, TARGETS["public"] - pub)
    if pub_need >= 1.0:
        amt = f"{pub_need - 0.000001:.8f}".rstrip("0").rstrip(".")
        plan.append(("public", PUBLIC, amt))

    vb = walletd(f"balance --rpc {RPC} --address {VALIDATOR}")
    val = acp_float(vb["acp"])
    val_need = max(0.0, TARGETS["validator"] - val)
    if val_need >= 0.000001:
        amt = f"{val_need:.8f}".rstrip("0").rstrip(".")
        plan.append(("validator", VALIDATOR, amt))

    if not plan:
        print("All canonical buckets already at target (except ecosystem on hot).")
        return 0

    hb = walletd(f"balance --rpc {RPC} --address {HOT}")
    hot = acp_float(hb["acp"])
    total_need = sum(float(a) for _, _, a in plan)
    print(f"\nHot balance: {hot:,.2f} ACP; planned out: {total_need:,.2f} ACP")
    if hot < total_need + 0.001:
        print("Insufficient hot balance for restore plan", file=sys.stderr)
        return 1

    for label, addr, amt in plan:
        transfer_to(label, addr, amt)

    print("\n=== Balances after ===")
    for label, addr in [
        ("creator", CREATOR),
        ("validator", VALIDATOR),
        ("public", PUBLIC),
        ("ecosystem", ECOSYSTEM),
        ("hot", HOT),
    ]:
        b = walletd(f"balance --rpc {RPC} --address {addr}")
        print(f"{label:10} {b['acp']:>22} ACP")

    print("\nEcosystem 10.5M remains on hot (1 UTXO) until regenesis v3 keystore exists.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
