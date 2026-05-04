# Bridge operator runbook

## Scope

This runbook is for the ACP -> BSC custodial rail that mints `wACP` on BSC after confirmed ACP deposit into the reserve address.

It describes the operator reality after the first successful mainnet pilot on 2026-05-04.

## Current live deployment

### Contracts
- `WACP`: `0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402`
- `BridgeGateway`: `0x57c24FF77B23a82328cb88914D4FD4EEBd93321b`

### Runtime state
- `BRIDGE_RAIL_ENABLED=true`
- `BRIDGE_RAIL_PAUSED=false`
- `BRIDGE_DRY_RUN=false`
- `BRIDGE_ACP_CONFIRMATIONS=3`

### Pilot proof
First real pilot already completed successfully:
- operation id: `9320ecb4-c407-4ad2-8a4c-5c634b2259d8`
- ACP tx: `6c38d15141424819700e043fbd664826d37b0e0de14179a5f18906c2b3b4838e`
- BSC mint tx: `a656c01758cd51f0fdd82627e6ac6ab5e7d24acbe4b694cd5e41cb1692ad8f8b`
- final status: `COMPLETED`

## Secrets and files

Keep secrets only in:
- `Sicret/bridge-bsc/bridge.env`
- `Sicret/bridge-bsc/bsc-operator-private-key.txt`
- `Sicret/bridge-bsc/acp-reserve-mnemonic.txt`
- `Sicret/bridge-bsc/acp-release-hot-mnemonic.txt`

Do not commit any of the above.

## Standard health check

Before any new pilot or after any redeploy, verify all of this.

### Docker
- `ancap-frontend-1` up
- `ancap-api-1` healthy
- `ancap-proxy-1` up
- `ancap-postgres-1` healthy

### API
- `GET /api/v1/system/health`
- `GET /api/v1/bridge/status`
- `GET /api/v1/bridge/reserve-summary`
- `POST /api/v1/system/jobs/tick`
- `POST /api/v1/bridge/admin/reconcile`

Expected:
- bridge enabled
- not paused
- `dry_run=false`
- `confirmations_acp=3`
- reconciliation `ok=true`

### UI
- open `/bridge/acp-bsc`
- authenticated user should be able to see intent rows
- result rows may include:
  - `acp_tx_hash`
  - `bsc_tx_hash_mint`
  - `deposit_ref_hex`
  - `bsc_log_index`
  - `version`
  - BscScan tx link

## Normal ACP -> BSC operator flow

### 1. Create intent
User creates an authenticated intent via UI/API.
Expected initial state:
- `PENDING_DEPOSIT`

### 2. Wait for exact ACP deposit
User sends exact ACP amount to reserve address.
Watcher matches incoming reserve deposit.
Expected transition:
- `PENDING_DEPOSIT -> CONFIRMED_ON_ACP`

### 3. Mint submission on BSC
Orchestrator submits live BSC mint transaction via `BridgeGateway.mintWrapped(...)`.
Expected transition:
- `CONFIRMED_ON_ACP -> MINT_REQUESTED`

Recorded fields should include:
- `bsc_tx_hash_mint`
- `deposit_ref_hex`

### 4. BSC confirmation
BSC watcher fetches receipt/logs and finalizes operation.
Expected transitions:
- `MINT_REQUESTED -> MINTED_ON_BSC`
- `MINTED_ON_BSC -> COMPLETED`

## Verification after completion

Confirm all of:
1. operation shows `COMPLETED`
2. BSC mint tx exists and has receipt success
3. reconciliation still returns `delta_wacp_wei=0`
4. recipient wallet `wACP` balance increased
5. audit trail contains submit + confirm + completion events

## Known important implementation details

### ACP confirmations
Runtime target is:
- `BRIDGE_ACP_CONFIRMATIONS=3`

This must be set both in env and actually passed through Docker compose.

### BSC tx hash normalization
`bsc_tx_hash_mint` may be stored without `0x`.
Watcher must normalize hash before `eth_getTransactionReceipt`.
This bug already happened once and was fixed.

### API visibility
Operation API now exposes:
- `acp_tx_hash`
- `bsc_tx_hash_mint`
- `deposit_ref_hex`
- `bsc_log_index`
- `version`

This means most operator checks no longer require raw SQL.

## Failure playbook

### If intent stays in `PENDING_DEPOSIT`
Check:
- ACP tx really went to reserve address
- exact amount matches intent
- confirmations reached 3
- ACP watcher tick ran successfully
- ACP RPC reachable from API container

### If intent stays in `CONFIRMED_ON_ACP`
Check:
- live signer key present
- `BRIDGE_DRY_RUN=false`
- BSC RPC reachable
- gateway/wACP contract addresses correct
- orchestrator tick actually ran

### If intent stays in `MINT_REQUESTED`
Check:
- `bsc_tx_hash_mint` exists
- tx exists on-chain
- receipt status is success
- watcher receipt lookup is using normalized `0x` hash
- BSC confirmations threshold reached

### If reconciliation fails
Check:
- minted total on BSC
- locked ACP sum in operations
- whether a tx succeeded on-chain but watcher/API state is lagging

## Next recommended step

Run one more small controlled pilot to prove repeatability.
After that, raise confidence before changing caps.

## Non-goals

This runbook does not mean reverse bridge direction is production-ready.
`BSC -> ACP` burn/release path still needs its own operational validation.
