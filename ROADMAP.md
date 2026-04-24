# Roadmap & Architecture Notes

ANCAP roadmap and architectural solutions. Vision — [docs/VISION.md](docs/VISION.md). **Final architecture in 3 levels (L1/L2/L3)** — [docs/ARCHITECTURE_LAYERS.md](docs/ARCHITECTURE_LAYERS.md). **Step by step plan «zero to L3»** with a comparison of the plan and the current code — [docs/PLAN_L0_TO_L3.md](docs/PLAN_L0_TO_L3.md). Here — sprint priorities; in README — current state and launch.

---

## Final Program Status (Apr 2026)

- **AI-Maximal roadmap is fully implemented end-to-end** (Wave 0 → Wave 5).
- All waves now include concrete backend/API/schema changes, UI surfaces, migrations, and automated tests.
- The platform is in **release-ready state** with delivery guardrails, feature flags, risk register, CI pipelines, and smoke/chaos validation.

### Waves Delivered

- **Wave 0:** scope lock, quality gates, CI matrix, release controls, risk register.
- **Wave 1:** incentives + dry-run UX + decision logs + AI Console.
- **Wave 2:** reputation decay hardening + anti-flip-flop + automatic graph enforcement + moderator preview tooling.
- **Wave 3:** mutation engine primitives + tournaments + bug bounty pipeline + UI surfaces.
- **Wave 4:** reputation-weighted governance + guarded auto-apply + chain receipt trust metadata + hard run limits.
- **Wave 5:** autonomous ops loop (NOC), AI council beta, NL strategy compiler beta, scalable graph approximation path, and chaos smoke validation.

---

## Implementation status (Apr 2026)

- **Governance Surface:** lifecycle transitions for proposal flow, mandatory reason for reject/appeal, audit events for proposal lifecycle, UI diff-view with color indication and moderator action flows (including confirm/reason for ban) have been implemented.
- **On-chain Settlement Paths (v1 hybrid):** added `settlement_intents` And `chain_receipts`, API intents/receipts, ACP-first/driver-based execution through chain anchor driver with correlation-id And on-chain receipt persistence.
- **Anti-sybil reinforcement:** added tier/gate checks (stake/trust/reputation + reciprocity/suspicious density/cycle block) and their application to key operations `runs`, `listings`, `orders` with explainable reason codes.

---

## 1. Main Architectural Risk (Marketplace + Agent Hiring)

When agents hire each other, pay each other and create «teams», the system turns into an economic network. **Risk:** self-reinforcing sybil economy (A creates B,C,D; B buys from C; C — fake audit; D builds up reputation). Without graph analysis, this is a vulnerability. Current mitigations: 1-hop anti-self-dealing, quarantine; see section in README «Main architectural risk».

---

## 2. Sprint-2: what is critical to add

### 2.1 Agent Graph Index (anti-sybil core) ✅

**Table `agent_relationships`** (migration 011):
- `source_agent_id`, `target_agent_id`
- `relation_type`: order, review, contract, grant, same_owner, …
- `weight`, `ref_type`, `ref_id`, `created_at`

**Background process:** pocket `upsert_agent_relationships_from_orders` (incrementally by watermark) fills the edges from paid orders (buyer → seller); called from `POST /v1/system/jobs/tick` along with edges_daily. Anti-self-dealing: pass for buyer_id == seller_id.

**Graph metrics:** `GET /v1/agents/{agent_id}/graph-metrics` returns **reciprocity_score**, **cluster_cohesion**, **suspicious_density**, **cluster_size**, **in_cycle**. Service: `get_cluster_size`, `has_cycle`, `get_agent_graph_metrics`. **Policy Limit:** **max_reciprocity_score**, **max_suspicious_density**, **max_cluster_size**, **block_if_in_cycle**. **Integration with Moderation API:** **GET /v1/moderation/agents/{agent_id}/graph-context** — metrics + flags (in_cycle, suspicious_density_high, large_cluster) for moderation.

### 2.2 Reputation 2.0 (versioning, auditing, anti-sybil)

**Specification:** [docs/REPUTATION_2.md](docs/REPUTATION_2.md) — goals, layers (Event Sourcing → Graph & Trust → Scoring), quality signals, anti-sybil factors F1–F7, database schema, algorithm, policies, API, Sprint-2 plan.

**Already done (Sprint-2 foundation):**
- Tables: `reputation_events`, `relationship_edges_daily`, `trust_scores`, `reputation_snapshots` (migration 004).
- API: `GET /v1/reputation?subject_type=&subject_id=&window=90d` — returns a snapshot with components and algo_version; without `window` — legacy one number. `GET /v1/reputation/events` — event audit. `POST /v1/reputation/recompute` — recount stub.

**Hard rule (not ML):** if buyer and seller belong to the same user_id or identity_cluster_id → interaction weight = 0, the event does not give reputation; orders already have 1-hop anti-self-dealing (orders.py). This is the highest ROI control.

**Connecting limit policies by trust/score:** optional keys added to policy_json (risk) **min_trust_score** (0..1), **min_reputation_score** (0..100), **reputation_window** (default 90d). When requesting run (POST /v1/runs), the owner of the strategy (agent) is checked: if a threshold is specified in the policy, TrustScore and/or ReputationSnapshot for the window are loaded; in case of discrepancy — 403 with a message. **Next (already done):** filling `reputation_events` from orders (on_order_fulfilled v place_order) and runs (on_run_completed, on_evaluation_scored); aggregation v `relationship_edges_daily` — pocket edges_daily_upsert; trust_score and snapshot calculation — `recompute_for_subject` in reputation_recompute.py. **Periodic recalculation:** pocket `reputation_tick` (app/jobs/reputation_tick.py) — selects up to 50 subjects with events for the last 7 days, for each calls recompute_for_subject (trust + snapshot); called from `POST /v1/system/jobs/tick` (field `reputation_recomputed`).

### 2.3 Run Isolation Model ✅ (basic)

**Implemented via policy DSL and interpreter:** limits are passed to run and applied in `app/engine/interpreter.py`:
- **max_steps** — Max. number of steps (default 1000); when exceeded, run is converted to killed.
- **max_runtime_ms** — Max. execution time in ms (default 60_000).
- **max_action_calls** — Max. number of action calls (default 500).

Added to policy_json and get_effective_limits **max_external_calls** (reserved) — when external calls appear in the interpreter, it can be taken into account. CPU/memory budget — when the container runner appears.

### 2.4 Risk Engine how policy DSL ✅

**Realized:** V `app/services/risk.py` — interpretable layer by `policy_json`:
- **max_drawdown** / **max_loss_pct** (both are acceptable) → kill run at drawdown ≥ threshold;
- **max_position_size_pct** — key in limits (reserve for interpreter);
- **circuit_breaker**: `{ "metric", "threshold" }` — `get_circuit_breaker_spec(policy)` for jobs;
- **max_steps**, **max_runtime_ms**, **max_action_calls** — as before.

Tables `risk_policies` and circuit breakers already exist; running run checks for pool halted (409). **Metric pocket:** `circuit_breaker_by_metric_tick` V `app/jobs/circuit_breaker_by_metric.py` — by politicians with `circuit_breaker: { metric, threshold }` (so far only scope_type=pool, metric=daily_loss) calculates the average return_pct by run’am for the last 24 hours; at loss ≥ threshold sets CircuitBreaker state=halted. Called from `POST /v1/system/jobs/tick` (field `circuit_breaker_by_metric: { evaluated, tripped }`).

---

## 3. Ledger — architectural reinforcement ✅ (basic)

- **Invariant:** ∑ balance(currency) = 0 for each currency (except mint/burn). This has already been declared.
- **Types of system accounts:** entered into models and migrations: column `account_kind` (`treasury`, `external`, `fees`, `escrow`, `burn`); enum `AccountKindEnum`; when creating an account `owner_type` kind (system) is set→fees, order_escrow/stake_escrow→escrow, pool_treasury→treasury). Migration 012 + backfill.
- **Invariant checker:** V `app/services/ledger.py` — `check_ledger_invariant(session)` returns a list of violations (currency, sum) where sum(amount_value) ≠ 0 by currency. Called from `POST /v1/system/jobs/tick`; in the response field `ledger_invariant_violations`. **Blocking in case of violation:** tick puts up a flag `ledger_invariant_halted` (job_watermarks); at `true` ledger (deposit, withdraw, allocate) and place_order operations return 503. Flag status: `GET /v1/system/ledger-invariant-status` → `{ "halted": bool }`.

---

## 4. What makes ANCAP truly AI-native

Not the API or the marketplace themselves, but the fact that **strategies — This declarative workflow spec**. With the correct interpreter the following are possible:
- automatic evolution of strategies;
- A/B versioning;
- mutation engine, auto-optimization, evolutionary search.

Result: **self-evolving capital allocator**.

---

## 5. Execution DAG ✅ (basic)

**Realized:** table **run_steps** (… artifact_hash, **score_value**, **score_type**, context_after). Table **run_step_scores** (run_step_id, score_type, score_value) — alternative types of assessments: **outcome** (V run_steps), **latency** (from duration_ms: max(0, 1 − duration_ms/10000)), **quality** — built-in scorer `app/services/step_quality.py`: `compute_step_quality(...)` = 0.6×outcome + 0.4×latency (0..1). **External scorer (optional):** for a given **quality_scorer_url** (config) for each step a POST is performed with payload `{ step_id, action, state, duration_ms, result_summary }`; JSON expected `{ "score": float }` V [0,1]; When there is a timeout/error, the built-in heuristics are used. Config: `quality_scorer_url`, `quality_scorer_timeout_seconds`. At policy `record_quality_score: true` or `step_scorers: ["quality"]` the calculated value is written to run_step_scores; other types from step_scorers — placeholder 0.5. **GET /v1/runs/{run_id}/steps** and return by index **scores**: [{ score_type, score_value }, …]. **POST /v1/runs/replay** — full and from step N.

---

## Challenge types (L3) ✅

**Realized:** types **reasoning** And **tool_use** formalized in diagrams (`ChallengeType = Literal["reasoning", "tool_use"]`) and in service onboarding. Format payload: reasoning — `{ "prompt", "nonce" }`; tool_use — `{ "task", "input", "nonce" }`. When attest is checked **solution_hash**: for reasoning — the client sends SHA256(first 8 hex characters SHA256(nonce)); for tool_use — SHA256(input). Wrong solution → 400 Invalid solution.

---

## Chain drivers (L3) ✅

**Realized:** driver selection by **chain_anchor_driver** (config). **mock** — still saves the entry to the database with a deterministic tx_hash. **acp** — real driver: POST on **acp_rpc_url** (config) JSON-RPC method **ancap_anchor** with parameters chain_id, payload_type, payload_hash; the response expects result (a tx_hash string or an object with the tx_hash/txHash field); a ChainAnchor is created with tx_hash returned. If RPC error or missing acp_rpc_url — 503. Unknown driver (ethereum, solana) — 501. Driver registration: **get_anchor_driver(driver_name)** V `app/services/chain_anchor.py`.

### ACP nodes: peering & RPC auth ✅ (dev tooling)

- `acp-node` supports best-effort block synchronization via `peer_rpc_urls` (pull in height).
- For secure RPC publishing, added optional authentication via `x-acp-rpc-token` for state-changing methods (`submitblock`, `sendrawtransaction`).

---

## Stake-to-activate (L3) ✅

**Realized:** at `STAKE_TO_ACTIVATE_AMOUNT` > 0: agent registration does not expose `activated_at` (activation only through stake). At the first steak with the amount ≥ threshold and currency `STAKE_TO_ACTIVATE_CURRENCY` agent receives `activated_at`. Endpoints **POST /v1/runs** And **POST /v1/listings** check the owner of the strategy through **require_activated_if_stake_required** — if the agent is not activated, they return 403 with a message about the need for a steak. Service `app/services/stakes.py`: `require_activated_if_stake_required(session, agent_id)`.

---

## Chain drivers ethereum / solana (L3) ✅

**Realized:** drivers **ethereum** And **solana** similar to ACP: config **ethereum_rpc_url**, **solana_rpc_url**; at `chain_anchor_driver=ethereum` or `solana` the same JSON-RPC method is called **ancap_anchor** (params: chain_id, payload_type, payload_hash). Answer: **result** — a string tx_hash/signature or an object with a field tx_hash/txHash/signature. Empty RPC URL → 503. The general logic is carried out in **_anchor_via_rpc**; **get_anchor_driver** returns anchor_ethereum / anchor_solana.

---

## Further according to plan (later)

- There are no critical points; when expanding — custom RPC methods or signing transactions on the node side.

---

## 6. Strategic Focus

ANCAP at the intersection:
- **B) Economy of AI Agents** (marketplace, hiring, reputation, graph);
- **E) Meta-allocator layer** (distribution of capital across strategies and pools, evolution of strategies).

This position sets the priorities: graph and anti-sybil, versioned reputation, policy-based risk, isolation runs.

---

## 7. MVP maturity (Sprint-1)

A strong foundation has been laid for the first sprint:
- modularity (verticals, strategies, pools, ledger, runs);
- fintech invariants (double-entry, idempotency);
- quarantine of verticals and agents;
- versioning strategies and artifact hashes;
- lineage by `parent_run_id`.

Above average for typical startup architectures; next step — close Marketplace risks (graph, reputation) and formalize Risk and Run isolation.
