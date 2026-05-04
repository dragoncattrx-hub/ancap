# Bridge spec v1 — wACP custodial clearing rail (ACP native ↔ BSC)

**Status:** normative for v1 implementation.  
**Terminology:** This is a **custodial mint/burn clearing rail** (operator-backed peg), not a trustless cross-chain bridge. User-facing copy must state reserve risk, pause, and operator responsibility.

## 1. Assets and chains

| Item | Value |
|------|--------|
| Source chain | ACP (native), addresses `acp1...`, JSON-RPC as deployed for ANCAP |
| Destination chain | BSC (EVM), BEP-20 |
| Wrapped token | **wACP**, `name = Wrapped ACP`, `symbol = wACP`, **18 decimals** |
| Native ACP decimals | **8** (see `ACP-crypto/acp-crypto/src/protocol_params.rs` `TOKEN_DECIMALS`) |

## 2. Decimal mapping (8 ↔ 18)

Let `acp_smallest` be the integer amount in **10⁻⁸ ACP** units (native chain representation).

- **Mint (ACP → BSC):**  
  `wacp_wei = acp_smallest * 10^10`  
  (because `18 - 8 = 10`).

- **Release (BSC → ACP):**  
  From user burn amount `wacp_wei` on BSC:  
  `acp_smallest_floor = wacp_wei / 10^10` (integer division).  
  **Remainder:** `remainder_wei = wacp_wei % 10^10`.  

**v1 policy (fixed):** rounding **in favor of the reserve** on the burn path: credit the user **only** `acp_smallest_floor` native units; `remainder_wei` is accounted in a **remainder buffer** (off-chain ledger field or dedicated sub-account) and is **not** paid as ACP unless a future policy explicitly defines sweep rules.

**Invariant:** sum of minted wACP (wei) must never imply more ACP smallest-units paid out than were deposited, modulo explicit fees documented below.

## 3. Hard reserve invariant

Let:

- `S` = wACP `totalSupply()` on BSC (wei).
- `L` = total ACP smallest-units **credited** to the rail as locked deposits minus completed ACP payouts (off-chain ledger + on-chain reserve address balance checks).

**Hard guarantee (reconciliation):** operational rule: **`S` converted to ACP-smallest at mint must not exceed `L` + fee_bucket** beyond floating tolerance documented in runbooks. Mismatch → **pause rail** + alert + manual reconciliation before resume.

Reconciliation job (required): periodic compare `S`, ledger sums, and hot reserve address balance on ACP; on violation set `bridge_rail_paused` and emit audit rows.

## 4. Deposit model (v1)

Two supported patterns (pick one per deployment; default **memo/reference** if single deposit address):

1. **Per-user deposit address** — unique `acp1...` per user/session; watcher matches by `to_address`.
2. **Single deposit address + memo** — user sends to shared address with **memo/reference** in transaction metadata or separate registration step; watcher matches `(to, memo)` or pre-registered `(user, memo)`.

Idempotency key for ACP deposits: **`(acp_chain_id, tx_hash, output_index)`** or **`(acp_chain_id, tx_hash, 0)`** if no index — must be **unique** in DB.

## 5. Idempotency and double-spend prevention

- One confirmed deposit event → **at most one** mint pipeline row.
- DB: `UNIQUE (acp_chain_id, acp_tx_hash, acp_out_index)` on `bridge_operations` (nullable-safe partial unique where applicable).
- BSC burn / release request: `UNIQUE (bsc_chain_id, bsc_tx_hash, bsc_log_index)` for the initiating tx/event.
- State transitions use DB transactions + optimistic concurrency on `version` or `updated_at` where needed.

## 6. Finality and reorgs (ACP)

- **Safe confirmations `N`:** configurable; initial range **20–60**; tune from observed reorg depth on ACP mainnet.
- **Watcher checkpoint:** persist last scanned block height per chain key (`acp`, `bsc`).
- **Reorg handler:** if chain tip rolls back below a processed block, mark affected rows `REORGED` / `DISPUTED`, **do not mint**, re-evaluate after re-confirmation; never process the same `(tx_hash, out_index)` twice for mint without explicit admin policy.

BSC: do not treat mint/release as final until **`M_bsc`** confirmations (configurable, default ≥ 12–30 for mainnet per ops policy).

## 7. FSM states (append-only history)

Operational state lives in `bridge_operations.status`. History in `bridge_state_transitions` / `bridge_audit_events` — **append-only** (application role: INSERT only on audit tables).

### ACP → BSC

`PENDING_DEPOSIT` → `CONFIRMED_ON_ACP` → `MINT_REQUESTED` → `MINTED_ON_BSC` → `COMPLETED`

### BSC → ACP

`BURN_REQUESTED` → `BURN_CONFIRMED` → `ACP_PAYOUT_SENT` → `COMPLETED`

Failed / manual paths: `FAILED`, `DISPUTED`, `REORGED` (document allowed transitions from each).

## 8. Key roles (separation)

| Role | Access |
|------|--------|
| Deposit watcher | **Read-only** ACP RPC; no spend keys |
| Reserve (cold / semi-cold) | Funds majority of backing; manual/top-up procedures |
| Release signer | **Isolated hot** wallet; minimal balance; rotatable; separate from `ACP_HOT_MNEMONIC` used for user custodial wallet |

## 9. Smart contract (BSC) — v1 capabilities

- **WACP:** ERC-20, 18 decimals; `mint` / burn path only via **gateway** (single gateway address).
- **BridgeGateway:** `pause`; **mintCapPerDay**; **maxSingleMint**; owner/operator mint to user after off-chain proof; user `requestRelease(acpAddress, amount)` burns wACP held by gateway after `transferFrom` user; emits **`ReleaseRequested`** with `requestId`, `from`, `amount`, `acpAddress`.
- Emergency: unknown off-chain state → **do not mint** until classified.

## 10. Fees (placeholder)

Bridge fee (if any): fixed or bps — **TBD in deployment config**; must be in spec addendum before mainnet. Fees accrue to `fee_bucket` for reconciliation.

## 11. Allowlist and feature flag

- `BRIDGE_RAIL_ENABLED` — master off for API/UI.
- Allowlist table for BSC addresses and/or user IDs for **pilot** phase.

## 12. Audit

Append-only `bridge_audit_events`: every mint intent, mint tx hash, burn detection, payout tx, state change, admin pause/resume, reconciliation outcomes. DB role should not UPDATE/DELETE audit rows (enforce via permissions or triggers in production).

## 13. References in repo

- ACP integration: `app/api/routers/wallet_acp.py`, `ACP-crypto/`
- Contracts: `contracts/bridge-bsc/`
- API: `app/api/routers/bridge_rail.py` under `/v1/bridge/...`
- UI: `frontend-app/src/app/bridge/acp-bsc/`

## 14. EIP note (non-blocking)

For future indexer interoperability, consider alignment with cross-chain mint/burn event standards (e.g. [EIP-7802](https://eips.ethereum.org/EIPS/eip-7802)) — not required for v1.
