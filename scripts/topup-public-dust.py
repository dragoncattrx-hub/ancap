#!/usr/bin/env python3
"""Send 1 dust unit (0.000001 ACP) from custodial hot to public bucket."""
from __future__ import annotations

import json
import subprocess
import sys
import time

REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"
HOT_KS = "/run/secrets/custodial-hot.keystore.json"
PUBLIC = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
TARGET_PUBLIC = 25_200_000.0
DUST = "0.000001"


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


def tick(n: int = 1) -> None:
    for _ in range(n):
        ssh(
            f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
            "sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick "
            "-H \"content-type: application/json\" -H \"X-Cron-Secret: $CRON_SECRET\" -d \"{}\"' >/dev/null"
        )
        time.sleep(8)


def main() -> int:
    before = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    pub_before = float(str(before["acp"]).replace(",", ""))
    need = TARGET_PUBLIC - pub_before
    print(f"Public before: {pub_before} ACP (need {need:.8f})")

    if need <= 0 or need > 0.000001:
        if abs(need) < 1e-9:
            print("Public bucket already at target.")
            return 0
        if need > 0.000001:
            print(f"Deficit larger than dust ({need}); use restore-tokenomics-from-hot.py", file=sys.stderr)
            return 1
        print("Public bucket is above target; no top-up needed.")
        return 0

    print(f"=== hot -> public: {DUST} ACP ===")
    res = walletd(
        f"transfer --rpc {RPC} --keystore-file {HOT_KS} "
        f"--to {PUBLIC} --amount-acp {DUST}"
    )
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        raise RuntimeError("transfer not accepted")
    tick(4)

    after = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    print(f"Public after: {after['acp']} ACP")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
