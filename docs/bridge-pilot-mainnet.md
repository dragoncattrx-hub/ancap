# ACP -> BSC bridge pilot (mainnet)

## Status

As of 2026-05-04, the pilot is no longer just a plan.
It has already completed one real end-to-end ACP -> BSC run successfully.

### Current deployed contracts
- `WACP`: `0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402`
- `BridgeGateway`: `0x57c24FF77B23a82328cb88914D4FD4EEBd93321b`

### Current runtime state
- `BRIDGE_RAIL_ENABLED=true`
- `BRIDGE_RAIL_PAUSED=false`
- `BRIDGE_DRY_RUN=false`
- `BRIDGE_ACP_CONFIRMATIONS=3`
- BSC mint signer path is active

### Confirmed successful pilot operation
- operation id: `9320ecb4-c407-4ad2-8a4c-5c634b2259d8`
- ACP deposit tx: `6c38d15141424819700e043fbd664826d37b0e0de14179a5f18906c2b3b4838e`
- BSC mint tx: `a656c01758cd51f0fdd82627e6ac6ab5e7d24acbe4b694cd5e41cb1692ad8f8b`
- final status: `COMPLETED`
- minted amount: `1 wACP`

## What was fixed to make pilot work

1. Intent creation API FK ordering bug fixed.
2. ACP watcher now detects real reserve deposits and matches them to pending intents.
3. `BRIDGE_ACP_CONFIRMATIONS` is now actually passed through Docker runtime.
4. Orchestrator now submits live BSC mint txs.
5. BSC watcher now normalizes tx hashes with `0x` before receipt lookup.
6. API now exposes:
   - `acp_tx_hash`
   - `bsc_tx_hash_mint`
   - `deposit_ref_hex`
   - `bsc_log_index`
   - `version`
7. Frontend intent list now shows those result fields, links mint tx to BscScan, and links ACP deposit tx to the built-in ANCAP ACP tx viewer.

## Current operator flow

### 1. Preconditions
- Docker stack must be healthy.
- ACP node/RPC must be reachable.
- BSC RPC must be reachable.
- `bridge.env` must contain live values.
- Operator secrets must stay in `Sicret/bridge-bsc/` only.

### 2. Health checks
Run these before any pilot:
- `GET /api/v1/bridge/status`
- `GET /api/v1/bridge/reserve-summary`
- `POST /api/v1/system/jobs/tick`
- `POST /api/v1/bridge/admin/reconcile`
- open `/bridge/acp-bsc`

Expected:
- bridge enabled
- not paused
- `dry_run=false`
- `confirmations_acp=3`
- reconciliation `ok=true`

### 3. Create intent
Authenticated user creates `ACP -> BSC` intent via UI or API.
Intent should start in `PENDING_DEPOSIT`.

### 4. Send ACP to reserve
User sends exact ACP amount to:
- `BRIDGE_RESERVE_ACP_ADDRESS`

Watcher should move operation:
- `PENDING_DEPOSIT -> CONFIRMED_ON_ACP`

### 5. Mint on BSC
Orchestrator submits BSC tx through `BridgeGateway.mintWrapped(...)`.
Operation moves to:
- `MINT_REQUESTED`

### 6. Confirm on BSC
BSC watcher reads receipt/logs and advances operation through:
- `MINT_REQUESTED -> MINTED_ON_BSC -> COMPLETED`

### 7. Verify outcome
Check all of:
- `/api/v1/bridge/status`
- reconciliation delta is zero
- operation result fields exposed by API
- BscScan tx exists and succeeded
- ACP deposit tx link opens under `/acp/tx/{txid}`
- recipient wallet `balanceOf(wACP)` increased

## Recommended next step

Run one more small controlled pilot.
Goal is repeatability, not just one successful pass.

## Notes
- Keep caps conservative until there is at least one more successful run.
- Do not commit mnemonics or private keys.
- If reverse direction `BSC -> ACP` is needed later, that is separate operational work.
