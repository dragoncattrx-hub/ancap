#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
$COMPOSE exec -T api python - <<'PY'
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.config import get_settings
from app.db.models import BridgeOperation
from app.services.bridge_orchestrator import tick_orchestrator

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == '34a32432-bc7f-4177-9fca-c63d220833b4'))).scalars().one()
        print('status', op.status, 'bsc', op.user_bsc_address, 'wei', op.amount_wacp_wei, 'mint_tx', op.bsc_tx_hash_mint)
    async with Session() as session:
        result = await tick_orchestrator(session)
        print('orch', result)
        await session.commit()
    async with Session() as session:
        op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == '34a32432-bc7f-4177-9fca-c63d220833b4'))).scalars().one()
        print('after', op.status, op.bsc_tx_hash_mint)

asyncio.run(main())
PY
