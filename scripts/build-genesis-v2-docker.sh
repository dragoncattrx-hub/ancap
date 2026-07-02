#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
GENESIS_DIR="Sicret/genesis-v2"
mkdir -p "$GENESIS_DIR"
NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' $($COMPOSE ps -q acp-node))

echo "== build genesis v2 in rust container (network=$NET)"
docker run --rm \
  --network "$NET" \
  -v "$(pwd)/ACP-crypto:/workspace" \
  -v "$(pwd)/$GENESIS_DIR/user-allocs.json:/workspace/user-allocs.json:ro" \
  -v "$(pwd)/$GENESIS_DIR:/out" \
  -w /workspace \
  rust:1.86-bookworm \
  bash -lc '
    set -euo pipefail
    export PATH="/usr/local/cargo/bin:$PATH"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq cmake clang libclang-dev libsnappy-dev liblz4-dev libzstd-dev zlib1g-dev libbz2-dev pkg-config >/dev/null
    cargo build --release -p acp-wallet --example build_and_submit_genesis_v2 2>&1 | tail -15
    ACP_RPC_URL=http://acp-node:8545/rpc \
    ACP_GENESIS_OUT_DIR=/out \
    ACP_USER_ALLOCS_FILE=/workspace/user-allocs.json \
    ./target/release/examples/build_and_submit_genesis_v2
  '

echo "== keystores"
ls -la "$GENESIS_DIR/"
cat "$GENESIS_DIR/genesis-manifest.json" 2>/dev/null || true

RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
echo "== chain tip"
$COMPOSE exec -T api sh -c 'curl -s -X POST "$ACP_RPC_URL" -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"'; echo ""

TREASURY=$(python3 -c "import json; print(json.load(open('$GENESIS_DIR/genesis-manifest.json'))['address'])" 2>/dev/null || echo "")
if [ -n "$TREASURY" ]; then
  echo "treasury $TREASURY"
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$TREASURY" 2>&1 | tail -1
  KS=$(cat "$GENESIS_DIR/genesis-treasury.keystore.json")
  echo "spend test 1 ACP"
  $COMPOSE exec -T api walletd transfer --rpc "$RPC" --keystore-json "$KS" --to acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 --amount-acp 1 2>&1 | tail -1
fi
for a in acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9 acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902 acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz; do
  echo "$a"
  $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$a" 2>&1 | tail -1
done
