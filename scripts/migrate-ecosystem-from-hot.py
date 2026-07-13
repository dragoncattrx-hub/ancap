#!/usr/bin/env python3
"""Move 10.5M ecosystem bucket from custodial hot to a new spendable ecosystem wallet.

Preserves user ledger balances (Postgres) — only operator UTXOs move on-chain.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"
HOT_KS = "/run/secrets/custodial-hot.keystore.json"
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
ECOSYSTEM_AMOUNT = "10500000"
REMOTE_ECOSYSTEM_KS = f"{REMOTE}/Sicret/ecosystem-grants.keystore.json"
REMOTE_ECOSYSTEM_WALLET = f"{REMOTE}/Sicret/ecosystem-grants-wallet.txt"
CONTAINER_ECOSYSTEM_KS = "/run/secrets/ecosystem-grants.keystore.json"
LOCAL_MANIFEST = Path(__file__).resolve().parents[1] / "ACP-crypto" / "genesis-keystore-manifest.json"


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


def tick(n: int = 4) -> None:
    for _ in range(n):
        ssh(
            f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
            "sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick "
            "-H \"content-type: application/json\" -H \"X-Cron-Secret: $CRON_SECRET\" -d \"{}\"' >/dev/null"
        )
        time.sleep(8)


def main() -> int:
    hot_addr = walletd(f"address --keystore-file {HOT_KS}")["address"]
    if hot_addr != HOT:
        print(f"Hot keystore mismatch: {hot_addr}", file=sys.stderr)
        return 1

    # Reuse existing ecosystem keystore if already provisioned.
    check = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", f"test -f {REMOTE_ECOSYSTEM_KS}"],
        capture_output=True,
    )
    if check.returncode == 0:
        eco_addr = walletd(f"address --keystore-file {CONTAINER_ECOSYSTEM_KS}")["address"]
        print(f"Existing ecosystem wallet: {eco_addr}")
    else:
        print("=== Creating new ecosystem wallet ===")
        created = walletd("new")
        eco_addr = created["address"]
        ks_json = created["keystore_json"]
        mnemonic = created["mnemonic"]
        wallet_txt = (
            f"role: Ecosystem Grants (spendable)\n"
            f"address: {eco_addr}\n"
            f"amount_acp: {ECOSYSTEM_AMOUNT}\n"
            f"mnemonic: {mnemonic}\n"
            f"keystore_file: ecosystem-grants.keystore.json\n"
        )
        # Upload keystore + wallet record to Sicret on server.
        for remote_path, content, mode in [
            (REMOTE_ECOSYSTEM_KS, ks_json, "600"),
            (REMOTE_ECOSYSTEM_WALLET, wallet_txt, "600"),
        ]:
            r = subprocess.run(
                ["ssh", "-o", "ConnectTimeout=20", "ancap-server", f"cat > {remote_path} && chmod {mode} {remote_path}"],
                input=content.encode("utf-8"),
                capture_output=True,
                timeout=120,
            )
            if r.returncode != 0:
                raise RuntimeError((r.stderr or r.stdout).decode("utf-8", errors="replace"))
        print(f"Saved keystore to {REMOTE_ECOSYSTEM_KS}")
        print(f"New ecosystem address: {eco_addr}")

    eco_bal = walletd(f"balance --rpc {RPC} --address {eco_addr}")
    eco_acp = float(str(eco_bal["acp"]).replace(",", ""))
    if eco_acp >= float(ECOSYSTEM_AMOUNT) - 0.000001:
        print(f"Ecosystem wallet already funded: {eco_bal['acp']} ACP")
        print(f"ECOSYSTEM_ADDRESS={eco_addr}")
        return 0

    print(f"=== Transfer {ECOSYSTEM_AMOUNT} ACP hot -> {eco_addr} ===")
    res = walletd(
        f"transfer --rpc {RPC} --keystore-file {HOT_KS} "
        f"--to {eco_addr} --amount-acp {ECOSYSTEM_AMOUNT}"
    )
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        raise RuntimeError("transfer not accepted")
    tick()

    after = walletd(f"balance --rpc {RPC} --address {eco_addr}")
    hot_after = walletd(f"balance --rpc {RPC} --address {HOT}")
    print(f"Ecosystem after: {after['acp']} ACP")
    print(f"Hot after: {hot_after['acp']} ACP")
    print(f"ECOSYSTEM_ADDRESS={eco_addr}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
