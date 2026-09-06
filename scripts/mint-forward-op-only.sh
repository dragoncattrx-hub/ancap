#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
OP_ID="34a32432-bc7f-4177-9fca-c63d220833b4"
cid=$($COMPOSE ps -q api)
docker cp app/services/bridge_orchestrator.py "${cid}:/app/app/services/bridge_orchestrator.py"
$COMPOSE exec -T api python - <<'PY'
import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.config import get_settings
from app.services.bridge_orchestrator import tick_orchestrator
from app.services.bridge_bsc_watcher import tick_bsc_checkpoint

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        print('orch', await tick_orchestrator(session))
        await session.commit()
    async with Session() as session:
        print('bsc', await tick_bsc_checkpoint(session))
        await session.commit()

asyncio.run(main())
PY
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c \
  "select id, status, bsc_tx_hash_mint from bridge_operations where id='${OP_ID}';"
