#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
TS=$(date -u +%Y%m%dT%H%M%SZ)
GENESIS_DIR="Sicret/genesis-v2"
mkdir -p "$GENESIS_DIR"

echo "== 1. export user allocations"
bash /tmp/export-user-allocs.sh "$GENESIS_DIR/user-allocs.json"

echo "== 2. stop acp-node and wipe chain data"
$COMPOSE stop acp-node
# data-dir is bind-mounted at ./Sicret/acp -> /var/lib/acp-node
if [ -d Sicret/acp ]; then
  find Sicret/acp -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  echo "  wiped Sicret/acp"
fi

echo "== 3. start acp-node on empty data-dir"
$COMPOSE up -d acp-node
sleep 5
for i in 1 2 3 4 5 6 7 8 9 10; do
  if $COMPOSE exec -T api sh -c 'curl -sf -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"' | grep -q '"result":0'; then
    echo "  RPC ready, height=0"
    break
  fi
  echo "  waiting for RPC... ($i)"
  sleep 3
done

NODE=$($COMPOSE ps -q acp-node)
echo "== 4. copy genesis v2 example into acp-node container"
docker cp /tmp/build_and_submit_genesis_v2.rs "$NODE:/build/acp-wallet/examples/build_and_submit_genesis_v2.rs"
docker cp "$GENESIS_DIR/user-allocs.json" "$NODE:/build/user-allocs.json"

echo "== 5. build genesis v2 example"
$COMPOSE exec -T acp-node sh -c 'cd /build && cargo build --release -p acp-wallet --example build_and_submit_genesis_v2 2>&1' | tail -20

echo "== 6. submit genesis v2"
$COMPOSE exec -T acp-node sh -c "
  cd /build && \
  ACP_RPC_URL=http://127.0.0.1:8545/rpc \
  ACP_GENESIS_OUT_DIR=/var/lib/acp-node/genesis-v2 \
  ACP_USER_ALLOCS_FILE=/build/user-allocs.json \
  ./target/release/examples/build_and_submit_genesis_v2
"

echo "== 7. copy keystores from node data-dir to Sicret"
if $COMPOSE exec -T acp-node test -d /var/lib/acp-node/genesis-v2; then
  $COMPOSE exec -T acp-node sh -c 'tar czf - -C /var/lib/acp-node genesis-v2' | tar xzf - -C Sicret/
  echo "  keystores in $GENESIS_DIR/"
  ls -la "$GENESIS_DIR/"
fi

echo "== 8. verify chain tip and key balances"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
$COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"'; echo ""

TREASURY_ADDR=$(python3 -c "import json; print(json.load(open('$GENESIS_DIR/genesis-manifest.json'))['address'])" 2>/dev/null || echo "")
if [ -n "$TREASURY_ADDR" ]; then
  echo "== genesis treasury $TREASURY_ADDR"
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$TREASURY_ADDR" 2>&1 | tail -1
  echo "== spendability test: 1 ACP -> project treasury"
  KS=$(cat "$GENESIS_DIR/genesis-treasury.keystore.json")
  TO="acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902"
  $COMPOSE exec -T api walletd transfer --rpc "$RPC" --keystore-json "$KS" --to "$TO" --amount-acp 1 2>&1 | tail -1
fi

for a in acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9 acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz; do
  echo "== $a"
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$a" 2>&1 | tail -1
done

echo "== REGENESIS V2 COMPLETE ($TS)"
