#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -c \
  "select id, status, user_bsc_address, amount_wacp_wei, acp_tx_hash, bsc_tx_hash_mint from bridge_operations where id='34a32432-bc7f-4177-9fca-c63d220833b4';"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -c \
  "select event_type, payload_json from bridge_audit_events where operation_id='34a32432-bc7f-4177-9fca-c63d220833b4' order by created_at desc limit 8;"
