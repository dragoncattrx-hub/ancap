# ANCAP wACP / BSC bridge spec v1

## 1. Goal

Bridge native ACP value into a BSC-side wrapped token (`wACP`) with operator-controlled minting, reserve-backed accountability, and clear status / audit surfaces.

## 2. Scope

v1 includes:
- ACP -> BSC intent registration
- reserve deposit confirmation on ACP
- BSC mint execution
- BSC -> ACP redeem intent / quote / burn-detection / payout-confirmation path
- reserve summary and public bridge status
- operator recovery/admin controls

## 3. Forward rail FSM

`PENDING_DEPOSIT` -> `CONFIRMED_ON_ACP` -> `MINT_REQUESTED` -> `MINTED_ON_BSC` -> `COMPLETED`

## 4. Reverse rail FSM

Normative reverse FSM target:
`BURN_REQUESTED` -> `BURN_CONFIRMED` -> `ACP_PAYOUT_SENT` -> `COMPLETED`

State semantics for reverse rail:
- `BURN_CONFIRMED` = confirmed `ReleaseRequested` event was matched idempotently to an operation
- `ACP_PAYOUT_SENT` = ACP payout transaction was submitted and `acp_tx_hash` recorded
- `COMPLETED` = ACP watcher later observed that payout tx on ACP with sufficient confirmations

## 5. Current implementation note as of 2026-05-23

Reverse rail is now live in runtime behavior, not merely staged internally:
- public bridge status currently exposes live redeem metadata when reserve health is acceptable
- intent registration exists
- quote/floor/remainder transparency exists
- BSC watcher ingests reverse burn requests
- orchestrator submits ACP payout and records `ACP_PAYOUT_SENT`
- ACP watcher performs final `COMPLETED` transition after ACP confirmation

Important nuance:
- runtime being live does **not** mean the reverse rail is fully hardened operationally
- replay/recovery validation, operator drills, and clearer public UX wording are still open follow-up work
- if the product wants reverse status to read as `pending-rollout`, runtime/API/UI must be changed deliberately to match that story

Failed / manual paths: `FAILED`, `DISPUTED`, `REORGED`.

## 6. Key roles (separation)

| Role | Access |
|------|--------|
| Deposit watcher | **Read-only** ACP RPC; no spend keys |
| Reserve (cold / semi-cold) | Funds majority of backing; manual/top-up procedures |
| Release signer | **Isolated hot** wallet; minimal balance; rotatable; in current implementation reuse the existing ACP hot-wallet / `walletd` operational path until a stricter dedicated signer split is introduced |

## 7. Smart contract (BSC) — v1 capabilities

- **WACP:** ERC-20, 18 decimals; `mint` / burn path only via **gateway** (single gateway address).
- **BridgeGateway:** `pause`; **mintCapPerDay**; **maxSingleMint**; owner/operator mint to user after off-chain proof; user `requestRelease(acpAddress, amount)` burns wACP held by gateway after `transferFrom` user; emits **`ReleaseRequested`** with `requestId`, `from`, `amount`, `acpAddress`.
- Emergency: unknown off-chain state -> **do not mint** until classified.

## 8. Reserve/accounting expectations

- Public bridge status and reserve summary must remain consistent.
- Reconciliation must explain both forward minted supply and reverse completed / outstanding liabilities.
- Reserve proof maturity still needs dedicated snapshots, stale-data detection, and operator mismatch alerting.

## 9. Operator truth rule

Docs, public status, and runtime behavior must not contradict each other.
If runtime says redeem is live, docs must not still claim `pending-rollout`.
If product wants a softer rollout posture, change runtime/API/UI intentionally and then document that exact truth.
