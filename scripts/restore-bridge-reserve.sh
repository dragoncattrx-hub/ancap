#!/usr/bin/env bash
# Restore bridge reserve backing after an operator sweep.
# Requires custodial hot wallet keystore (PQC KeystoreV3) — mnemonic alone is NOT enough.
set -euo pipefail

cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
RPC="http://acp-node:8545/rpc"
BRIDGE_RESERVE="acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz"
CUSTODIAL_HOT="acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
TARGET_ACP="${1:-800999.999999}"
HOT_KS="${CUSTODIAL_HOT_KEYSTORE_FILE:-/run/secrets/custodial-hot.keystore.json}"

echo "=== Bridge reserve restore preflight ==="
echo "Target amount: ${TARGET_ACP} ACP -> ${BRIDGE_RESERVE}"
echo "Source keystore: ${HOT_KS}"

if [[ ! -f "${HOT_KS}" ]]; then
  echo "ERROR: custodial hot keystore missing at ${HOT_KS}" >&2
  echo "Upload KeystoreV3 for ${CUSTODIAL_HOT} to that path, then re-run." >&2
  echo "Mnemonic from activity-wallets-seeds.txt does NOT derive this address." >&2
  exit 1
fi

derived="$($COMPOSE exec -T api walletd address --keystore-file "${HOT_KS}" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["address"])')"
if [[ "${derived}" != "${CUSTODIAL_HOT}" ]]; then
  echo "ERROR: keystore derives ${derived}, expected ${CUSTODIAL_HOT}" >&2
  exit 1
fi

proof="$(curl -fsS -H 'User-Agent: ancap-backend/1.0' https://ancap.cloud/api/v1/bridge/wacp/reserve-proof)"
echo "Reserve proof before: ${proof}"

hot_bal="$($COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$CUSTODIAL_HOT")"
bridge_bal="$($COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$BRIDGE_RESERVE")"
echo "Hot before: ${hot_bal}"
echo "Bridge before: ${bridge_bal}"

# walletd needs amount + MIN_FEE (0.00000100 ACP) covered by inputs
transfer_acp="${TARGET_ACP}"
echo "=== Transfer ${transfer_acp} ACP hot -> bridge reserve ==="
$COMPOSE exec -T api walletd transfer \
  --rpc "$RPC" \
  --keystore-file "${HOT_KS}" \
  --to "$BRIDGE_RESERVE" \
  --amount-acp "${transfer_acp}"

echo "Sleep 30s for miner confirmation..."
sleep 30

echo "Hot after:"
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$CUSTODIAL_HOT"
echo "Bridge after:"
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$BRIDGE_RESERVE"
echo "Reserve proof after:"
curl -fsS -H 'User-Agent: ancap-backend/1.0' https://ancap.cloud/api/v1/bridge/wacp/reserve-proof
echo
