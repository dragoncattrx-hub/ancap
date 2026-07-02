#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
GENESIS_DIR="Sicret/genesis-v2"
mkdir -p "$GENESIS_DIR"

if [ ! -f "$GENESIS_DIR/user-allocs.json" ]; then
  bash /tmp/export-user-allocs.sh "$GENESIS_DIR/user-allocs.json"
fi
echo "user allocs:"
cat "$GENESIS_DIR/user-allocs.json"

echo "== wipe chain data"
$COMPOSE stop acp-node || true
find Sicret/acp -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
echo "wiped Sicret/acp"

echo "== start acp-node"
$COMPOSE up -d acp-node
sleep 8
for i in $(seq 1 15); do
  H=$($COMPOSE exec -T api sh -c 'curl -sf -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"' 2>/dev/null | grep -o '"result":[0-9]*' | cut -d: -f2 || echo "")
  if [ "$H" = "0" ]; then echo "RPC ready height=0"; break; fi
  echo "wait RPC ($i) height=$H"
  sleep 3
done

NODE=$($COMPOSE ps -q acp-node)
echo "node=$NODE"
docker cp /tmp/build_and_submit_genesis_v2.rs "$NODE:/build/acp-wallet/examples/build_and_submit_genesis_v2.rs"
docker cp "$GENESIS_DIR/user-allocs.json" "$NODE:/build/user-allocs.json"

echo "== build (may take several minutes)"
$COMPOSE exec -T acp-node sh -c 'cd /build && cargo build --release -p acp-wallet --example build_and_submit_genesis_v2' 2>&1 | tail -25

echo "== submit genesis v2"
$COMPOSE exec -T acp-node sh -c '
  cd /build && \
  ACP_RPC_URL=http://127.0.0.1:8545/rpc \
  ACP_GENESIS_OUT_DIR=/var/lib/acp-node/genesis-v2 \
  ACP_USER_ALLOCS_FILE=/build/user-allocs.json \
  ./target/release/examples/build_and_submit_genesis_v2
'

echo "== copy keystores to Sicret"
$COMPOSE exec -T acp-node sh -c 'tar czf - -C /var/lib/acp-node genesis-v2' | tar xzf - -C Sicret/
ls -la "$GENESIS_DIR/"

RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
echo "== chain tip"
$COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"'; echo ""

TREASURY=$(python3 -c "import json; print(json.load(open('$GENESIS_DIR/genesis-manifest.json'))['address'])" 2>/dev/null || echo "")
echo "treasury=$TREASURY"
if [ -n "$TREASURY" ]; then
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$TREASURY" 2>&1 | tail -1
  KS=$(cat "$GENESIS_DIR/genesis-treasury.keystore.json")
  echo "== spend test 1 ACP"
  $COMPOSE exec -T api walletd transfer --rpc "$RPC" --keystore-json "$KS" --to acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 --amount-acp 1 2>&1 | tail -1
fi
for a in acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9 acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz; do
  echo "== $a"
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$a" 2>&1 | tail -1
done
echo DONE
