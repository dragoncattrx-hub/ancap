#!/usr/bin/env python3
import json
import subprocess

TARGET = "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"
REMOTE = "/opt/ancap-migration/current"
FILES = """
Sicret/ecosystem-canonical.keystore.json
Sicret/ecosystem.keystore.json
Sicret/public-liquidity.keystore.json
Sicret/custodial-hot.keystore.json
Sicret/_scan/ks0_ecosystem.keystore.json
Sicret/_scan/ks1_creator.keystore.json
Sicret/_scan/ks2_ecosystem.keystore.json
Sicret/_scan/ks3_ecosystem.keystore.json
Sicret/_scan/ks3_public-liquidity.keystore.json
Sicret/_scan/ks5_validator-reserve.keystore.json
Sicret/genesis-v2/genesis-treasury.keystore.json
""".strip().splitlines()


def ssh(cmd: str) -> str:
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=120,
    )
    return (r.stdout or "").strip()


def main() -> None:
    listing = ssh(f"find {REMOTE}/Sicret -name '*.keystore.json' 2>/dev/null | sort")
    print("=== all keystores ===")
    print(listing)
    for rel in FILES:
        bn = rel.split("/")[-1]
        out = ssh(
            f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
            f"walletd address --keystore-file /run/secrets/{bn}"
        )
        try:
            addr = json.loads(out)["result"]["address"]
        except Exception:
            addr = out[:120]
        mark = " *** MATCH ***" if addr == TARGET else ""
        print(f"{rel} -> {addr}{mark}")


if __name__ == "__main__":
    main()
