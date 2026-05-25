#!/usr/bin/env bash
# Full stack refresh for ancap.cloud: rebuild Docker prod stack + Alembic.
# Run on the Linux host behind Cloudflare Tunnel from the ANCAP repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE="$ROOT/docker-compose.prod.yml"
DOTENV="$ROOT/.env"
test -f "$COMPOSE" || { echo "Missing $COMPOSE"; exit 1; }

import_dotenv_if_present() {
  local dotenv_path="$1"
  if [[ ! -f "$dotenv_path" ]]; then
    return 0
  fi

  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    local line="${raw_line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    if [[ ! "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]]; then
      continue
    fi

    local name="${BASH_REMATCH[1]}"
    local value="${BASH_REMATCH[2]}"

    value="${value%$'\r'}"
    if [[ ${#value} -ge 2 ]]; then
      local first_char="${value:0:1}"
      local last_char="${value: -1}"
      if [[ "$first_char" == '"' && "$last_char" == '"' ]]; then
        value="${value:1:${#value}-2}"
      elif [[ "$first_char" == "'" && "$last_char" == "'" ]]; then
        value="${value:1:${#value}-2}"
      fi
    fi

    if [[ -z "${!name:-}" ]]; then
      export "$name=$value"
    fi
  done < "$dotenv_path"

  echo "Loaded compose substitution secrets from: $dotenv_path"
}

import_dotenv_if_present "$DOTENV"

placeholder_like_secret() {
  local value="${1:-}"
  if [[ -z "$value" ]]; then
    return 1
  fi

  local normalized_value="${value,,}"
  for phrase in change dev-secret change-me changeme secret example placeholder; do
    if [[ "$normalized_value" == *"$phrase"* ]]; then
      return 0
    fi
  done

  return 1
}

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

for secret_name in SECRET_KEY CURSOR_SECRET CRON_SECRET; do
  secret_value="${!secret_name:-}"
  if placeholder_like_secret "$secret_value"; then
    echo "$secret_name still uses an insecure placeholder-like value. Set a real random secret before running this deploy script." >&2
    exit 1
  fi
done

if [[ "${DATABASE_URL,,}" == *"://postgres:postgres@"* ]]; then
  echo "DATABASE_URL still uses the insecure postgres:postgres default. Set a real database password before running this deploy script." >&2
  exit 1
fi

DATABASE_URL_NO_SCHEME="${DATABASE_URL#*://}"
DATABASE_URL_AUTHORITY="${DATABASE_URL_NO_SCHEME%%/*}"
DATABASE_URL_CREDENTIALS=""
DATABASE_URL_HOSTPORT="$DATABASE_URL_AUTHORITY"
if [[ "$DATABASE_URL_AUTHORITY" == *"@"* ]]; then
  DATABASE_URL_CREDENTIALS="${DATABASE_URL_AUTHORITY%@*}"
  DATABASE_URL_HOSTPORT="${DATABASE_URL_AUTHORITY#*@}"
fi
DATABASE_URL_HOST="${DATABASE_URL_HOSTPORT%%[:?]*}"
DATABASE_URL_PASSWORD=""
DATABASE_URL_PASSWORD_DECODED=""
if [[ -n "$DATABASE_URL_CREDENTIALS" && "$DATABASE_URL_CREDENTIALS" == *:* ]]; then
  DATABASE_URL_PASSWORD="${DATABASE_URL_CREDENTIALS#*:}"
fi

if [[ -n "$DATABASE_URL_PASSWORD" ]]; then
  printf -v DATABASE_URL_PASSWORD_DECODED '%b' "${DATABASE_URL_PASSWORD//%/\\x}"
  if [[ "${DATABASE_URL_PASSWORD_DECODED,,}" == "postgres" ]]; then
    echo "DATABASE_URL still uses the insecure postgres database password. Set a real database password before running this deploy script." >&2
    exit 1
  fi
  if placeholder_like_secret "$DATABASE_URL_PASSWORD_DECODED"; then
    echo "DATABASE_URL uses a placeholder-like database password. Set a real database password before running this deploy script." >&2
    exit 1
  fi
fi

if [[ "${DATABASE_URL_HOST,,}" == "postgres" && -z "$DATABASE_URL_PASSWORD" ]]; then
  echo "DATABASE_URL targets the bundled postgres service but does not include a password. Set DATABASE_URL with the real POSTGRES_PASSWORD before running this deploy script." >&2
  exit 1
fi

POSTGRES_PASSWORD_NORMALIZED="${POSTGRES_PASSWORD,,}"
if [[ "$POSTGRES_PASSWORD_NORMALIZED" == "postgres" ]] || placeholder_like_secret "$POSTGRES_PASSWORD"; then
  echo "POSTGRES_PASSWORD is still using an insecure default or placeholder. Set a real non-default password before running this deploy script." >&2
  exit 1
fi

if [[ "${DATABASE_URL_HOST,,}" == "postgres" && -n "$DATABASE_URL_PASSWORD" && "$DATABASE_URL_PASSWORD_DECODED" != "$POSTGRES_PASSWORD" ]]; then
  echo "DATABASE_URL password does not match POSTGRES_PASSWORD for the bundled postgres service. Keep them in sync before running this deploy script." >&2
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
