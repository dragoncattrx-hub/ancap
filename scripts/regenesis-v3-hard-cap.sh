#!/usr/bin/env bash
set -euo pipefail

# Controlled recovery from the unaudited v2 chain. The old RocksDB is moved,
# never deleted. The replacement genesis has exactly the canonical four
# allocations totalling 210M ACP; operational wallets are funded from Public &
# Liquidity by ordinary signed transactions.

cd /opt/ancap-migration/current
COMPOSE=(docker compose -f docker-compose.prod.yml)
TS="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="Sicret/backups/${TS}-regenesis-v3"
KEY_DIR="Sicret"
MIGRATION_FILE="${ACP_REGENESIS_MIGRATION_FILE:-docs/audits/ACP_REGENESIS_V3_MIGRATION_2026-10-02.json}"
HOT_ACP="${ACP_REGENESIS_HOT_ACP:-1000000}"
PROJECT_ACP="${ACP_REGENESIS_PROJECT_ACP:-1000000}"
BRIDGE_PUBLIC_ACP="${ACP_REGENESIS_BRIDGE_PUBLIC_ACP:-25000000}"
BRIDGE_ECOSYSTEM_ACP="${ACP_REGENESIS_BRIDGE_ECOSYSTEM_ACP:-1001000}"
BRIDGE_BUFFER_ACP="${ACP_REGENESIS_BRIDGE_BUFFER_ACP:-999}"
HOT_ADDRESS="acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
PROJECT_ADDRESS="acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902"
BRIDGE_ADDRESS="acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz"

for file in \
  ACP-crypto/genesis-addresses.json \
  ACP-crypto/genesis-keystore-manifest.json \
  "$KEY_DIR/creator.keystore.json" \
  "$KEY_DIR/validator-reserve.keystore.json" \
  "$KEY_DIR/public-liquidity.keystore.json" \
  "$KEY_DIR/ecosystem-grants.keystore.json"; do
  test -s "$file" || { echo "required regenesis file missing: $file" >&2; exit 1; }
done

test -s "$MIGRATION_FILE" || { echo "migration file missing: $MIGRATION_FILE" >&2; exit 1; }
python3 - \
  "$MIGRATION_FILE" "$HOT_ACP" "$PROJECT_ACP" \
  "$BRIDGE_PUBLIC_ACP" "$BRIDGE_ECOSYSTEM_ACP" <<'PY'
import json
import re
import sys
from decimal import Decimal, InvalidOperation

path, hot_raw, project_raw, bridge_public_raw, bridge_ecosystem_raw = sys.argv[1:]
quantum = Decimal("0.00000001")
fee = Decimal("0.000001")

def amount(raw: object, label: str) -> Decimal:
    try:
        value = Decimal(str(raw))
    except (InvalidOperation, ValueError) as exc:
        raise SystemExit(f"{label} is not a decimal ACP amount") from exc
    if not value.is_finite() or value <= 0 or value != value.quantize(quantum):
        raise SystemExit(f"{label} must be positive with at most 8 decimals")
    return value

with open(path, encoding="utf-8") as handle:
    rows = json.load(handle)
if not isinstance(rows, list):
    raise SystemExit("migration manifest must be a JSON array")

seen = set()
reserved = {
    "acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl",
    "acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um",
    "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm",
    "acp1qq9t4lf4z7lprt7a6nr682cl02f5tcyh45stakdf",
    "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9",
    "acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902",
    "acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz",
}
migration_total = Decimal(0)
for index, row in enumerate(rows):
    if not isinstance(row, dict):
        raise SystemExit(f"migration row {index} must be an object")
    address = str(row.get("address") or "").strip()
    if not re.fullmatch(r"acp1[0-9a-z]{20,90}", address):
        raise SystemExit(f"migration row {index} has an invalid ACP address shape")
    if address in seen:
        raise SystemExit(f"duplicate migration address: {address}")
    if address in reserved:
        raise SystemExit(f"migration address is an operator/genesis role: {address}")
    seen.add(address)
    migration_total += amount(row.get("acp"), f"migration row {index} amount")

hot = amount(hot_raw, "hot allocation")
project = amount(project_raw, "project allocation")
bridge_public = amount(bridge_public_raw, "bridge Public allocation")
bridge_ecosystem = amount(bridge_ecosystem_raw, "bridge Ecosystem allocation")
public_spend = bridge_public + migration_total + fee * (1 + len(rows))
ecosystem_spend = bridge_ecosystem + hot + project + fee * 3
if public_spend > Decimal("25200000"):
    raise SystemExit(f"Public allocation overspent: {public_spend} ACP")
if ecosystem_spend > Decimal("10500000"):
    raise SystemExit(f"Ecosystem allocation overspent: {ecosystem_spend} ACP")
print(
    f"migration preflight: {len(rows)} addresses, {migration_total} ACP; "
    f"Public spend {public_spend}; Ecosystem spend {ecosystem_spend}"
)
PY

mkdir -p "$BACKUP_DIR"
if test -f /tmp/acp-supply-audit.json; then
  cp /tmp/acp-supply-audit.json "$BACKUP_DIR/pre-regenesis-supply-audit.json"
fi
cp "$MIGRATION_FILE" "$BACKUP_DIR/migration-allocations.json"

echo "== Size bridge reserve from live BSC wACP totalSupply"
BSC_RPC="$("${COMPOSE[@]}" exec -T api printenv BRIDGE_BSC_RPC_URL | tr -d '\r')"
WACP_CONTRACT="$("${COMPOSE[@]}" exec -T api printenv BRIDGE_WACP_CONTRACT | tr -d '\r')"
test -n "$BSC_RPC" || { echo "BRIDGE_BSC_RPC_URL is not configured" >&2; exit 1; }
test -n "$WACP_CONTRACT" || { echo "BRIDGE_WACP_CONTRACT is not configured" >&2; exit 1; }
BRIDGE_SPLIT="$(
  BSC_RPC="$BSC_RPC" WACP_CONTRACT="$WACP_CONTRACT" \
  PUBLIC_HINT="$BRIDGE_PUBLIC_ACP" ECOSYSTEM_HINT="$BRIDGE_ECOSYSTEM_ACP" \
  FEE_BUFFER="$BRIDGE_BUFFER_ACP" \
  python3 scripts/regenesis_v3_bridge_split.py
)"
BRIDGE_PUBLIC_ACP="$(printf '%s\n' "$BRIDGE_SPLIT" | sed -n '1p')"
BRIDGE_ECOSYSTEM_ACP="$(printf '%s\n' "$BRIDGE_SPLIT" | sed -n '2p')"
test -n "$BRIDGE_PUBLIC_ACP" && test -n "$BRIDGE_ECOSYSTEM_ACP"
echo "bridge split Public=${BRIDGE_PUBLIC_ACP} Ecosystem=${BRIDGE_ECOSYSTEM_ACP}"

echo "== Build strict node/API images before stopping the old chain"
if test "${SKIP_IMAGE_BUILD:-0}" = "1"; then
  echo "skip-build (SKIP_IMAGE_BUILD=1)"
else
  "${COMPOSE[@]}" build acp-node api
fi

echo "== Stop and archive the corrupt v2 chain"
"${COMPOSE[@]}" stop acp-node
if test -d Sicret/acp; then
  mv Sicret/acp "$BACKUP_DIR/acp-corrupt-v2"
fi
mkdir -p Sicret/acp

echo "== Start strict node with an empty data directory"
"${COMPOSE[@]}" up -d acp-node
for _ in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T api python -c '
import json, os, urllib.request
body=json.dumps({"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}).encode()
req=urllib.request.Request(os.environ["ACP_RPC_URL"], body, {"content-type":"application/json"})
assert json.load(urllib.request.urlopen(req, timeout=3))["result"] == 0
' >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

NODE="$("${COMPOSE[@]}" ps -q acp-node)"
test -n "$NODE" || { echo "acp-node container unavailable" >&2; exit 1; }
docker cp ACP-crypto/genesis-addresses.json "$NODE:/build/genesis-addresses.json"
docker cp ACP-crypto/genesis-keystore-manifest.json "$NODE:/build/genesis-keystore-manifest.json"
docker exec "$NODE" mkdir -p /tmp/genesis-keys
for file in creator.keystore.json validator-reserve.keystore.json public-liquidity.keystore.json ecosystem-grants.keystore.json; do
  docker cp "$KEY_DIR/$file" "$NODE:/tmp/genesis-keys/$file"
done

echo "== Build and submit canonical 210M genesis"
"${COMPOSE[@]}" exec -T acp-node sh -lc '
  cd /build
  ACP_RPC_URL=http://127.0.0.1:8545/rpc \
    ACP_GENESIS_KEYSTORE_MANIFEST=/build/genesis-keystore-manifest.json \
    ACP_GENESIS_KEYSTORE_DIR=/tmp/genesis-keys \
    /opt/acp/bin/build-and-submit-genesis
'

echo "== Start API with the matching wallet binary and clear stale UTXO cache"
"${COMPOSE[@]}" up -d api
"${COMPOSE[@]}" exec -T redis sh -lc \
  'redis-cli --scan --pattern "acp:utxo_idx:*" | xargs -r redis-cli del >/dev/null'

RPC_URL='http://acp-node:8545/rpc'
PUBLIC_KEYSTORE_FILE='/run/secrets/public-liquidity.keystore.json'
ECOSYSTEM_KEYSTORE_FILE='/run/secrets/ecosystem-grants.keystore.json'

chain_height() {
  "${COMPOSE[@]}" exec -T api python -c '
import json, os, urllib.request
body=json.dumps({"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}).encode()
req=urllib.request.Request(os.environ["ACP_RPC_URL"], body, {"content-type":"application/json","x-acp-rpc-token":os.environ.get("ACP_RPC_TOKEN","")})
print(json.load(urllib.request.urlopen(req, timeout=10))["result"])
'
}

transfer_from_bucket() {
  local bucket="$1"
  local keystore_file="$2"
  local address="$3"
  local amount="$4"
  local before
  before="$(chain_height)"
  echo "fund $address with $amount ACP from $bucket (height $before)"
  local result
  result="$("${COMPOSE[@]}" exec -T api walletd transfer \
    --rpc "$RPC_URL" \
    --keystore-file "$keystore_file" \
    --to "$address" \
    --amount-acp "$amount")"
  echo "$result"
  echo "$result" | python3 -c 'import json,sys
p=json.load(sys.stdin)
ok = p.get("accepted") is True or (
    isinstance(p.get("result"), dict) and p["result"].get("accepted") is True
)
assert ok' || {
    echo "funding transaction rejected" >&2
    exit 1
  }
  for _ in $(seq 1 30); do
    if test "$(chain_height)" -gt "$before"; then
      return 0
    fi
    sleep 2
  done
  echo "funding transaction was not mined" >&2
  exit 1
}

echo "== Fund operational wallets from canonical genesis buckets (not new issuance)"
# Live wACP supply is 26,000,001 ACP at recovery time. Fund that liability
# plus the 999 ACP reverse-payout fee buffer across Public and Ecosystem.
transfer_from_bucket "Public & Liquidity" "$PUBLIC_KEYSTORE_FILE" "$BRIDGE_ADDRESS" "$BRIDGE_PUBLIC_ACP"
transfer_from_bucket "Ecosystem" "$ECOSYSTEM_KEYSTORE_FILE" "$BRIDGE_ADDRESS" "$BRIDGE_ECOSYSTEM_ACP"
transfer_from_bucket "Ecosystem" "$ECOSYSTEM_KEYSTORE_FILE" "$HOT_ADDRESS" "$HOT_ACP"
transfer_from_bucket "Ecosystem" "$ECOSYSTEM_KEYSTORE_FILE" "$PROJECT_ADDRESS" "$PROJECT_ACP"

if test -n "$MIGRATION_FILE"; then
  while IFS=$'\t' read -r address amount; do
    test -n "$address" || continue
    transfer_from_bucket "Public & Liquidity" "$PUBLIC_KEYSTORE_FILE" "$address" "$amount"
  done < <(python3 - "$MIGRATION_FILE" <<'PY'
import json, sys
for row in json.load(open(sys.argv[1], encoding="utf-8")):
    print(f"{row['address']}\t{row['acp']}")
PY
  )
fi

echo "== Verify the hard cap"
"${COMPOSE[@]}" exec -T api python - <<'PY'
import json, os, urllib.request
body=json.dumps({"jsonrpc":"2.0","id":1,"method":"gettxoutsetinfo","params":[]}).encode()
req=urllib.request.Request(os.environ["ACP_RPC_URL"], body, {"content-type":"application/json"})
result=json.load(urllib.request.urlopen(req, timeout=10))["result"]
print(json.dumps(result, indent=2))
assert result["initialized"] is True
assert result["supply_invariant_ok"] is True
assert result["max_supply_units"] == "21000000000000000"
assert result["issued_supply_units"] == result["max_supply_units"]
assert int(result["utxo_supply_units"]) <= int(result["issued_supply_units"])
PY

echo "regenesis v3 complete; archived v2 chain: $BACKUP_DIR/acp-corrupt-v2"
