#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
cid=$($COMPOSE ps -q api)
docker cp app/services/bridge_orchestrator.py "${cid}:/app/app/services/bridge_orchestrator.py"
bash scripts/raise-gateway-caps-and-tick.sh
