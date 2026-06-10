#!/usr/bin/env bash
# R2 ops monitor: API health, block height stall, container restarts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
API_BASE="${ANCAP_API_BASE:-https://ancap.cloud/api/v1}"
ALERT_WEBHOOK="${ANCAP_OPS_ALERT_WEBHOOK:-}"
STATE_DIR="${ANCAP_OPS_STATE_DIR:-/tmp/ancap-ops}"
mkdir -p "$STATE_DIR"

failures=()
health_code="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}/system/health" || echo 000)"
ready_code="$(curl -s -o /dev/null -w '%{http_code}' "${API_BASE}/system/ready" || echo 000)"
[[ "$health_code" == "200" ]] || failures+=("health_http_${health_code}")
[[ "$ready_code" == "200" ]] || failures+=("ready_http_${ready_code}")

height="$(curl -s "${API_BASE}/acp/explorer/status" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("block_height", 0))' 2>/dev/null || echo 0)"
prev_file="$STATE_DIR/last_block_height"
prev_height="0"
[[ -f "$prev_file" ]] && prev_height="$(cat "$prev_file")"
echo "$height" > "$prev_file"
if [[ "$height" -gt 0 && "$prev_height" -gt 0 && "$height" -le "$prev_height" ]]; then
  failures+=("block_height_stall:${prev_height}->${height}")
fi

if command -v docker >/dev/null 2>&1 && [[ -f docker-compose.prod.yml ]]; then
  restart_count="$(docker compose -f docker-compose.prod.yml ps -q | xargs -r docker inspect --format '{{.RestartCount}}' 2>/dev/null | awk '{s+=$1} END {print s+0}')"
  prev_restart_file="$STATE_DIR/last_restart_count"
  prev_restart="0"
  [[ -f "$prev_restart_file" ]] && prev_restart="$(cat "$prev_restart_file")"
  echo "$restart_count" > "$prev_restart_file"
  if [[ "$restart_count" -gt "$prev_restart" ]]; then
    failures+=("container_restarts:${prev_restart}->${restart_count}")
  fi
fi

if ((${#failures[@]})); then
  msg="ANCAP monitor alert: ${failures[*]}"
  echo "$msg" >&2
  if [[ -n "$ALERT_WEBHOOK" ]]; then
    curl -sS -X POST -H 'Content-Type: application/json' -d "{\"text\":\"${msg}\"}" "$ALERT_WEBHOOK" >/dev/null || true
  fi
  exit 1
fi

echo "ANCAP monitor OK (health=${health_code}, ready=${ready_code}, height=${height})"
