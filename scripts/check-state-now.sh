#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
echo "== chain tip"
$COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"'; echo ""
echo "== treasury balance (acp1qpw9...)"
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 2>&1 | tail -1
echo "== deployed fees endpoint"
$COMPOSE exec -T api sh -c 'curl -s -m 10 http://127.0.0.1:8000/v1/system/fees'; echo ""
echo "== git log/status"
git log --oneline -3 2>&1
git status --short 2>&1 | head
