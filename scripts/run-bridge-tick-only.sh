#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
OP_ID="34a32432-bc7f-4177-9fca-c63d220833b4"
$COMPOSE exec -T api python - <<'PY'
import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.config import get_settings
from app.jobs.bridge_rail_tick import bridge_rail_tick

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        result = await bridge_rail_tick(session)
        await session.commit()
        print(result)

asyncio.run(main())
PY
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c \
  "select id, status, acp_tx_hash, bsc_tx_hash_mint from bridge_operations where id='${OP_ID}';"
