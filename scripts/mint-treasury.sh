#!/usr/bin/env bash
set -euo pipefail
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
NODE=$($COMPOSE ps -q acp-node)
TREASURY="acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902"
AMOUNT_ACP="${AMOUNT_ACP:-1000000}"

echo "== copy example into container"
$COMPOSE exec -T acp-node mkdir -p /build/acp-crypto/examples
docker cp /tmp/mint_emission_block.rs "$NODE:/build/acp-crypto/examples/mint_emission_block.rs"

echo "== build example (release)"
$COMPOSE exec -T acp-node sh -c 'cd /build/acp-crypto && cargo build --release --example mint_emission_block 2>&1 | tail -5'

echo "== chain tip"
BEST=$($COMPOSE exec -T acp-node sh -c 'curl -s -X POST http://127.0.0.1:8545/rpc -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getblockcount\",\"params\":{}}"' | sed -E 's/.*"result":([0-9]+).*/\1/')
PREV=$($COMPOSE exec -T acp-node sh -c 'curl -s -X POST http://127.0.0.1:8545/rpc -H "content-type: application/json" -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getbestblockhash\",\"params\":{}}"' | sed -E 's/.*"result":"([0-9a-fA-F]+)".*/\1/')
HEIGHT=$((BEST + 1))
echo "best=$BEST prev=$PREV newHeight=$HEIGHT"

echo "== generate block hex (mint $AMOUNT_ACP ACP -> $TREASURY)"
BLOCK_HEX=$($COMPOSE exec -T \
  -e MINT_TREASURY_ADDR="$TREASURY" \
  -e MINT_AMOUNT_ACP="$AMOUNT_ACP" \
  -e MINT_HEIGHT="$HEIGHT" \
  -e MINT_PREV_HASH="$PREV" \
  -e MINT_CHAIN_ID="1001" \
  acp-node sh -c 'cd /build/acp-crypto && ./target/release/examples/mint_emission_block' | tr -d '\r\n')
echo "block hex length: ${#BLOCK_HEX}"

echo "== submit block"
printf '{"jsonrpc":"2.0","id":1,"method":"submitblock","params":{"block":"%s"}}' "$BLOCK_HEX" > /tmp/submit.json
docker cp /tmp/submit.json "$NODE:/tmp/submit.json"
$COMPOSE exec -T acp-node sh -c 'curl -s -X POST http://127.0.0.1:8545/rpc -H "content-type: application/json" --data @/tmp/submit.json'
echo ""

echo "== verify treasury balance"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
$COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$TREASURY" 2>&1 | tail -1
