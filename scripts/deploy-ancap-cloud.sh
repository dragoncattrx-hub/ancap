#!/usr/bin/env bash
# Full stack refresh for ancap.cloud: rebuild Docker prod stack + Alembic.
# Run on the Linux host behind Cloudflare Tunnel from the ANCAP repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE="$ROOT/docker-compose.prod.yml"
test -f "$COMPOSE" || { echo "Missing $COMPOSE"; exit 1; }

SKIP_PULL=0
SKIP_MIG=0
for a in "$@"; do
  case "$a" in
    --skip-git-pull) SKIP_PULL=1 ;;
    --skip-migrations) SKIP_MIG=1 ;;
  esac
done

if [[ "$SKIP_PULL" -eq 0 ]]; then
  git pull --ff-only
fi

docker compose -f "$COMPOSE" build --no-cache
docker compose -f "$COMPOSE" up -d

if [[ "$SKIP_MIG" -eq 0 ]]; then
  docker compose -f "$COMPOSE" exec -T api alembic upgrade head
fi

echo "Done. Open https://ancap.cloud/bridge/acp-bsc — if still 404, purge Cloudflare cache."
