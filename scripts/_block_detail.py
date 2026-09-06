#!/usr/bin/env python3
import json, subprocess
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
VALIDATOR = "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um"

def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
    cmd = (
        "cd /opt/ancap-migration/current && docker compose -f docker-compose.prod.yml exec -T acp-node "
        f"sh -lc 'curl -sf -H \"User-Agent: ancap-backend/1.0\" -H \"Content-Type: application/json\" "
        f"-d {json.dumps(body)} http://127.0.0.1:8545/rpc'"
    )
    r = subprocess.run(["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd], capture_output=True, text=True, timeout=120)
    return json.loads((r.stdout or "").strip())["result"]

for h in [13, 14, 15]:
    bh = rpc("getblockhash", {"height": h})
    block = rpc("getblock", {"blockhash": bh, "verbose": 2})
    print(f"\n=== block {h} ===")
    for tx in block.get("tx", []):
        print("tx", tx.get("txid"))
        for vin in tx.get("vin", []):
            print("  in", vin.get("txid"), vin.get("vout"))
        for o in tx.get("vout", []):
            print("  out", o.get("recipient_address"), o.get("amount"))
