#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "== stop runaway builds"
docker ps -q --filter ancestor=rust:1.86-bookworm 2>/dev/null | xargs -r docker kill 2>/dev/null || true
docker ps -q --filter ancestor=rust:1.85-bookworm 2>/dev/null | xargs -r docker kill 2>/dev/null || true
pkill -f 'cargo build' 2>/dev/null || true
pkill -f 'rustc' 2>/dev/null || true
sleep 3

echo "== load $(cut -d' ' -f1-3 /proc/loadavg)"
free -h | head -2

echo "== git sync"
git fetch origin master 2>&1 | tail -1 || true
git reset --hard origin/master

echo "== rebuild api only (not acp-node)"
$COMPOSE build api 2>&1 | tail -20

echo "== restart services"
$COMPOSE up -d api frontend acp-node proxy 2>&1 | tail -10

echo "== wait api healthy"
for i in $(seq 1 30); do
  if $COMPOSE exec -T api python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/v1/system/health', timeout=3)" 2>/dev/null; then
    echo "api healthy after ${i}s"
    break
  fi
  sleep 5
done

$COMPOSE exec -T api alembic upgrade head 2>&1 | tail -3 || true

echo "== verify"
$COMPOSE exec -T api sh -c 'curl -sf http://127.0.0.1:8000/v1/system/fees'; echo ""
$COMPOSE exec -T api sh -c 'curl -sf -o /dev/null -w "treasury %{http_code}\n" http://127.0.0.1:8000/v1/treasury/status' || echo "treasury fail"
$COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"'; echo ""
$COMPOSE ps api acp-node frontend
