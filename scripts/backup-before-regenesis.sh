#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
TS=$(date -u +%Y%m%dT%H%M%SZ)
BK="/opt/ancap-migration/current/Sicret/backups/$TS"
mkdir -p "$BK"
echo "backup dir: $BK"

PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n'); PGUSER=${PGUSER:-postgres}

echo "== pg_dump ancap"
$COMPOSE exec -T postgres pg_dump -U "$PGUSER" -d ancap --no-owner > "$BK/ancap-$TS.sql" 2>"$BK/pg_dump.err" && echo "  ok $(wc -c < "$BK/ancap-$TS.sql") bytes" || { echo "  FAILED"; cat "$BK/pg_dump.err"; }

echo "== ledger balances snapshot (per account, ACP)"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -t -A -F'|' -c "
  select a.owner_type, a.account_kind, a.owner_id,
    coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
    - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0) as acp
  from accounts a order by acp desc;" > "$BK/ledger-balances-acp-$TS.txt" 2>&1
echo "  rows: $(wc -l < "$BK/ledger-balances-acp-$TS.txt")"

echo "== user wallet -> ledger balance mapping (user accounts joined to on-chain address)"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -t -A -F'|' -c "
  select u.id as user_id, u.email, w.address,
    coalesce((select sum(amount_value) from ledger_events e join accounts a on e.dst_account_id=a.id where a.owner_type='user' and a.owner_id=u.id and e.amount_currency='ACP'),0)
    - coalesce((select sum(amount_value) from ledger_events e join accounts a on e.src_account_id=a.id where a.owner_type='user' and a.owner_id=u.id and e.amount_currency='ACP'),0) as ledger_acp
  from users u left join user_acp_wallets w on w.user_id=u.id order by ledger_acp desc;" > "$BK/user-wallet-ledger-$TS.txt" 2>&1
echo "  rows: $(wc -l < "$BK/user-wallet-ledger-$TS.txt")"

echo "== full accounts + ledger_events raw dump (csv)"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -c "\copy (select * from accounts) to stdout with csv header" > "$BK/accounts-$TS.csv" 2>&1
$COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -c "\copy (select id,ts,type,amount_currency,amount_value,src_account_id,dst_account_id,metadata from ledger_events) to stdout with csv header" > "$BK/ledger_events-$TS.csv" 2>&1
echo "  accounts.csv $(wc -l < "$BK/accounts-$TS.csv") lines; ledger_events.csv $(wc -l < "$BK/ledger_events-$TS.csv") lines"

echo "== on-chain balances for all user wallets + key addresses"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
ADDRS=$($COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -t -A -c "select address from user_acp_wallets;" | tr -d '\r')
: > "$BK/onchain-balances-$TS.txt"
for a in $ADDRS acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9 acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz acp1qzf6ccmzdekql4hgtvg7hlu92kzup8ywrczrkxt4 acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902; do
  r=$($COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$a" 2>&1 | tail -1)
  echo "$a|$r" >> "$BK/onchain-balances-$TS.txt"
done
echo "  wrote onchain-balances ($(wc -l < "$BK/onchain-balances-$TS.txt") addrs)"

echo "== tar acp-node data dir (live snapshot)"
$COMPOSE exec -T acp-node sh -c 'cd / && tar czf - var/lib/acp-node 2>/dev/null' > "$BK/acp-node-data-$TS.tgz" 2>/dev/null && echo "  ok $(wc -c < "$BK/acp-node-data-$TS.tgz") bytes" || echo "  tar failed"

echo "== chain tip"
$COMPOSE exec -T api sh -c "curl -s -X POST \$ACP_RPC_URL -H 'content-type: application/json' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}'" | tee "$BK/chain-tip-$TS.txt"; echo ""

echo "== BACKUP COMPLETE: $BK"
ls -la "$BK"
