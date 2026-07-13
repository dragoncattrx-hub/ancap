#!/usr/bin/env bash
# Sweep operator keystores on production to the custodial hot wallet.
# DANGEROUS: do not sweep bridge reserve below wACP backing. See docs/ACP_WALLET_ROLES.md
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
RPC="http://acp-node:8545/rpc"
TO="acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
BRIDGE_RESERVE="acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz"

if [[ "${ALLOW_BRIDGE_RESERVE_SWEEP:-}" != "yes" ]]; then
  proof="$(curl -fsS -H 'User-Agent: ancap-backend/1.0' https://ancap.cloud/api/v1/bridge/wacp/reserve-proof || true)"
  if echo "${proof}" | grep -q '"reserve_health":"critical"'; then
    echo "REFUSED: bridge reserve is already under-backed. Set ALLOW_BRIDGE_RESERVE_SWEEP=yes to override." >&2
    echo "${proof}" >&2
    exit 1
  fi
  wacp_acp="$(echo "${proof}" | python3 -c 'import sys,json; p=json.load(sys.stdin); print(int(p.get("wacp_total_supply_acp_smallest",0))/1e8)' 2>/dev/null || echo 0)"
  if python3 -c 'import sys; sys.exit(0 if float(sys.argv[1])>0 else 1)' "${wacp_acp}" 2>/dev/null; then
    echo "WARNING: ${wacp_acp} wACP outstanding — bridge reserve must stay >= that amount." >&2
    echo "Refusing bridge sweep unless ALLOW_BRIDGE_RESERVE_SWEEP=yes" >&2
    SKIP_BRIDGE=1
  fi
fi

transfer() {
  local label="$1"
  local ks="$2"
  local amount="$3"
  echo "=== ${label}: ${amount} ACP -> ${TO} ==="
  $COMPOSE exec -T api walletd transfer \
    --rpc "$RPC" \
    --keystore-file "$ks" \
    --to "$TO" \
    --amount-acp "$amount"
  echo
}

echo "Hot balance before:"
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$TO"
echo

if [[ "${SKIP_BRIDGE:-}" != "1" ]]; then
  bridge_bal="$($COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$BRIDGE_RESERVE")"
  echo "Bridge reserve balance: ${bridge_bal}"
  transfer bridge /run/secrets/bridge-bsc/acp-reserve-keystore.json 800999.999999
else
  echo "=== SKIP bridge reserve (wACP backing guard) ==="
fi
transfer project /run/secrets/project-treasury-keystore.json 1000002.66476406
transfer genesis /run/secrets/genesis-v2/genesis-treasury.keystore.json 207643979.999998

echo "Sleep 30s for miner to confirm..."
sleep 30

echo "Hot balance after:"
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$TO"
echo "Source balances after:"
for a in acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz; do
  echo -n "$a "
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$a"
done
