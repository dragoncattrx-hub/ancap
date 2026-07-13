#!/usr/bin/env python3
"""Transfer full Ecosystem Grants bucket to custodial hot wallet on production.

Requires the canonical ecosystem keystore (same batch as creator/public keystores).
Mnemonic alone cannot recover PQC addresses — keystore JSON is mandatory.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ECOSYSTEM = "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
REMOTE_DIR = "/opt/ancap-migration/current"
CONTAINER_KS = "/run/secrets/ecosystem-canonical.keystore.json"
RPC = "http://acp-node:8545/rpc"

# Search order: env override, then known operator paths (never commit keystores).
DEFAULT_KEYSTORE_CANDIDATES = [
    Path(r"C:\Users\drago\Desktop\ACP\wallets\ecosystem-canonical.keystore.json"),
    Path(r"C:\Users\drago\Desktop\ACP\wallets\ecosystem.keystore.json"),
    Path(r"C:\Users\drago\Desktop\Sicret\ecosystem-canonical.keystore.json"),
]


def resolve_keystore() -> Path:
    override = os.environ.get("ECOSYSTEM_KEYSTORE_FILE", "").strip()
    if override:
        p = Path(override)
        if p.is_file():
            return p
        raise FileNotFoundError(f"ECOSYSTEM_KEYSTORE_FILE not found: {override}")
    for p in DEFAULT_KEYSTORE_CANDIDATES:
        if p.is_file():
            return p
    raise FileNotFoundError(
        "Canonical ecosystem keystore not found. "
        f"Need keystore for {ECOSYSTEM} (same genesis batch as creator.keystore.json)."
    )


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
    ks_path = resolve_keystore()
    print(f"=== Using keystore: {ks_path} ===")

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = tmp.name
    with tarfile.open(tar_path, "w:gz") as tar:
        tar.add(ks_path, arcname="ecosystem-canonical.keystore.json")
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
    print(f"Ecosystem signer: {addr}")
    if addr != ECOSYSTEM:
        print(
            f"ERROR: keystore controls {addr}, not canonical ecosystem {ECOSYSTEM}.\n"
            "The on-chain 10.5M UTXO requires the matching KeystoreV3 from the\n"
            "29.04.2026 genesis batch (same run as creator/public keystores).",
            file=sys.stderr,
        )
        return 1

    bal = walletd_remote(f"balance --rpc {RPC} --address {ECOSYSTEM}")
    eco_acp = float(str(bal["acp"]).replace(",", ""))
    print(f"Ecosystem balance before: {bal['acp']} ACP")
    if eco_acp < 1_000_000:
        print("Ecosystem wallet already empty or too low", file=sys.stderr)
        return 1

    amount = f"{eco_acp - 0.000001:.8f}".rstrip("0").rstrip(".")
    print(f"=== Transfer {amount} ACP -> {HOT} ===")
    res = walletd_remote(
        f"transfer --rpc {RPC} --keystore-file {CONTAINER_KS} "
        f"--to {HOT} --amount-acp {amount}"
    )
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        return 1

    for i in range(1, 13):
        ssh(
            f'cd {REMOTE_DIR} && docker compose -f docker-compose.prod.yml exec -T api '
            'sh -lc \'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick '
            '-H "content-type: application/json" -H "X-Cron-Secret: $CRON_SECRET" -d "{}"\' >/dev/null'
        )
        time.sleep(8)
        eb = walletd_remote(f"balance --rpc {RPC} --address {ECOSYSTEM}")
        hb = walletd_remote(f"balance --rpc {RPC} --address {HOT}")
        if float(str(eb["acp"]).replace(",", "")) < 1.0:
            print(f"tick {i}: ecosystem=0 hot={hb['acp']}")
            break

    print("\n=== Final balances ===")
    for label, a in [("ecosystem", ECOSYSTEM), ("hot", HOT)]:
        b = walletd_remote(f"balance --rpc {RPC} --address {a}")
        print(f"{label:10} {b['acp']:>20} ACP")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
