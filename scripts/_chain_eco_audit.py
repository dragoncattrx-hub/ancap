#!/usr/bin/env python3
"""Dump chain txs touching ecosystem or treasury on production."""
import json
import subprocess

ECO = "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
GENESIS = "acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl"
WATCH = {ECO, HOT, GENESIS, "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"}


def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
    cmd = (
        "cd /opt/ancap-migration/current && docker compose -f docker-compose.prod.yml exec -T acp-node "
        f"sh -lc 'curl -sf -H \"User-Agent: ancap-backend/1.0\" -H \"Content-Type: application/json\" "
        f"-d {json.dumps(body)} http://127.0.0.1:8545/rpc'"
    )
    r = subprocess.run(["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd], capture_output=True, text=True, timeout=120)
    out = (r.stdout or "").strip()
    return json.loads(out)["result"]


def main():
    tip = int(rpc("getblockcount", {}))
    print("height", tip)
    for h in range(1, tip + 1):
        bh = rpc("getblockhash", {"height": h})
        block = rpc("getblock", {"blockhash": bh, "verbose": 2})
        for tx in block.get("tx", []):
            txid = tx.get("txid")
            touched = []
            for o in tx.get("vout", []):
                addr = o.get("recipient_address")
                if addr in WATCH:
                    touched.append((addr, o.get("amount")))
            if touched:
                print(f"block {h} tx {txid}")
                for addr, amt in touched:
                    print(f"  -> {addr}: {amt}")


if __name__ == "__main__":
    main()
