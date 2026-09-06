#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
DBQ() { $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c "$1" 2>&1; }

echo "===== LEDGER BY OWNER TYPE"
DBQ "select a.owner_type,
       count(*) as accounts,
       sum(coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
         - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0)) as total_acp
     from accounts a
     group by a.owner_type
     order by total_acp desc nulls last;"

echo "===== TOP 20 ACCOUNTS"
DBQ "select a.owner_type, a.account_kind, left(a.owner_id::text,8) as owner,
       coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
       - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0) as acp
     from accounts a
     having coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
       - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0) > 0
     order by acp desc limit 20;"

echo "===== DEPOSITS VS ONCHAIN"
DBQ "select type, count(*), sum(amount_value) from ledger_events where amount_currency='ACP' and type ilike '%deposit%' group by type;"

echo "===== TOTAL POSITIVE LEDGER ACP"
DBQ "select sum(acp) from (
       select coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
         - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0) as acp
       from accounts a
     ) t where acp > 0;"
