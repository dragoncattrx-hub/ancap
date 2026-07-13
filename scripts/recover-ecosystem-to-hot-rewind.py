#!/usr/bin/env python3
"""Recover lost ecosystem keystore by rewinding chain to block 12 and sending 10.5M to hot.

Block 13 funded ecosystem (no keystore). We replay blocks 1-12, then treasury -> hot.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time

REMOTE = "/opt/ancap-migration/current"
REWIND_TO = 12
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
PUBLIC = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
GENESIS = "acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl"
VALIDATOR = "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um"
ECO_AMOUNT = "10500000"
RPC = "http://acp-node:8545/rpc"
GENESIS_KS = "/run/secrets/genesis-v2/genesis-treasury.keystore.json"  # Sicret/genesis-v2/
PUBLIC_KS = "/run/secrets/public-liquidity.keystore.json"


def ssh(cmd: str, timeout: int = 600) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def sh(script: str) -> str:
    r = ssh(f"bash -lc {json.dumps(script)}")
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "ssh failed").strip())
    return (r.stdout or "").strip()


def walletd(args: str) -> dict:
    out = sh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api walletd {args}"
    )
    data = json.loads(out)
    if not data.get("ok"):
        raise RuntimeError(data.get("error") or out)
    return data["result"]


def rpc(method: str, params: dict | None = None) -> dict:
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}})
    cmd = (
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T acp-node "
        f"sh -lc 'curl -sf -H \"User-Agent: ancap-backend/1.0\" -H \"Content-Type: application/json\" "
        f"-d {json.dumps(body)} http://127.0.0.1:8545/rpc'"
    )
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=120,
    )
    out = (r.stdout or "").strip()
    if r.returncode != 0:
        raise RuntimeError((r.stderr or out or "rpc failed").strip())
    payload = json.loads(out)
    if payload.get("error"):
        raise RuntimeError(str(payload["error"]))
    return payload["result"]


def tick(n: int = 1) -> None:
    for _ in range(n):
        ssh(
            f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
            "sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick "
            "-H \"content-type: application/json\" -H \"X-Cron-Secret: $CRON_SECRET\" -d \"{}\"' >/dev/null"
        )
        time.sleep(8)


def export_blocks(max_h: int) -> list[str]:
    blocks: list[str] = []
    for h in range(1, max_h + 1):
        bh = rpc("getblockhash", {"height": h})
        block = rpc("getblock", {"blockhash": bh, "verbose": False})
        if not isinstance(block, str):
            raise RuntimeError(f"block {h} not hex")
        blocks.append(block)
        print(f"exported block {h} ({len(block)//2} bytes)")
    return blocks


def main() -> int:
    tip = int(rpc("getblockcount", {}))
    print(f"current height {tip}")
    if tip < REWIND_TO:
        print("chain too short", file=sys.stderr)
        return 1

    eco_before = walletd(f"balance --rpc {RPC} --address acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5")
    print(f"ecosystem before: {eco_before['acp']} ACP")

    print(f"=== export blocks 1..{REWIND_TO} ===")
    blocks = export_blocks(REWIND_TO)

    ts = int(time.time())
    backup = f"{REMOTE}/Sicret/acp-backup-rewind-{ts}"
    print(f"=== stop node, backup data -> {backup} ===")
    sh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml stop acp-node && "
        f"cp -a Sicret/acp {backup} && rm -rf Sicret/acp/*"
    )

    print("=== start node on empty data ===")
    sh(f"cd {REMOTE} && docker compose -f docker-compose.prod.yml up -d acp-node")
    time.sleep(5)

    print("=== replay blocks ===")
    for i, hex_block in enumerate(blocks, start=1):
        res = rpc("submitblock", {"block": hex_block})
        if not res.get("accepted"):
            print(f"replay block {i} failed: {res}", file=sys.stderr)
            return 1
        print(f"replayed block {i}")

    h = int(rpc("getblockcount", {}))
    print(f"height after replay: {h}")

    print(f"=== treasury -> hot {ECO_AMOUNT} ACP (ecosystem bucket) ===")
    res = walletd(
        f"transfer --rpc {RPC} --keystore-file {GENESIS_KS} "
        f"--to {HOT} --amount-acp {ECO_AMOUNT}"
    )
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        return 1
    tick(3)

    # validator remainder from treasury
    gb = walletd(f"balance --rpc {RPC} --address {GENESIS}")
    g_acp = float(str(gb["acp"]).replace(",", ""))
    vb = walletd(f"balance --rpc {RPC} --address {VALIDATOR}")
    v_acp = float(str(vb["acp"]).replace(",", ""))
    vneed = min(g_acp - 0.000001, max(0.0, 105_000_000 - v_acp))
    if vneed >= 1.0:
        amt = f"{vneed:.8f}".rstrip("0").rstrip(".")
        print(f"=== validator remainder {amt} ACP ===")
        res = walletd(
            f"transfer --rpc {RPC} --keystore-file {GENESIS_KS} "
            f"--to {VALIDATOR} --amount-acp {amt}"
        )
        print(json.dumps(res, indent=2))
        tick(3)

    # genesis dust -> hot
    gb2 = walletd(f"balance --rpc {RPC} --address {GENESIS}")
    g2 = float(str(gb2["acp"]).replace(",", ""))
    if g2 > 0.000002:
        amt = f"{g2 - 0.000001:.8f}".rstrip("0").rstrip(".")
        print(f"=== genesis dust -> hot {amt} ===")
        walletd(
            f"transfer --rpc {RPC} --keystore-file {GENESIS_KS} "
            f"--to {HOT} --amount-acp {amt}"
        )
        tick(2)

    # public -> hot
    pb = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    p_acp = float(str(pb["acp"]).replace(",", ""))
    if p_acp >= 1_000_000:
        amt = f"{p_acp - 0.000001:.8f}".rstrip("0").rstrip(".")
        print(f"=== public -> hot {amt} ACP ===")
        res = walletd(
            f"transfer --rpc {RPC} --keystore-file {PUBLIC_KS} "
            f"--to {HOT} --amount-acp {amt}"
        )
        print(json.dumps(res, indent=2))
        tick(6)

    print("\n=== Final balances ===")
    for label, addr in [
        ("ecosystem", "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"),
        ("hot", HOT),
        ("public", PUBLIC),
        ("validator", VALIDATOR),
    ]:
        b = walletd(f"balance --rpc {RPC} --address {addr}")
        print(f"{label:10} {b['acp']:>20} ACP")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
