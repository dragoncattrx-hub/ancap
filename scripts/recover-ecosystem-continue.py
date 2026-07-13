#!/usr/bin/env python3
"""Continue recovery after rewind: mine pending txs and finish transfers."""
from __future__ import annotations

import json
import subprocess
import time

REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
PUBLIC = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
GENESIS = "acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl"
VALIDATOR = "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um"
ECO = "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"
GENESIS_KS = "/run/secrets/genesis-v2/genesis-treasury.keystore.json"
PUBLIC_KS = "/run/secrets/public-liquidity.keystore.json"


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


def walletd(args: str) -> dict:
    out = ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api walletd {args}"
    )
    data = json.loads(out)
    if not data.get("ok"):
        raise RuntimeError(data.get("error") or out)
    return data["result"]


def tick() -> None:
    ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
        "sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick "
        "-H \"content-type: application/json\" -H \"X-Cron-Secret: $CRON_SECRET\" -d \"{}\"' >/dev/null"
    )


def mine_until(min_height: int, label: str) -> None:
    print(f"=== mining until height >= {min_height} ({label}) ===")
    for i in range(1, 20):
        tick()
        time.sleep(8)
        h = int(rpc("getblockcount", {}))
        print(f"tick {i}: height={h}")
        if h >= min_height:
            return
    raise RuntimeError(f"failed to reach height {min_height}")


def main() -> int:
    print("height", rpc("getblockcount", {}))
    print("hot", walletd(f"balance --rpc {RPC} --address {HOT}")["acp"])
    print("eco", walletd(f"balance --rpc {RPC} --address {ECO}")["acp"])

    mine_until(13, "treasury->hot 10.5M")

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
        mine_until(14, "validator remainder")

    gb2 = walletd(f"balance --rpc {RPC} --address {GENESIS}")
    g2 = float(str(gb2["acp"]).replace(",", ""))
    if g2 > 0.000002:
        amt = f"{g2 - 0.000001:.8f}".rstrip("0").rstrip(".")
        print(f"=== genesis dust -> hot {amt} ===")
        walletd(
            f"transfer --rpc {RPC} --keystore-file {GENESIS_KS} "
            f"--to {HOT} --amount-acp {amt}"
        )
        mine_until(int(rpc("getblockcount", {})) + 1, "genesis dust")

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
        for i in range(1, 15):
            tick()
            time.sleep(8)
            pub = float(str(walletd(f"balance --rpc {RPC} --address {PUBLIC}")["acp"]).replace(",", ""))
            h = int(rpc("getblockcount", {}))
            print(f"public tick {i}: height={h} public={pub:,.2f}")
            if pub < 1.0:
                break

    print("\n=== Final balances ===")
    for label, addr in [
        ("ecosystem", ECO),
        ("hot", HOT),
        ("public", PUBLIC),
        ("validator", VALIDATOR),
        ("genesis", GENESIS),
    ]:
        b = walletd(f"balance --rpc {RPC} --address {addr}")
        print(f"{label:10} {b['acp']:>20} ACP")
    print("height", rpc("getblockcount", {}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
