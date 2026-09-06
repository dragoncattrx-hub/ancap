#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
DBQ() { $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c "$1" 2>&1; }

echo "===== bridge ops pending"
DBQ "select id, status, amount_acp_smallest, acp_tx_hash, bsc_tx_hash, created_at::text from bridge_operations where status in ('PENDING_DEPOSIT','CONFIRMED_ON_ACP','MINT_REQUESTED','MINTED_ON_BSC') order by created_at;"

echo "===== recent bridge audit"
DBQ "select event_type, created_at::text, left(payload_json::text,120) from bridge_audit_events order by created_at desc limit 15;"

echo "===== reserve on-chain"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz 2>&1 | tail -1

echo "===== chain height"
$COMPOSE exec -T api sh -c "curl -sf -X POST \"\$ACP_RPC_URL\" -H 'content-type: application/json' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}'"

echo "===== trigger jobs tick"
$COMPOSE exec -T api sh -c 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick -H "content-type: application/json" -d "{}"' || true
