#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
API() { $COMPOSE exec -T api sh -c "curl -s -m 20 http://127.0.0.1:8000$1"; }

echo "===== /health/full"
API "/v1/system/health/full"; echo ""
echo "===== /v1/system/fees"
API "/v1/system/fees"; echo ""
echo "===== /v1/treasury/status"
API "/v1/treasury/status"; echo ""
echo "===== ledger invariant status"
API "/v1/system/ledger-invariant-status"; echo ""

echo "===== on-chain balance for a real user wallet (first 3)"
PGUSER=$($COMPOSE exec -T postgres sh -c 'echo "$POSTGRES_USER"' | tr -d '\r\n'); PGUSER=${PGUSER:-postgres}
ADDRS=$($COMPOSE exec -T postgres psql -U "$PGUSER" -d ancap -t -A -c "select address from user_acp_wallets limit 3;" | tr -d '\r')
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
for a in $ADDRS; do
  echo "--- $a"
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$a" 2>&1 | tail -1
done

echo "===== reward/emission related settings in api env"
$COMPOSE exec -T api sh -c 'env | grep -i -e reward -e emission -e staking -e referral -e miner | sort'

echo "===== acp-node miner env"
$COMPOSE exec -T acp-node sh -c 'env | grep -i -e miner -e reward | sort'
