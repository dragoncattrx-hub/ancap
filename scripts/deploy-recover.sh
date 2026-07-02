#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "== load $(cut -d' ' -f1-3 /proc/loadavg)"
free -h | head -2

echo "== restart services (existing images)"
timeout 120 $COMPOSE up -d api frontend acp-node proxy || true

echo "== wait api healthy"
healthy=0
for i in $(seq 1 24); do
  if timeout 15 $COMPOSE exec -T api python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/v1/system/health', timeout=3)" 2>/dev/null; then
    echo "api healthy after ${i} attempts"
    healthy=1
    break
  fi
  sleep 5
done

if [ "$healthy" -eq 0 ]; then
  echo "== rebuild api (health check failed)"
  timeout 900 $COMPOSE build api
  timeout 120 $COMPOSE up -d api frontend acp-node proxy
fi

timeout 120 $COMPOSE exec -T api alembic upgrade head 2>&1 | tail -3 || true

echo "== verify"
timeout 15 $COMPOSE exec -T api sh -c 'curl -sf http://127.0.0.1:8000/v1/system/fees' || true
echo ""
timeout 15 $COMPOSE exec -T api sh -c 'curl -sf -o /dev/null -w "treasury %{http_code}\n" http://127.0.0.1:8000/v1/treasury/status' || echo "treasury fail"
timeout 15 $COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"' || true
echo ""
$COMPOSE ps api acp-node frontend
