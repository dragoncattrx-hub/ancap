#!/usr/bin/env bash
# Read-only preflight for wACP V3 deployment (no signing).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "== reserve health"
python scripts/check_wacp_reserve_before_mint.py

echo "== mint envelope"
python scripts/wacp/compute_mint_envelope.py

echo "== on-chain token decimals"
python scripts/wacp/v3_onchain_read.py ${WACP_V3_POOL:+--pool "$WACP_V3_POOL"}

if [[ -n "${V3_CALC_ARGS:-}" ]]; then
  echo "== deploy calculator"
  # shellcheck disable=SC2086
  python scripts/wacp/v3_deploy_calculator.py $V3_CALC_ARGS
fi

echo "PASS: preflight complete (human must still sign on-chain txs)"
