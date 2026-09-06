#!/usr/bin/env bash
# Recover user forward bridge deposit: patch live API, bind txid, mint wACP.
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
TXID="86468f2ab46ed4d681bb15bad67760c1e1d8537c32b12d47afcc8f2c9227f44c"
AMOUNT="50000000000000"

echo "===== copy hotfixed bridge modules into api container"
for f in \
  app/services/bridge_orchestrator.py \
  app/services/bridge_acp_watcher.py \
  app/api/routers/bridge_rail.py \
  app/api/routers/acp_explorer.py \
  app/schemas/bridge_rail.py
do
  test -f "$f"
  cid=$($COMPOSE ps -q api)
  docker cp "$f" "${cid}:/app/$f"
done

echo "===== restart api"
$COMPOSE restart api
sleep 8

echo "===== oldest pending 500k intent"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n')
PGDB=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_DB"' | tr -d '\r\n')
OP_ID=$($COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -c \
  "select id from bridge_operations where direction='acp_to_bsc' and status='PENDING_DEPOSIT' and amount_acp_smallest=${AMOUNT} and acp_tx_hash is null order by created_at asc limit 1;" | tr -d '\r\n')
echo "operation_id=${OP_ID}"
test -n "$OP_ID"

echo "===== bind deposit + jobs tick"
$COMPOSE exec -T api python - <<PY
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation
from app.services.bridge_acp_watcher import reserve_deposit_units_for_tx
from app.services.bridge_orchestrator import append_transition
from app.jobs.bridge_rail_tick import bridge_rail_tick

TXID = "${TXID}"
OP_ID = "${OP_ID}"
settings = get_settings()

async def main():
    deposit = await reserve_deposit_units_for_tx(settings.acp_rpc_url, settings.bridge_reserve_acp_address, TXID)
    print("deposit", deposit)
    if int(deposit["received_units"]) != int("${AMOUNT}"):
        raise SystemExit(f"amount mismatch: {deposit['received_units']} != ${AMOUNT}")
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    async with Session() as session:
        op = (await session.execute(select(BridgeOperation).where(BridgeOperation.id == OP_ID))).scalars().one()
        op.acp_tx_hash = TXID
        op.acp_out_index = 0
        session.add(BridgeAuditEvent(operation_id=op.id, event_type="admin_forward_bind_deposit", payload_json={"acp_tx_hash": TXID, "manual": True}))
        await append_transition(session, op, "CONFIRMED_ON_ACP", metadata={"manual": True, "txid": TXID})
        await session.commit()
    async with Session() as session:
        tick = await bridge_rail_tick(session)
        await session.commit()
        print("tick", tick)

asyncio.run(main())
PY

echo "===== result"
$COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A -F'|' -c \
  "select id, status, acp_tx_hash, bsc_tx_hash_mint from bridge_operations where id='${OP_ID}';"
