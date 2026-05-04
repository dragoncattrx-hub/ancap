# wACP / BSC bridge rail — launch checklist

Use after contracts and backend are deployed. See [bridge-spec-v1.md](./bridge-spec-v1.md).

## Safe production apply (DB + ACP)

1. **Backup Postgres** before any migration (`pg_dump` or provider snapshot).
2. Migration **039** is **additive only** (new `bridge_*` tables); it does not alter `users`, ledger, ACP wallet tables, or ACP-crypto protocol code.
3. Keep **`BRIDGE_RAIL_ENABLED=false`** (default in [docker-compose.prod.yml](../docker-compose.prod.yml)) until operations are ready; with it off, bridge HTTP returns 503 for rail-only writes and the tick skips bridge work—**no new ACP spends** are introduced by this release.
4. Do **not** change `ACP_RPC_URL`, `ACP_HOT_MNEMONIC_*`, genesis, or acp-node data for this rollout; pull new API/frontend images and run `alembic upgrade head` only.

## Pre-mainnet

1. **BSC testnet:** deploy `WACP` + `BridgeGateway` from [contracts/bridge-bsc](../contracts/bridge-bsc); run `forge test`; record addresses.
2. **Internal soak:** small amounts ACP→mint→`requestRelease`→ACP payout with operator keys isolated from user custodial hot wallet.
3. **Reconciliation:** confirm `POST /bridge/admin/reconcile` (with `X-Bridge-Operator-Secret`) reports `ok: true` under load test data.
4. **Allowlist:** if using pilot allowlist, populate via same admin endpoint; empty allowlist = all addresses allowed.

## Mainnet tag `bridge-v1.0.0-mainnet`

Pilot runbook (RU, commands): [bridge-pilot-mainnet.md](./bridge-pilot-mainnet.md).

1. Deploy verified bytecode to BSC mainnet (`contracts/bridge-bsc/script/Deploy.s.sol`); store addresses in env / secrets (not git).
2. Set `BRIDGE_RAIL_ENABLED=true`, `BRIDGE_BSC_RPC_URL`, `BRIDGE_WACP_CONTRACT`, `BRIDGE_GATEWAY_CONTRACT`, `BRIDGE_RESERVE_ACP_ADDRESS`, `BRIDGE_OPERATOR_SECRET`, optional `BRIDGE_RAIL_PAUSED=true` until go-live.
3. Run DB migration `039` on production Postgres.
4. Configure cron `POST /v1/system/jobs/tick` (with `X-Cron-Secret` if set) so `bridge_rail` tick runs periodically.

## PancakeSwap liquidity

1. Create pool **wACP / USDT** (or agreed pair); document initial price model separately.
2. Publish reserve dashboard URLs (BSCscan + ACP explorer for reserve address).
3. Publish user doc: how to buy, risks, pause behavior.

## Post-launch

1. Monitor `bridge_audit_events` for `reconciliation_mismatch` — halt and investigate.
2. Rotate `BRIDGE_OPERATOR_SECRET` and relayer keys on schedule.
