# wACP -> PancakeSwap Readiness

## Goal
Ship wACP as a credible, redeemable, reserve-backed wrapped ACP asset on BNB Smart Chain, then enable initial PancakeSwap liquidity with minimal market and bridge risk.

## Core production gate
No reserve proof -> no liquidity.
No duplicate protection -> no liquidity.
No pause/admin model -> no liquidity.
No verified contracts -> no liquidity.
No public risk docs -> no serious liquidity.

## Phase 0 — decisions to freeze once

### Token spec
- Native ACP decimals: `8`
- wACP decimals on BSC: `18`
- Conversion rule:
  - `wacp_wei = acp_smallest_unit * 10^10`
  - `acp_smallest_unit = wacp_wei / 10^10`
- `name = Wrapped ACP`
- `symbol = wACP`
- `chainId = 56`

### Launch DEX choice
For first market launch:
- Start with **PancakeSwap V2**
- First pair: **wACP/USDT**
- Fallback pair: **wACP/USDC**
- Avoid first launch on `wACP/WBNB`
- Avoid starting with V3/Infinity until price discovery and ops are stable

Reason:
- V2 uses standard LP tokens and is simpler to seed, custody, lock, or treasury-hold.
- V3 uses NFT positions and adds extra operational complexity.
- WBNB introduces avoidable volatility for the first listing.

---

## Phase 1 — Contracts

### 1.1 wACP contract requirements
Implement/finalize BEP-20-compatible wACP contract with:
- `name()`
- `symbol()`
- `decimals()`
- `totalSupply()`
- `balanceOf(address)`
- `transfer(address,uint256)`
- `approve(address,uint256)`
- `transferFrom(address,address,uint256)`
- `allowance(address,address)`

Additional required controls:
- `mint(address to, uint256 amount)`
- `burn(address from, uint256 amount)`
- `pause()`
- `unpause()`
- `setBridgeOperator(address)` or equivalent role-based operator assignment

### 1.2 Access control model
Do **not** use one hot EOA for full ownership.

Target roles:
- `DEFAULT_ADMIN_ROLE` -> multisig
- `PAUSER_ROLE` -> multisig + emergency EOA
- `MINTER_ROLE` -> bridge gateway / signer
- `BURNER_ROLE` -> bridge gateway
- `OPERATOR_ROLE` -> backend bridge worker

### 1.3 Contract tests
Must pass before mainnet liquidity:
- mint works only for authorized role
- burn works only for authorized role
- pause blocks mint/burn and any intended restricted operations
- unpause restores flow
- transfer / approve / transferFrom match normal BEP-20 behavior
- decimals conversion is exact for ACP<->wACP mapping
- rounding behavior is explicitly tested and documented

### 1.4 Verification artifacts
Prepare:
- compiler version
- optimizer settings
- constructor args
- deployment addresses
- verification scripts / commands for BscScan

---

## Phase 2 — Bridge invariants and reserve proof

### 2.1 Canonical invariant
Define and document one invariant everywhere:

`minted_wACP_on_BSC <= locked_or_custodied_ACP_reserve - operational_buffer`

If represented as ratio:
- `backing_ratio = acp_reserve_smallest_units / redeemable_wacp_equivalent_smallest_units`
- `healthy` if `backing_ratio >= 1.0`
- `degraded` if close to threshold or telemetry stale
- `critical` if `minted_wACP > reserve_equivalent`

### 2.2 Backend table: `bridge_reserve_snapshots`
Add table:
- `id`
- `created_at`
- `acp_reserve_address`
- `acp_reserve_balance_smallest`
- `bsc_wacp_total_supply_wei`
- `bsc_wacp_total_supply_acp_smallest`
- `operational_buffer_smallest`
- `backing_ratio`
- `status` (`healthy|degraded|critical|paused`)
- `acp_block_height`
- `bsc_block_number`

### 2.3 Public endpoint: reserve proof
Add:
- `GET /api/v1/wacp/reserve-proof`

Response shape:
```json
{
  "status": "healthy",
  "acp_reserve_address": "ACP...",
  "acp_reserve_balance_smallest": "1000000000000",
  "wacp_contract": "0x...",
  "wacp_total_supply_wei": "10000000000000000000000",
  "wacp_total_supply_acp_smallest": "1000000000000",
  "backing_ratio": "1.0000",
  "operational_buffer_smallest": "0",
  "last_acp_block_height": 123456,
  "last_bsc_block_number": 456789,
  "last_updated_at": "2026-05-04T00:00:00Z"
}
```

### 2.4 Public endpoint: bridge status
Add:
- `GET /api/v1/wacp/status`

Include:
- bridge enabled/paused
- reserve proof summary
- required confirmations
- mint/redeem availability
- latest worker heartbeat
- known degraded flags

---

## Phase 3 — Intent lifecycle and idempotency

### 3.1 Backend table: `bridge_intents`
Add:
- `id`
- `direction` (`acp_to_wacp` / `wacp_to_acp`)
- `user_id`
- `status`
- `acp_txid`
- `acp_from_address`
- `acp_to_reserve_address`
- `acp_amount_smallest`
- `bsc_tx_hash`
- `bsc_recipient`
- `wacp_amount_wei`
- `confirmations_seen`
- `required_confirmations`
- `idempotency_key`
- `error_code`
- `error_message`
- `created_at`
- `updated_at`
- `completed_at`

### 3.2 Required statuses
- `created`
- `acp_seen`
- `acp_confirming`
- `acp_confirmed`
- `mint_queued`
- `mint_submitted`
- `mint_confirming`
- `completed`
- `failed`
- `paused`
- `manual_review`

### 3.3 Idempotency rules
Must enforce at DB layer:
- `UNIQUE(direction, acp_txid, bsc_recipient)`
- `UNIQUE(idempotency_key)`

This is mandatory to prevent duplicate minting after rescans, retries, or worker restarts.

### 3.4 Intent APIs
Add:
- `GET /api/v1/wacp/intents/{id}`
- optional authenticated list endpoint later for user history

Intent response should include:
- status
- source txid
- destination tx hash
- confirmations progress
- timestamps
- human-readable current step

---

## Phase 4 — Workers / jobs hardening

### 4.1 Jobs to implement
Split responsibilities into separate jobs:
- `bridge_scan_acp_deposits`
- `bridge_confirm_acp_deposits`
- `bridge_submit_bsc_mints`
- `bridge_confirm_bsc_mints`
- `bridge_reconcile_supply_reserve`
- `bridge_alert_anomalies`

### 4.2 Worker invariants
Workers must obey:
- never mint before required confirmations
- never mint twice for the same economic event
- never proceed when bridge is paused
- never silently skip reserve mismatch
- always persist status transitions before external side effects where possible
- always be restart-safe

### 4.3 Failure-mode tests
Required scenarios:
- ACP RPC down -> intent survives, bridge status degrades, no duplicate actions
- BSC RPC down -> mint not duplicated
- worker restart mid-flow -> resumes from last safe state
- duplicate ACP tx scan -> no duplicate mint
- bridge paused -> new mints stop
- DB restart -> no lost intent
- malformed txid -> `manual_review` or explicit failure
- insufficient confirmations -> mint blocked
- BSC tx failed -> retry/manual review without duplicate mint
- reserve mismatch -> pause or block mint path according to policy

### 4.4 Alerting
Emit anomaly alerts for:
- reserve ratio below threshold
- stale reserve snapshot
- stuck intent age threshold breached
- repeated mint submission failure
- unexpected total supply jump
- reconciliation mismatch

---

## Phase 5 — Frontend

### 5.1 `/wallet/acp` block
Keep wACP inside ACP wallet page, not in top nav.

Add compact block:
- `wACP on BSC`
- contract address
- network = BNB Smart Chain
- decimals = 18
- bridge status badge: `Healthy / Degraded / Paused`
- reserve backing percent
- button: `Bridge ACP -> wACP`
- button: `Redeem wACP -> ACP`
- button: `Trade on PancakeSwap`

Rules:
- Pancake CTA is disabled until `pair_live = true`
- show explicit warning when bridge is paused/degraded
- show verified contract link when available

### 5.2 Intent timeline page
Add page:
- `/wallet/acp/bridge/[intentId]`

Timeline states:
1. deposit address generated
2. ACP transaction seen
3. ACP confirmations progress
4. mint submitted on BSC
5. mint confirmed
6. completed

### 5.3 Reserve proof UI
Add card/widget rendering:
- reserve address
- reserve balance
- wACP total supply
- backing ratio
- last updated time
- health state

### 5.4 Explorer / trust links
Show links to:
- BscScan verified contract
- BscScan tx for mint/burn
- ACP tx viewer for deposit side
- public docs pages

---

## Phase 6 — Public docs

Create:
- `/docs/wacp`
- `/docs/wacp/bridge`
- `/docs/wacp/reserve`
- `/docs/wacp/risks`
- `/docs/wacp/contracts`

### Mandatory risk disclosures
Document clearly:
- wACP is a wrapped representation of ACP on BNB Smart Chain
- redemption depends on bridge availability and ACP reserve backing
- bridge operators/admins may pause minting or redemption during incidents
- smart contract, custody, RPC, chain reorg and liquidity risks exist
- PancakeSwap market price may differ from ACP reference value

### Contracts page should include
- wACP contract address
- bridge/gateway contract address
- reserve address
- chain IDs
- explorer links
- verification status

---

## Phase 7 — Operations / security

### 7.1 Key management
Define:
- multisig admin owners
- operator key storage method
- emergency pauser key storage
- signer rotation process

### 7.2 Emergency runbooks
Write runbooks for:
- bridge pause
- reserve mismatch
- stuck mint
- stuck redeem
- RPC outage
- chain reorg handling
- contract role compromise

### 7.3 Manual review policy
Define when intent enters `manual_review`:
- malformed source tx
- amount mismatch
- unsupported recipient mapping
- failed retries exhausted
- suspicious duplicate patterns

---

## Phase 8 — Verification and listing readiness

### 8.1 Must verify before liquidity
- wACP contract verified on BscScan
- bridge/gateway contract verified on BscScan
- compiler metadata published
- docs page live
- reserve proof endpoint live

### 8.2 Token metadata pack
Prepare:
- `name: Wrapped ACP`
- `symbol: wACP`
- `decimals: 18`
- `chainId: 56`
- `website: https://ancap.cloud`
- `docs: https://ancap.cloud/docs/wacp`
- `logoURI`
- `contract: 0x...`

### 8.3 PancakeSwap token list follow-up
Prepare JSON metadata and submission path for PancakeSwap token list only after:
- mainnet contract final
- logo final
- docs live
- pair live

---

## Phase 9 — Safe launch order

### 9.1 Testnet
1. deploy wACP to BSC testnet
2. test mint flow end-to-end
3. test redeem flow end-to-end
4. test pause flow
5. test duplicate protection
6. test reserve reconciliation

### 9.2 Mainnet pre-market
1. deploy wACP to BSC mainnet
2. verify contract on BscScan
3. verify gateway/bridge contract
4. publish docs and reserve proof endpoint
5. mint small controlled amount
6. reconcile supply vs reserve

### 9.3 Initial DEX launch
1. create PancakeSwap **V2** pair `wACP/USDT`
2. add small seed liquidity
3. test buy
4. test sell
5. test remove liquidity
6. announce limited beta
7. scale liquidity only after stable monitoring period

---

## Launch gate checklist
All must be PASS before meaningful liquidity:
- [ ] wACP contract deployed
- [ ] wACP contract verified
- [ ] gateway contract verified
- [ ] admin owner is multisig
- [ ] operator key has limited role
- [ ] pause tested
- [ ] mint tested
- [ ] burn/redeem tested
- [ ] duplicate scan tested
- [ ] reserve proof endpoint live
- [ ] reserve dashboard live
- [ ] `/wallet/acp` shows wACP block
- [ ] docs page live
- [ ] emergency runbook written
- [ ] seed liquidity amount approved
- [ ] Pancake pair created
- [ ] swap test passed
- [ ] remove liquidity test passed

## Hard red flags
Do not add liquidity if any are true:
- single EOA owns mint/admin/pause
- no reserve proof endpoint
- no duplicate tx protection
- no pause switch
- no bridge status on frontend
- no BscScan verification
- no public risk disclosure
- no runbook for stuck mint/redeem
- no supply mismatch monitoring

## Recommended implementation order

### Sprint 1 — `wacp-readiness-core`
Backend:
1. add `bridge_reserve_snapshots`
2. add `bridge_intents` + state machine
3. add `GET /api/v1/wacp/reserve-proof`
4. add `GET /api/v1/wacp/status`
5. add `GET /api/v1/wacp/intents/{id}`
6. add reconciliation job
7. add anomaly alerts

Contracts:
1. finalize wACP BEP-20
2. add AccessControl roles
3. add Pausable
4. restrict mint/burn
5. add tests
6. prepare BscScan verification config

Frontend:
1. add compact wACP card to `/wallet/acp`
2. add reserve proof card
3. add bridge status badge
4. add bridge intent timeline page
5. add disabled Pancake CTA until pair live

Ops:
1. define operator key storage
2. define multisig admin
3. define emergency pause flow
4. define reserve mismatch response
5. define manual review process

### Sprint 2 — `wacp-mainnet-trust`
1. deploy and verify contracts
2. publish docs pages
3. expose public reserve proof
4. validate alerts and dashboards
5. dry-run limited mint/redeem on mainnet

### Sprint 3 — `wacp-market-bootstrap`
1. create V2 stable pair
2. seed small liquidity
3. run trade/remove tests
4. enable Pancake CTA
5. limited beta announcement
6. increase liquidity gradually

## Final verdict
PancakeSwap itself is the easy part.
The real gate is whether wACP looks and behaves like a provable, reserve-backed wrapped ACP asset with restart-safe bridge lifecycle, verified contracts, and public transparency.
