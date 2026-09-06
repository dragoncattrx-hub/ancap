#!/usr/bin/env bash
# Per-boot startup: bring PostgreSQL and Redis online. Idempotent and returns
# once the services are ready. Application servers run as tmux terminals.
set -euo pipefail

echo "[start] starting PostgreSQL"
sudo pg_ctlcluster 16 main start 2>/dev/null || true

echo "[start] starting Redis"
sudo redis-server --daemonize yes 2>/dev/null || true

echo "[start] waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -q 2>/dev/null; then
    echo "[start] PostgreSQL ready"
    break
  fi
  sleep 1
done

if redis-cli ping >/dev/null 2>&1; then
  echo "[start] Redis ready"
fi

echo "[start] done"
