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

### 1. Run second controlled ACP -> BSC pilot
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

### 2. Reverse rail: keep it truthful, then finish operations
Current status for `BSC -> ACP`:
- public docs/UI/API already show it as **planned / pending rollout**
- public status must stay:
  - `redeem_available=false`
  - `redeem_mode=pending-rollout`
- redeem intent registration is now implemented
- redeem quote preview is now implemented

Already available for reverse rail:
- `POST /api/v1/bridge/intents/bsc-to-acp`
- `POST /api/v1/bridge/quote/bsc-to-acp`

Quote response exposes:
- `amount_wacp_wei`
- `acp_smallest_floor`
- `acp_amount_floor`
- `remainder_wacp_wei`
- `remainder_wacp`
- floor-rounding policy text

Still not declared live:
- watcher for `ReleaseRequested`
- idempotent burn-event confirmation
- ACP payout worker
- reverse reconciliation / replay-safe recovery
- operator pause + manual recovery flow for reverse payouts

### 3. Keep docs aligned with runtime truth
Recommended:
- update `bridge-operator-runbook.md`
- update `bridge-pilot-mainnet.md`
- update `bridge-launch-checklist.md`
- update public wACP docs whenever status changes

Main thing: docs must not imply that reverse payout is live when it is not.

### 4. ACP explorer link support is now wired
ACP deposit tx links no longer depend on a third-party explorer.
ANCAP now provides a built-in tx viewer at:
- `/acp/tx/{txid}`

Runtime/config default:
- `ACP_EXPLORER_TX_BASE=https://ancap.cloud/acp/tx`

That means bridge UI can link ACP deposit txs immediately, while still allowing override to an external ACP explorer later if one appears.

### 5. Finish reserve-proof maturity
Current public reserve proof endpoint is live, but still intentionally reports `pending` because ACP reserve balance is not yet sourced from a dedicated snapshot table.

Still needed:
- dedicated reserve snapshot sourcing
- public backing ratio from real snapshot data
- stale-data detection
- operator alerting on mismatch

### 6. Runtime balance helper is now available
A small helper script now exists:
- `scripts/check_wacp_balance.py`

Example:
```bash
python scripts/check_wacp_balance.py --env-file Sicret/bridge-bsc/bridge.env --address 0x396351dF6420e6089dC67F4CBdDc717f34fFB2e4
```

It reads:
- `balanceOf(address)`
- `totalSupply()`
- `symbol()`
- `decimals()`

without depending on contract ABI files inside the API container.

### 7. Prepare release path for ACP <- BSC safely
Current success is for ACP -> BSC mint rail.
Reverse direction is partially surfaced, but separate work is still needed for burn/release operational safety.

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
