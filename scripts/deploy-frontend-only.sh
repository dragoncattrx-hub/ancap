#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"

for attempt in 1 2 3 4 5; do
  if timeout 120 git fetch origin master && git reset --hard origin/master; then
    break
  fi
  echo "git fetch failed (attempt ${attempt}/5)"
  sleep 10
done

export APP_BUILD_ID="$(git rev-parse --short HEAD)"
echo "APP_BUILD_ID=$APP_BUILD_ID"

echo "== build frontend"
timeout 900 $COMPOSE build frontend

echo "== restart frontend + proxy"
timeout 120 $COMPOSE up -d frontend proxy

echo "== verify homepage has MCP section"
sleep 8
html="$(timeout 30 curl -sf http://127.0.0.1/ 2>/dev/null || timeout 30 curl -sf -H 'Host: ancap.cloud' http://127.0.0.1/ || true)"
if echo "$html" | grep -q 'id="mcp"'; then
  echo "OK homepage contains #mcp"
else
  echo "WARN #mcp not found in homepage HTML yet (may need cache warm)"
fi

echo "== frontend build id"
timeout 15 curl -sf -H 'Host: ancap.cloud' http://127.0.0.1/internal/frontend-build || true
