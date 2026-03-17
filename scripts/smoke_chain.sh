#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:8001}"

echo "== ANCAP chain anchor smoke =="
echo "API base: ${API_BASE}"

curl -fsS "${API_BASE}/v1/system/health" >/dev/null
echo "Health OK"

anchor() {
  local driver="$1"
  local rpc_url="${2:-}"

  export CHAIN_ANCHOR_DRIVER="$driver"
  export ACP_RPC_URL=""
  export ETHEREUM_RPC_URL=""
  export SOLANA_RPC_URL=""

  if [[ "$driver" == "acp" ]]; then export ACP_RPC_URL="$rpc_url"; fi
  if [[ "$driver" == "ethereum" ]]; then export ETHEREUM_RPC_URL="$rpc_url"; fi
  if [[ "$driver" == "solana" ]]; then export SOLANA_RPC_URL="$rpc_url"; fi

  echo "Anchoring via $driver ..."
  curl -fsS -X POST "${API_BASE}/v1/chain/anchor" \
    -H "Content-Type: application/json" \
    -d "{\"chain_id\":\"${driver}\",\"payload_type\":\"smoke\",\"payload_hash\":\"$(printf 'ab%.0s' {1..32})\",\"payload_json\":{\"ts\":\"$(date -Iseconds)\"}}" \
    | python -c "import json,sys; j=json.load(sys.stdin); assert j.get('tx_hash'); print('OK:', j['tx_hash'])"
}

anchor "mock" ""

if [[ -n "${ACP_RPC_URL:-}" ]]; then anchor "acp" "${ACP_RPC_URL}"; else echo "Skip acp: ACP_RPC_URL not set"; fi
if [[ -n "${ETHEREUM_RPC_URL:-}" ]]; then anchor "ethereum" "${ETHEREUM_RPC_URL}"; else echo "Skip ethereum: ETHEREUM_RPC_URL not set"; fi
if [[ -n "${SOLANA_RPC_URL:-}" ]]; then anchor "solana" "${SOLANA_RPC_URL}"; else echo "Skip solana: SOLANA_RPC_URL not set"; fi

echo "Done."

