# Final ANCAP architecture: three layers (L1 / L2 / L3)

The architecture is designed so that it can be **(a) actually assembled, (b) scaled, (c) prepared for crypto and AI-only identity later.**

---

## Tier Summary

| Level | Destination |
|---------|-------------|
| **L1** | Engine + provability + security (Core Ledger & Verifiable Execution) |
| **L2** | Market + reputation + incentives (Market Layer) |
| **L3** | Autonomy + Proof-of-Agent + tokenization + multi-verticals (Autonomous Economy) |

---

## L1 — Core Ledger & Verifiable Execution

**Goal:** any activity of agents is verifiable, limited and auditable.

### 1. Identity & Keys

- **Accounts:** human, agent (type is fixed).
- **Agent keys:** signing requests (API keys / JWT / DID keys).
- **Agent profile:** capabilities, owner (optional), risk tier, status.
- **Policy bindings:** what actions are allowed to the agent.

### 2. Immutable Run Ledger (Auditability)

“Truth” in the form of artifacts:

- `inputs_hash`, `workflow_hash`, `outputs_hash`
- `environment_hash` (vertical/plugin/policy version)
- timestamps, signatures

Storage: Postgres + if necessary, content-addressed storage (S3/minio) on MVP.

### 3. Strategy Registry (Declarative Workflows)

Strategy is not code, but **heat**:

- steps, allowed_actions, required_data
- risk_spec, evaluation_spec
- versioning + provenance

### 4. Execution Runtime (Sandbox + Limits)

- **Sandbox:** container/wasm/limited python runner.
- **Limits:** rate, compute, budget, risk.
- **Modes:** dry-run / backtest / live-run.
- Strict allowlist of vertical actions.

### 5. Risk Kernel (minimum viable)

- Positions/exposures/limits.
- Stop conditions.
- Max drawdown / VaR approximation.
- Kill-switch to strategy/agent.

**Result L1:** provable “execution machine”: strategies are launched, results are recorded, risk is limited, everything is auditable.

---

## L2 — Market Layer (Reputation + Marketplace + Incentives)

**Goal:** turn the platform from an “engine” into an “economy” - trust, motivation, exchange.

### 1. Reputation 2.0 (Anti-Sybil)

Score is a composite index, not “likes”:

**Components:**

- **Performance score** — risk-adjusted, stability, drawdown.
- **Reliability score** — delivery of results, reproducibility of runs.
- **Integrity score** — audit flags, policy violations.
- **Stake score** - how much is locked up for liability.
- **Graph trust** — trust from strong participants.

**Mechanics:**

- stake-to-participate (for agents)
- fines/slashing for violation
- decay over time
- reputation is tied to identity and keys

### 2. Reviews / Disputes (scam protection)

- Reviews **weighted** by reputation and stake.
- **Dispute** as a separate object.
- The audit agent / arbitration makes a verdict → affects the reputation.

### 3. Marketplace objects

**Tradeable entities:**

- Strategies (versioned specs)
- Signals / research artifacts
- Data subscriptions
- Execution services (executive agents)
- Risk models / evaluators
- Audit services

**Deals:**

- licenses to use the strategy
- revenue-share / subscription
- escrow (internal, even without crypto)

### 4. Capital Allocation Market

- Allocator agents distribute virtual or real capital.
- Performance → limits, visibility, access to capital.
- “Funds” as entities: portfolio-of-strategies.

### 5. Governance (minimal, not DAO yet)

- Policy proposals (updating verticals, metrics, limits).
- Moderation: ban / quarantine / appeal.
- «Auditor council» (AI + human).

**Result L2:** functioning agent market: you can trust, buy/sell, punish for abuse.

---

## L3 — Autonomous Economy (Proof-of-Agent + Tokenization + Cross-Vertical)

**Goal:** system is autonomous, self-sustaining, AI-native.

### 1. Proof-of-Agent / AI-only onboarding

Not a captcha, but a set of checks:

- **Challenge-response** (reasoning + tool-use).
- **Proof-of-execution** - the agent really knows how to perform workflow.
- Rate-limited bootstrap.
- Stake requirement.
- Device/cluster attestation (optional later).

**Result:** agent identity is difficult to “clone” en masse.

### 2. Native Token / Credit Layer (or hybrid)

**Options:** first internal credits, then token when economics are proven.

**Features:**

- fees for runs / storage / marketplace
- staking for reputation and access to capital
- slashing for violations
- escrow for transactions
- rewards for useful roles (audit / risk / data)

### 3. On-chain anchoring (optional)

- **On-chain:** stake, slashing, settlement, ownership.
- **Off-chain:** runs, large artifacts, metrics.

### 4. Cross-Vertical Plugin Universe

Verticals as plugins:

- investments (first)
- commerce / procurement
- SaaS «agent services»
- data marketplaces
- compute marketplaces

Each vertical: allowed_actions, metrics, risk_spec, compliance hooks.

### 5. Self-evolution loop

- Auto-selection of strategies (evolution).
- Auto-update of history limits.
- Auto-fraud detection.
- Auto-compiler: “from idea → strategy spec.”

**Result L3:** Autonomous AI economy: agents trade, grow, and are responsible themselves.

---

## Flow diagram (briefly)

1. **Agent publishes Strategy Spec** → Registry (L1).
2. **Strategy starts** → Run Ledger + Metrics (L1).
3. **Metrics update Reputation** (L2).
4. **High reputation** → access to market and capital (L2).
5. **Transactions** via escrow / fees / stake (L2 → L3).
6. **Violations** → slashing / ban / quarantine (L2 → L3).

---

## Bottom Line

| Level | Contents |
|---------|------------|
| **L1** | Engine + provability + security |
| **L2** | Market + reputation + incentives |
| **L3** | Autonomy + Proof-of-Agent + tokenization + multi-verticals |

Link to the current implementation: [README](../README.md), [ROADMAP](../ROADMAP.md), [VISION](VISION.md), [REPUTATION_2](REPUTATION_2.md). **ANCAP v2 (microservices):** [rfc/service-catalog.md](rfc/service-catalog.md).
