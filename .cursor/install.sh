#!/usr/bin/env bash
# Idempotent bootstrap for the ANCAP development environment.
# Prepares system services, backend (FastAPI) deps + DB schema, and frontend deps.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "[install] repo root: $REPO_ROOT"

# 1. System packages (PostgreSQL, Redis, build headers, venv support).
if ! command -v psql >/dev/null 2>&1 \
  || ! command -v redis-server >/dev/null 2>&1 \
  || ! command -v python3 >/dev/null 2>&1; then
  echo "[install] installing system packages"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    postgresql postgresql-contrib redis-server libpq-dev python3-venv
fi

# 2. Local throwaway dev only: passwordless trust auth for localhost connections.
# Mirrors docker-compose.yml (POSTGRES_HOST_AUTH_METHOD: trust) so no password
# literal is ever committed. Never use this for anything beyond local dev.
PG_HBA="/etc/postgresql/16/main/pg_hba.conf"
if [ -f "$PG_HBA" ]; then
  sudo sed -i -E 's#^(host[[:space:]]+all[[:space:]]+all[[:space:]]+127\.0\.0\.1/32[[:space:]]+)[[:alnum:]-]+#\1trust#' "$PG_HBA"
  sudo sed -i -E 's#^(host[[:space:]]+all[[:space:]]+all[[:space:]]+::1/128[[:space:]]+)[[:alnum:]-]+#\1trust#' "$PG_HBA"
fi

# 3. Bring PostgreSQL + Redis up so we can apply migrations during install.
sudo pg_ctlcluster 16 main start 2>/dev/null || true
sudo pg_ctlcluster 16 main reload 2>/dev/null || true
sudo redis-server --daemonize yes 2>/dev/null || true

echo "[install] waiting for PostgreSQL"
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q 2>/dev/null; then break; fi
  sleep 1
done

# 4. Database (idempotent). No password is set: localhost uses trust auth above.
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='ancap'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ancap OWNER postgres;" >/dev/null
fi

# 5. Local development .env (never committed). Secrets are generated at runtime so
# no secret-like literal is stored in this committed script.
if [ ! -f .env ]; then
  echo "[install] writing dev .env"
  gen_secret() { python3 -c 'import secrets; print(secrets.token_urlsafe(48))'; }
  DEV_SECRET_KEY="$(gen_secret)"
  DEV_CURSOR_SECRET="$(gen_secret)"
  DEV_WALLET_KEY="$(gen_secret)"
  cat > .env <<ENV
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://postgres@localhost:5432/ancap
POSTGRES_USER=postgres
POSTGRES_DB=ancap
POSTGRES_PASSWORD=
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=${DEV_SECRET_KEY}
CURSOR_SECRET=${DEV_CURSOR_SECRET}
ACP_WALLET_RECOVERY_MASTER_KEY=${DEV_WALLET_KEY}
CHAIN_ANCHOR_DRIVER=mock
DEBUG=true
ENV
fi

# 6. Python backend dependencies.
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
. .venv/bin/activate
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q

# 7. Apply database migrations (schema is owned by Alembic; app never creates tables).
export PYTHONPATH="$REPO_ROOT"
alembic upgrade head

# 8. Frontend dependencies.
cd "$REPO_ROOT/frontend-app"
npm ci

echo "[install] done"
