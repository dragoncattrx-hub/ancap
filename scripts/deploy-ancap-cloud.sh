#!/usr/bin/env bash
# Full stack refresh for ancap.cloud: rebuild Docker prod stack + Alembic.
# Run on the Linux host behind Cloudflare Tunnel from the ANCAP repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE="$ROOT/docker-compose.prod.yml"
DOTENV="$ROOT/.env"
test -f "$COMPOSE" || { echo "Missing $COMPOSE"; exit 1; }

if [[ -f "$DOTENV" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$DOTENV"
  set +a
  echo "Loaded compose substitution secrets from: $DOTENV"
fi

REQUIRED_PROD_SECRETS=(DATABASE_URL POSTGRES_PASSWORD SECRET_KEY CURSOR_SECRET CRON_SECRET)
MISSING=()
for name in "${REQUIRED_PROD_SECRETS[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    MISSING+=("$name")
  fi
done
if (( ${#MISSING[@]} > 0 )); then
  echo "Missing required production secrets for docker-compose.prod.yml: ${MISSING[*]}. Set them in $DOTENV or export them in the shell before running this deploy script." >&2
  exit 1
fi

UNSAFE_SECRET_PHRASES=(change dev-secret change-me changeme secret example placeholder)
for secret_name in SECRET_KEY CURSOR_SECRET CRON_SECRET; do
  secret_value="${!secret_name:-}"
  if [[ -z "$secret_value" ]]; then
    continue
  fi

  normalized_secret_value="${secret_value,,}"
  for phrase in "${UNSAFE_SECRET_PHRASES[@]}"; do
    if [[ "$normalized_secret_value" == *"$phrase"* ]]; then
      echo "$secret_name still uses an insecure placeholder-like value. Set a real random secret before running this deploy script." >&2
      exit 1
    fi
  done
done

if [[ "${DATABASE_URL,,}" == *"://postgres:postgres@"* ]]; then
  echo "DATABASE_URL still uses the insecure postgres:postgres default. Set a real database password before running this deploy script." >&2
  exit 1
fi

POSTGRES_PASSWORD_NORMALIZED="${POSTGRES_PASSWORD,,}"
if [[ "$POSTGRES_PASSWORD_NORMALIZED" == "postgres" || "$POSTGRES_PASSWORD_NORMALIZED" == *"change-me"* || "$POSTGRES_PASSWORD_NORMALIZED" == *"placeholder"* || "$POSTGRES_PASSWORD_NORMALIZED" == *"example"* ]]; then
  echo "POSTGRES_PASSWORD is still using an insecure default or placeholder. Set a real non-default password before running this deploy script." >&2
  exit 1
fi

BRIDGE_ENV="$ROOT/Sicret/bridge-bsc/bridge.env"
if [[ -f "$BRIDGE_ENV" ]]; then
  echo "Bridge runtime secrets remain sourced by docker-compose.prod.yml via service env_file: $BRIDGE_ENV"
fi

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

export APP_BUILD_ID
APP_BUILD_ID="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "APP_BUILD_ID=$APP_BUILD_ID (must match https://ancap.cloud/internal/frontend-build after deploy)"

docker compose -f "$COMPOSE" build --no-cache
docker compose -f "$COMPOSE" up -d

if [[ "$SKIP_MIG" -eq 0 ]]; then
  docker compose -f "$COMPOSE" exec -T api alembic upgrade head
fi

echo "Done. Open https://ancap.cloud/bridge/acp-bsc — if still 404, purge Cloudflare cache."
