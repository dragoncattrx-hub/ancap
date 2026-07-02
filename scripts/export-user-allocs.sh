#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGUSER=${PGUSER:-postgres}
OUT="${1:-/tmp/user-allocs.json}"

echo "== export user ledger balances -> $OUT"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -t -A -F'|' -c "
  select w.address,
    (
      coalesce((select sum(e.amount_value) from ledger_events e join accounts a on e.dst_account_id=a.id where a.owner_type='user' and a.owner_id=u.id and e.amount_currency='ACP'),0)
      - coalesce((select sum(e.amount_value) from ledger_events e join accounts a on e.src_account_id=a.id where a.owner_type='user' and a.owner_id=u.id and e.amount_currency='ACP'),0)
    )::text as ledger_acp
  from users u
  join user_acp_wallets w on w.user_id=u.id
  order by ledger_acp desc;" > /tmp/user-ledger-raw.txt

python3 - <<'PY' /tmp/user-ledger-raw.txt "$OUT"
import json, sys
rows = []
for line in open(sys.argv[1]):
    line = line.strip()
    if not line or '|' not in line:
        continue
    addr, acp = line.split('|', 1)
    addr = addr.strip()
    acp = acp.strip()
    if not addr:
        continue
    try:
        val = float(acp)
    except ValueError:
        continue
    if val <= 0:
        continue
    rows.append({"address": addr, "acp": format(val, 'f').rstrip('0').rstrip('.') or "0"})
with open(sys.argv[2], 'w') as f:
    json.dump(rows, f, indent=2)
    f.write('\n')
print(f"wrote {len(rows)} user allocations to {sys.argv[2]}")
for r in rows[:5]:
    print(f"  {r['address'][:20]}... = {r['acp']} ACP")
if len(rows) > 5:
    print(f"  ... and {len(rows)-5} more")
PY
