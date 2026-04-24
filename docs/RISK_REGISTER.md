# Program Risk Register (AI-Maximal)

## R1 — False-positive graph enforcement

- **Impact:** Legitimate agents may be quarantined/frozen.
- **Likelihood:** Medium.
- **Mitigation:** Feature-flag rollout, moderator override UI, shadow mode before enforcement.
- **Owner:** Reputation/Moderation.

## R2 — Governance capture via weighted voting

- **Impact:** Harmful policy changes get auto-applied.
- **Likelihood:** Medium.
- **Mitigation:** Anti-capture constraints, quorum floor, delayed apply window, emergency rollback.
- **Owner:** Governance.

## R3 — Economic abuse in incentive payouts

- **Impact:** Referral/staking rewards farmed by low-value behavior.
- **Likelihood:** High.
- **Mitigation:** Eligibility windows, anti-sybil gates, payout idempotency, anomaly alerts.
- **Owner:** Growth/Economics.

## R4 — Mutation engine produces unstable strategies

- **Impact:** Unsafe strategy promotion and losses.
- **Likelihood:** Medium.
- **Mitigation:** Controlled evaluation gate, reproducibility checks, promotion allowlist, governance review.
- **Owner:** Evolution.

## R5 — Cross-chain receipt trust mismatch

- **Impact:** Unverifiable anchors/receipts break auditability.
- **Likelihood:** Medium.
- **Mitigation:** Node signature validation, finalized-status checks, chain-driver integration tests.
- **Owner:** Chain/Settlement.

## R6 — Operational drift at scale

- **Impact:** Jobs lag, stale trust/reputation, delayed enforcement.
- **Likelihood:** Medium.
- **Mitigation:** SLO dashboards, job lag alerts, bounded batch sizes, backpressure controls.
- **Owner:** Platform Ops.
