#!/usr/bin/env python3
import json, subprocess
HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"

def rpc(method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
    cmd = (
        "cd /opt/ancap-migration/current && docker compose -f docker-compose.prod.yml exec -T acp-node "
        f"sh -lc 'curl -sf -H \"User-Agent: ancap-backend/1.0\" -H \"Content-Type: application/json\" "
        f"-d {json.dumps(body)} http://127.0.0.1:8545/rpc'"
    )
    r = subprocess.run(["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd], capture_output=True, text=True, timeout=120)
    return json.loads((r.stdout or "").strip())["result"]

tip = int(rpc("getblockcount", {}))
total_out = 0
total_in = 0
for h in range(1, tip + 1):
    bh = rpc("getblockhash", {"height": h})
    block = rpc("getblock", {"blockhash": bh, "verbose": 2})
    for tx in block.get("tx", []):
        for o in tx.get("vout", []):
            if o.get("recipient_address") == HOT:
                total_out += int(o.get("amount", 0))
        for vin in tx.get("vin", []):
            prev = vin.get("txid")
            if not prev:
                continue
            prev_tx = rpc("getrawtransaction", {"txid": prev, "verbose": True})
            for o in prev_tx.get("vout", []):
                if o.get("recipient_address") == HOT and vin.get("vout") == o.get("n"):
                    total_in += int(o.get("amount", 0))

print("tip", tip)
print("hot outputs sum", total_out)
print("hot inputs sum", total_in)
print("net", total_out - total_in)
print("acp net", (total_out - total_in) / 1e8)

out = subprocess.run(
    ["ssh", "-o", "ConnectTimeout=20", "ancap-server",
     "cd /opt/ancap-migration/current && docker compose -f docker-compose.prod.yml exec -T api "
     "walletd balance --rpc http://acp-node:8545/rpc --address " + HOT],
    capture_output=True, text=True, timeout=60,
)
print("walletd", out.stdout.strip())
