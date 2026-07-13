#!/usr/bin/env python3
"""Transfer full Public/Liquidity bucket to custodial hot wallet on production."""
from __future__ import annotations

import json
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KS_LOCAL = Path(r"C:\Users\drago\Desktop\ACP\wallets\public-liquidity.keystore.json")
REMOTE_DIR = "/opt/ancap-migration/current"
PUBLIC = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
REMOTE_KS = f"{REMOTE_DIR}/Sicret/public-liquidity.keystore.json"
CONTAINER_KS = "/run/secrets/public-liquidity.keystore.json"
RPC = "http://acp-node:8545/rpc"


def ssh(cmd: str, timeout: int = 300) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def walletd_remote(args: str) -> dict:
    cmd = (
        f"cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml exec -T api "
        f"walletd {args}"
    )
    r = ssh(cmd)
    out = (r.stdout or "").strip()
    if not out:
        raise RuntimeError(r.stderr or "empty walletd output")
    data = json.loads(out)
    if not data.get("ok"):
        raise RuntimeError(data.get("error") or r.stderr or "walletd failed")
    return data["result"]


def main() -> int:
    if not KS_LOCAL.is_file():
        print(f"Missing keystore: {KS_LOCAL}", file=sys.stderr)
        return 1

    # Verify local keystore address via server walletd (upload temp first)
    print("=== Upload public-liquidity keystore ===")
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = tmp.name
    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(KS_LOCAL, arcname="public-liquidity.keystore.json")
    with open(tar_path, "rb") as f:
        upload = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=20", "ancap-server", f"cd {REMOTE_DIR}/Sicret && tar xzf -"],
            stdin=f,
            capture_output=True,
            timeout=120,
        )
    Path(tar_path).unlink(missing_ok=True)
    if upload.returncode != 0:
        print(upload.stderr, file=sys.stderr)
        return 1

    derived = walletd_remote(f"address --keystore-file {CONTAINER_KS}")
    addr = str(derived.get("address") or "")
    print(f"Public signer: {addr}")
    if addr != PUBLIC:
        print(f"ERROR: keystore address mismatch (expected {PUBLIC})", file=sys.stderr)
        return 1

    bal = walletd_remote(f"balance --rpc {RPC} --address {PUBLIC}")
    public_acp = float(str(bal["acp"]).replace(",", ""))
    print(f"Public balance before: {bal['acp']} ACP")

    if public_acp < 1_000_000:
        print("Public wallet already empty or too low", file=sys.stderr)
        return 1

    # Send full balance minus 1 smallest unit headroom for fees
    amount = f"{public_acp - 0.000001:.8f}".rstrip("0").rstrip(".")
    print(f"=== Transfer {amount} ACP -> {HOT} ===")
    transfer_cmd = (
        f"transfer --rpc {RPC} --keystore-file {CONTAINER_KS} "
        f"--to {HOT} --amount-acp {amount}"
    )
    res = walletd_remote(transfer_cmd)
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        print("Transfer not accepted to mempool", file=sys.stderr)
        return 1

    # Mine via jobs tick
    print("=== Mining ticks ===")
    for i in range(1, 13):
        ssh(
            f'cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml exec -T api '
            'sh -lc \'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick '
            '-H "content-type: application/json" -H "X-Cron-Secret: $CRON_SECRET" -d "{}"\' >/dev/null'
        )
        time.sleep(8)
        pb = walletd_remote(f"balance --rpc {RPC} --address {PUBLIC}")
        hb = walletd_remote(f"balance --rpc {RPC} --address {HOT}")
        pub = float(str(pb["acp"]).replace(",", ""))
        hot = float(str(hb["acp"]).replace(",", ""))
        print(f"tick {i}: public={pub:,.2f} hot={hot:,.2f}")
        if pub < 1.0:
            break

    print("\n=== Final balances ===")
    for label, addr in [("public", PUBLIC), ("hot", HOT), ("ecosystem", "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5")]:
        b = walletd_remote(f"balance --rpc {RPC} --address {addr}")
        print(f"{label:10} {b['acp']:>20} ACP  utxo={b.get('utxo_count')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
