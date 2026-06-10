#!/usr/bin/env bash
# R3 nightly backup: Postgres dump + ACP chain data archive.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_ROOT="${ANCAP_BACKUP_DIR:-/var/backups/ancap}"
mkdir -p "$BACKUP_ROOT/$STAMP"

if [[ -f docker-compose.prod.yml ]]; then
  docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "${POSTGRES_USER:-ancap}" "${POSTGRES_DB:-ancap}" \
    | gzip -9 > "$BACKUP_ROOT/$STAMP/postgres.sql.gz"
fi

if [[ -d "${ANCAP_CHAIN_DATA_DIR:-/var/lib/ancap/acp-chain}" ]]; then
  tar -czf "$BACKUP_ROOT/$STAMP/acp-chain.tar.gz" -C "$(dirname "${ANCAP_CHAIN_DATA_DIR:-/var/lib/ancap/acp-chain}")" "$(basename "${ANCAP_CHAIN_DATA_DIR:-/var/lib/ancap/acp-chain}")"
fi

if [[ -n "${ANCAP_BACKUP_RSYNC_TARGET:-}" ]]; then
  rsync -az "$BACKUP_ROOT/$STAMP/" "${ANCAP_BACKUP_RSYNC_TARGET%/}/$STAMP/"
fi

find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +

echo "Backup complete: $BACKUP_ROOT/$STAMP"
