#!/usr/bin/env python3
import subprocess

queries = [
    "SELECT acp_address, length(encrypted_secret) FROM user_acp_wallets ORDER BY created_at DESC LIMIT 30;",
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;",
]

for q in queries:
    cmd = (
        "cd /opt/ancap-migration/current && "
        "docker compose -f docker-compose.prod.yml exec -T postgres "
        f"psql -U ancap -d ancap -c \"{q}\""
    )
    print("===", q[:60], "===")
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=120,
    )
    print(r.stdout or r.stderr)
