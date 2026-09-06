#!/usr/bin/env bash
set -u
cd /opt/ancap-migration/current
COMPOSE="docker compose -f docker-compose.prod.yml"
RPC=$($COMPOSE exec -T api sh -c 'echo "$ACP_RPC_URL"' | tr -d '\r\n')
bal() { $COMPOSE exec -T api walletd balance --rpc "$RPC" --address "$1" 2>&1 | tail -1; }

echo "===== ON-CHAIN (live)"
printf "%-18s %-48s %s\n" "ROLE" "ADDRESS" "BALANCE_ACP"
printf "%-18s %-48s %s\n" "genesis_treasury" "acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl" "$(bal acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl)"
printf "%-18s %-48s %s\n" "hot_wallet" "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9" "$(bal acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9)"
printf "%-18s %-48s %s\n" "project_treasury" "acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902" "$(bal acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902)"
printf "%-18s %-48s %s\n" "bridge_reserve" "acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz" "$(bal acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz)"
printf "%-18s %-48s %s\n" "user_genesis" "acp1qz06ucs5zemu8mrdftp5gg8ckmevks0wqvhek4wa" "$(bal acp1qz06ucs5zemu8mrdftp5gg8ckmevks0wqvhek4wa)"
printf "%-18s %-48s %s\n" "user_genesis" "acp1qrtuzja28v72gera5s45h3ltxcxhvzqa2vmxhkhw" "$(bal acp1qrtuzja28v72gera5s45h3ltxcxhvzqa2vmxhkhw)"
printf "%-18s %-48s %s\n" "user_genesis" "acp1qq69wvq2f0f0gk9tmezvtxtfmu946vgcpc5dlm8x" "$(bal acp1qq69wvq2f0f0gk9tmezvtxtfmu946vgcpc5dlm8x)"
