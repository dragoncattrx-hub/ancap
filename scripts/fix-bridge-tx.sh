#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
TXID="86468f2ab46ed4d681bb15bad67760c1e1d8537c32b12d47afcc8f2c9227f44c"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
DBQ() { $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c "$1"; }

echo "===== tx lookup"
$COMPOSE exec -T api sh -lc "curl -sf -X POST \"\$ACP_RPC_URL\" -H 'content-type: application/json' -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getrawtransaction\",\"params\":{\"txid\":\"$TXID\",\"verbose\":true}}'"

echo
echo "===== pending ops"
DBQ "select id, status, amount_acp_smallest, acp_tx_hash, user_bsc_address, created_at::text from bridge_operations where direction='acp_to_bsc' and status='PENDING_DEPOSIT' order by created_at;"

echo "===== tx already used?"
DBQ "select id, status, amount_acp_smallest from bridge_operations where acp_tx_hash='$TXID';"

echo "===== reserve balance"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz 2>&1 | tail -3

echo "===== jobs tick"
$COMPOSE exec -T api sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick -H "content-type: application/json" -d "{}"' || true

echo
echo "===== after tick pending"
DBQ "select id, status, amount_acp_smallest, acp_tx_hash, bsc_tx_hash_mint from bridge_operations where direction='acp_to_bsc' order by created_at desc limit 10;"
