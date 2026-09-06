#!/usr/bin/env python3
"""Inspect user wallet + hot on-chain vs ledger on production."""
import json
import subprocess

HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"


def ssh(cmd: str) -> str:
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def main() -> None:
    print("=== on-chain hot ===")
    out = ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
        f"walletd balance --rpc {RPC} --address {HOT}"
    )
    print(out)

    print("\n=== user_acp_wallets with hot address ===")
    q = (
        "SELECT u.email, w.user_id::text, w.address, w.created_at "
        "FROM user_acp_wallets w JOIN users u ON u.id = w.user_id "
        f"WHERE w.address = '{HOT}' LIMIT 5;"
    )
    print(ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T postgres "
        f"psql -U postgres -d ancap -t -A -F'|' -c \"{q}\""
    ))

    user_id = "2f9f57cb-c604-4239-8dfe-70c15d291e06"
    print(f"\n=== operator user {user_id} (dragon.cat.trx@gmail.com) ===")
    q3 = f"SELECT address, created_at FROM user_acp_wallets WHERE user_id = '{user_id}';"
    print(ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T postgres "
        f"psql -U postgres -d ancap -t -A -F'|' -c \"{q3}\""
    ))

    print("\n=== ledger ACP accounts for user ===")
    q4 = (
        "SELECT a.id::text, a.owner_type, COALESCE(SUM(CASE WHEN e.dst_account_id=a.id THEN e.amount_value ELSE 0 END),0) "
        "- COALESCE(SUM(CASE WHEN e.src_account_id=a.id THEN e.amount_value ELSE 0 END),0) AS net "
        "FROM accounts a LEFT JOIN ledger_events e ON e.amount_currency='ACP' "
        "AND (e.src_account_id=a.id OR e.dst_account_id=a.id) "
        f"WHERE (a.owner_type='user' AND a.owner_id='{user_id}') "
        f"OR (a.owner_type='agent' AND a.owner_id IN (SELECT id FROM agents WHERE owner_user_id='{user_id}')) "
        "GROUP BY a.id, a.owner_type ORDER BY net DESC;"
    )
    print(ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T postgres "
        f"psql -U postgres -d ancap -c \"{q4}\""
    ))

    print("\n=== active stakes ===")
    q5 = (
        "SELECT COALESCE(SUM(s.amount_value),0) FROM stakes s "
        f"JOIN agents ag ON ag.id=s.agent_id WHERE ag.owner_user_id='{user_id}' "
        "AND s.status='active' AND s.amount_currency='ACP';"
    )
    print(ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T postgres "
        f"psql -U postgres -d ancap -t -A -c \"{q5}\""
    ))


if __name__ == "__main__":
    main()
