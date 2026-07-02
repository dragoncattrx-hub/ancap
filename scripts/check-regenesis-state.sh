#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
echo "== acp-node status"
$COMPOSE ps acp-node 2>&1
echo "== chain tip"
$COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"' 2>&1; echo ""
echo "== genesis-v2 dir"
ls -la Sicret/genesis-v2 2>&1 || echo "not found"
ls -la Sicret/acp 2>&1 | head -5
