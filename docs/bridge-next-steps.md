# Bridge next steps (current state)

## Current state as of 2026-05-04

ACP -> BSC pilot rail is already working end-to-end.

### Confirmed working
- BSC contracts deployed on mainnet:
  - `WACP`: `0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402`
  - `BridgeGateway`: `0x57c24FF77B23a82328cb88914D4FD4EEBd93321b`
- Runtime is live:
  - `BRIDGE_RAIL_ENABLED=true`
  - `BRIDGE_RAIL_PAUSED=false`
  - `BRIDGE_DRY_RUN=false`
  - `BRIDGE_ACP_CONFIRMATIONS=3`
- First real pilot intent completed:
  - operation id: `9320ecb4-c407-4ad2-8a4c-5c634b2259d8`
  - ACP deposit tx: `6c38d15141424819700e043fbd664826d37b0e0de14179a5f18906c2b3b4838e`
  - BSC mint tx: `a656c01758cd51f0fdd82627e6ac6ab5e7d24acbe4b694cd5e41cb1692ad8f8b`
  - final status: `COMPLETED`
- Reconciliation is clean:
  - `total_acp_smallest=100000000`
  - `total_wacp_wei=1000000000000000000`
  - `delta_wacp_wei=0`
- On-chain balance verified:
  - operator wallet `0x396351dF6420e6089dC67F4CBdDc717f34fFB2e4` holds `1 wACP`

## Important fixes already applied
- Intent creation API no longer fails on audit-event FK ordering.
- ACP watcher now matches real deposits into reserve address and moves intents from `PENDING_DEPOSIT` to `CONFIRMED_ON_ACP`.
- Orchestrator now submits live BSC mint transactions.
- BSC watcher now normalizes tx hash with `0x` before receipt lookup.
- Bridge API now exposes:
  - `acp_tx_hash`
  - `bsc_tx_hash_mint`
  - `deposit_ref_hex`
  - `bsc_log_index`
  - `version`
- Bridge UI intent list was updated to show those fields and link mint tx to BscScan.

## What to do next

### 1. Run second controlled pilot
Goal: prove repeatability, not just one lucky pass.

Suggested flow:
1. Create new authenticated bridge intent for a small amount.
2. Send matching ACP amount to reserve address.
3. Trigger or wait for jobs tick.
4. Confirm status path:
   - `PENDING_DEPOSIT`
   - `CONFIRMED_ON_ACP`
   - `MINT_REQUESTED`
   - `COMPLETED`
5. Verify:
   - bridge status counts
   - reconciliation remains `delta_wacp_wei=0`
   - wallet `wACP` balance increases as expected

### 2. Clean operator docs
Recommended:
- update `bridge-operator-runbook.md`
- update `bridge-pilot-mainnet.md`
- update `bridge-launch-checklist.md`

Main thing: docs should no longer imply that live mint path is missing.

### 3. Add optional ACP explorer link support
Right now `acp_explorer_tx_base` is empty in runtime status.
If an ACP explorer base URL becomes available, expose it so UI can link ACP deposit txs the same way it links BSC mint txs.

### 4. Add a tiny runtime balance helper
Optional but useful:
- small script or endpoint to read `balanceOf(address)` and `totalSupply()` for wACP without depending on ABI files inside the API container.

### 5. Prepare release path if ACP <- BSC direction is needed later
Current success is for ACP -> BSC mint rail.
If reverse direction is planned, separate work is still needed for burn/release operational safety.

## Recommended operator checks before any next pilot
- `GET /api/v1/bridge/status`
- `POST /api/v1/system/jobs/tick`
- `POST /api/v1/bridge/admin/reconcile`
- `GET /bridge/acp-bsc`
- confirm Docker containers are healthy
- confirm BSC gas wallet still has BNB

## Do not forget
- Keep secrets only in `Sicret/`
- Do not commit mnemonics/private keys
- Keep pilot caps conservative until at least one more successful run
