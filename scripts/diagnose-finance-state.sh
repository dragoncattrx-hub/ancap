#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "===== services"
$COMPOSE ps --format '{{.Name}} {{.State}} {{.Status}}' 2>/dev/null

PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n'); PGUSER=${PGUSER:-postgres}
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n'); PGDB=${PGDB:-$PGUSER}
echo "PGUSER=$PGUSER PGDB=$PGDB"
DBQ() { $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c "$1" 2>&1; }

echo "===== DB reachable?"
DBQ "select 1;"

echo "===== table counts"
DBQ "select 'users', count(*) from users
     union all select 'user_acp_wallets', count(*) from user_acp_wallets
     union all select 'accounts', count(*) from accounts
     union all select 'ledger_events', count(*) from ledger_events;"

echo "===== ledger balances by currency (net across all accounts; should be ~0 per currency)"
DBQ "select amount_currency,
       sum(case when dst_account_id is not null then amount_value else 0 end)
       - sum(case when src_account_id is not null then amount_value else 0 end) as net_all
     from ledger_events group by amount_currency order by amount_currency;"

echo "===== event type counts"
DBQ "select type, amount_currency, count(*), sum(amount_value) from ledger_events group by type, amount_currency order by type;"

echo "===== ledger invariant / halt flags (job_watermarks)"
DBQ "select key, value from job_watermarks where key ilike '%halt%' or key ilike '%invariant%' or key ilike '%ledger%';"

echo "===== recent ledger events (last 10)"
DBQ "select id, type, amount_currency, amount_value, ts from ledger_events order by ts desc limit 10;"

echo "===== top 15 accounts by ACP balance"
DBQ "select a.owner_type, a.account_kind, a.owner_id,
       coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
       - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0) as acp
     from accounts a order by acp desc limit 15;"

echo "===== positive user ACP balances count + total"
DBQ "select count(*), coalesce(sum(acp),0) from (
       select a.id,
         coalesce((select sum(amount_value) from ledger_events e where e.dst_account_id=a.id and e.amount_currency='ACP'),0)
         - coalesce((select sum(amount_value) from ledger_events e where e.src_account_id=a.id and e.amount_currency='ACP'),0) as acp
       from accounts a where a.owner_type='user'
     ) t where acp > 0;"

echo "===== alembic version"
DBQ "select version_num from alembic_version;"
