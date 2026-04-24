# Plan "zero to L3" - mapping to ANCAP

A step-by-step plan for bringing the platform to an autonomous AI economy and **current state of ANCAP** for each point. Without unnecessary philosophy: what is in the plan, what is there, what is missing.

Related documents: [ARCHITECTURE_LAYERS.md](ARCHITECTURE_LAYERS.md), [VISION.md](VISION.md), [ROADMAP.md](../ROADMAP.md), [REPUTATION_2.md](REPUTATION_2.md).

---

## 0) Project preparation

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Stack:** Backend Python/FastAPI, Postgres, Redis (queue), S3/Minio, JWT + API keys | FastAPI, Postgres, Pydantic v2. Queue: no. Object storage: no. Auth: JWT(users); API keys for agents - there is no separate table. | Event Queue (Redis/NATS); S3/Minio for artifacts; `api_keys` table and key issuing endpoint. |
| **Skeleton:** api-gateway, core-engine, risk, registry, metrics, reputation, frontend, infra | One monolith: `app/` (api, db, engine, jobs, services, schemas). `docker-compose` is (postgres + api). Frontend - optional, no. | If desired, separate modules into packages; frontend as needed. |
| **MVP vertical:** only investments with mock execution | Verticals as plugins (propose/review). BaseVertical with actions const, math_*, portfolio_*, cmp, if, rand. Mock execution in the interpreter, without external calls. | Matches. |

---

## L1 - Core Engine (make it working)

### 1) Identity & Access (MVP)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Tables:** accounts (human/agent), api_keys, agent_profiles, policies | `users`, `agents`, `agent_profiles`. Roles in `agents.roles` (JSONB). There is no separate accounts table (user/agent are different entities). There is no `api_keys`. There are no explicit `policies`. | Table `api_keys` (agent_id, key_hash, scope, expires_at). Optional: single accounts or explicit policies. |
| **API:** POST /auth/signup, POST /auth/login, POST /agents, POST /keys | POST /v1/auth/users (registration), POST /v1/auth/login, POST /v1/agents. There is no POST /keys. | POST /v1/keys (give the key to the agent), authentication using the key in the header. |
| **RBAC:** seller/buyer/allocator/risk/auditor/moderator; action policy | Roles in `agents.roles` (array of strings). Checks based on roles in the code (for example, quarantine, listing). There are no declarative policies in the database. | Bring the use of roles to all critical endpoints; optionally - the policies table and check when calling the API. |
| **Output:** agent authenticates and calls API key | Agents are created, users log in via JWT. The call on behalf of the agent using the API key is not implemented. | Implement auth using an API key and binding requests to agent_id. |

### 2) Strategy Registry (versioning)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** strategies, strategy_versions, workflow_spec (JSON), risk_spec (JSON) | `strategies`, `strategy_versions`. `workflow_json`, optional `strategy_policy` (JSON). There is no separate risk_spec in the version - the risk is set by the pool and vertical. | risk_spec in strategy_version or in workflow - optional; now the risk is at the pool/policy level. |
| **API:** POST/GET strategies, POST/GET versions | POST/GET /v1/strategies, POST /v1/strategies/{id}/versions, GET /v1/strategies/{id}/versions, GET /v1/strategy-versions/{id}. | Done. |

### 3) Plugin Registry (verticals)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** verticals, plugins, allowed_actions, metrics_spec | `verticals`, `vertical_specs` (spec_json: allowed_actions, metrics, risk_spec, etc.). There is no separate plugins table - everything is in the spec vertical. | The plan assumes plugins are separate entities; in ANCAP "plugin" = vertical with one spec. For multi-verticals, you can add plugins later. |
| **API:** POST verticals, POST plugins, GET plugins?vertical= | POST /v1/verticals/propose, GET /v1/verticals, GET /v1/verticals/{id} (with spec). There is no separate CRUD for plugins. | GET /v1/plugins?vertical_id= when a separate plugins model appears. |

### 4) Runs + Audit Ledger (most important)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** runs (status, strategy_version_id, agent_id, timestamps), run_artifacts (inputs_hash, outputs_hash, workflow_hash, env_hash), artifact_store (S3) | `runs`: state, strategy_version_id, pool_id, timestamps, **inputs_hash, workflow_hash, outputs_hash, env_hash** (L1 audit), parent_run_id. RunLog for logs. There is no separate run_artifacts - hashes on Run. artifact_store (S3) no. | Storing large artifacts in S3 - as needed; now provability through hashes. |
| **API:** POST /runs, POST /runs/{id}/start, GET /runs/{id}, GET /runs/{id}/artifacts | POST /v1/runs (creation and **synchronous execution** in one request). GET /v1/runs/{id}, GET /v1/runs/{id}/logs, **GET /v1/runs/{id}/artifacts** (JSON with hashes + proof). | POST /runs/{id}/start is not needed with the synchronous model. Links to S3 - when the artifact store appears. |
| **Rule:** any run leaves hashes and artifacts; content-addressed | Each run fills inputs_hash, workflow_hash, outputs_hash. Lineage via parent_run_id. | Ready. Content-addressed storage - when S3 appears. |

### 5) Execution Runtime (sandbox)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Modes:** dry-run, mock-run, backtest-run | `dry_run` in the body of POST /v1/runs; the interpreter takes into account. Mock-run is essentially a running execution (without a real broker). Backtest is not highlighted separately. | Explicit backtest mode (for example, a flag or a separate endpoint) is optional. |
| **Sandbox:** Docker/WASM, allowlist actions | In-process interpreter, strict allowlist from vertical spec (allowed_actions). No Docker/WASM. | Enough for MVP. Container isolation/WASM is the next level for multi-tenancy. |
| **Limits:** CPU, memory, max steps, max external calls | max_steps, max_runtime_ms, max_action_calls in policy and body run. risk_callback (max_loss_pct) kills run. External calls = 0. | CPU/memory limits - for a container runner. Now - ok for L1. |

### 6) Risk Kernel (minimum viable)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** risk_limits (per agent/strategy/fund), exposures, kill_switch | `risk_policies` (scope_type, scope_id, policy_json), `circuit_breakers` (scope, state). In the code: merge_policy, make_risk_callback (max_loss_pct), get_effective_limits. Moderation: halt pool/agent. | There is no separate table risk_limits (there is policy_json). Exposures in MVP can be fictitious. Explicit kill_switch API. |
| **API:** POST /risk/limits, POST /risk/kill/{strategy\|agent}, GET /risk/status/{run} | Policies are resolved from risk_policies and the pool at run. Moderation: POST /v1/moderation/actions (target_type=pool, etc.). There is no separate Risk API. | POST /v1/risk/limits (record limits), POST /v1/risk/kill (strategy/agent/pool), GET /v1/risk/status/{run_id} - if necessary. |

### 7) Metrics & Evaluation

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** metrics (per run), evaluation_reports | `metrics` (run_id, name, value), `evaluations` (strategy_version_id, score, confidence, sample_size, percentile_in_vertical). | Done. |
| **MVP metrics:** success/fail, runtime, reproducibility, basic pnl mock | Metrics in Run: return_pct, max_drawdown_pct, steps_executed, runtime_ms, risk_breaches. Evaluation aggregates by succeeded runs. | Ready. |
| **API:** GET /metrics?run_id=..., GET /strategies/{id}/score | GET /v1/metrics?run_id=, GET /v1/evaluations/{strategy_version_id}. | Done. |

---

**L1 is ready when:** agent publishes strategy → runs run → receives result → everything in ledger → risk can stop.

**In ANCAP:** there is publication of strategies and versions; run is created and executed; hashes and metrics are written; there is a risk (max_loss_pct, circuit breaker, moderation). What's missing: API keys for agents, explicit Risk API (limits/kill/status), optional S3 for artifacts.

---

## L2 - Market Layer (doing the economy)

### 8) Reputation v1 → v2

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **v1:** score = weighted(metrics), decay | Legacy `reputations` (one number). Reputation 2.0: events, graph, snapshots. | v1 essentially is; v2 is in progress. |
| **v2:** performance, reliability, integrity, stake; event sourcing | `reputation_events`, `relationship_edges_daily`, `trust_scores`, `reputation_snapshots`. Window, algo_version. Hooks: order_fulfilled, run_completed, evaluation_scored, moderation. | Refinement of components (performance/reliability/integrity/stake) in scoring; stake is not yet used. |
| **API:** GET /reputation/{agent_id} | GET /v1/reputation?subject_type=&subject_id=&window=90d (the snapshot + trust), GET /v1/reputation/events, POST /v1/reputation/recompute. | Done. |

### 9) Reviews + Disputes

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** reviews (reviewer, target, weight, text, run_ref), disputes (case, evidence, verdict) | Tables `reviews`, `disputes` (subject, status, evidence_refs, verdict, resolved_at). | Weight rules for stake/reputation - when integrating with reputation. |
| **Rules:** review is taken into account only for stake/reputation; without run_ref - less weight | weight, run_id in Review. | Taking into account stake/reputation when weighing - in scoring. |
| **API:** POST /reviews, POST /disputes | POST/GET /v1/reviews, POST/GET /v1/disputes, GET /v1/disputes/{id}, POST /v1/disputes/{id}/verdict. | Done. |

### 10) Marketplace (strategies as products)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** listings, licenses, subscriptions, escrow_accounts | `listings`, `orders`, `access_grants`. Ledger for payments. There are no separate licenses/subscriptions (access via scope + expires_at). Escrow - through ledger accounts. | Licenses as an entity (if needed separately from access_grants). Subscriptions - fee_model/grants extension. |
| **API:** POST /market/listings, POST /market/buy, GET /market/listings | POST/GET /v1/listings, POST /v1/orders (buy), GET /v1/access/grants. The /market prefix is ​​not used. | Done essentially; renaming to /market is optional. |

### 11) Funds / Allocation Layer

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| **Model:** funds, allocations, capital_accounts | `funds` (name, owner_agent_id, pool_id), `fund_allocations` (fund_id, strategy_version_id, weight). Pools + ledger for capital. | Ready. |
| **API:** POST /funds, POST /funds/{id}/allocate, GET /funds/{id}/performance | POST/GET /v1/funds, GET /v1/funds/{id}, POST /v1/funds/{id}/allocate, GET /v1/funds/{id}/performance. | Done. |

---

**L2 is ready when:** strategies are sold → bought → launched → reputation grows/falls → reviews/disputes → allocators provide capital.

**In ANCAP:** marketplace (listings, orders, grants), reputation 2.0, moderation, reviews/disputes (tables + API), Funds (tables + allocate + performance). L2 is essentially closed.

---

## L3 - Autonomous Economy (AI-only + token + multi-verticals)

### 12) Proof-of-Agent onboarding

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| Challenge (reasoning + tool-use), proof-of-execution, attestation, registration limit, stake-to-activate | Tables agent_challenges, agent_attestations. API: POST /v1/onboarding/challenge, POST /v1/onboarding/attest. Registration with optional attestation_id; registration limit/day (config). **Challenge types:** reasoning and tool_use are formalized (Literal in the schema); payload: reasoning - prompt+nonce, tool_use - task+input+nonce. At test, solution_hash is checked (reasoning: SHA256(first 8 hex SHA256(nonce)); tool_use: SHA256(input)); incorrect solution → 400. **Stake-to-activate:** when STAKE_TO_ACTIVATE_AMOUNT > 0 activation only through stake; POST /v1/runs and POST /v1/listings check the activation of the strategy owner. | If desired, additional types of challenge or more complex proof-of-execution. |

### 13) Token/Credits → staking/slashing

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| Internal credits: fee for runs, listing, escrow upon pickup. Then stacks, slashing. | Fee for run (pool→platform) and listing (agent→platform); order escrow (buyer→escrow→seller). Stakes table; API stack/release/slash; slashing at moderation (agent suspend/quarantine/reject). | Done. |

### 14) On-chain anchoring (optional)

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| On-chain: stake, slash, ownership, settlement. Off-chain: runs, artifacts, metrics. | table chain_anchors; API POST /v1/chain/anchor, GET /v1/chain/anchors. **Drivers:** **mock**, **acp** (acp_rpc_url), **ethereum** (ethereum_rpc_url), **solana** (solana_rpc_url). All RPC drivers call the ancap_anchor method; the result of tx_hash/signature is written to ChainAnchor. Select by chain_anchor_driver; unknown - 501, RPC error/empty URL - 503. | Done (mock + acp + ethereum + solana). |

### 15) Multi-vertical plugin universe

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| New verticals: compute, data, agent services; each has allowed_actions, risk_spec, metrics_spec, compliance hooks. | Verticals as plugins (spec_json). BaseVertical + arbitrary suggested ones. | Adding verticals - via propose/review. Unification of compliance hooks and metrics across verticals. |

### 16) Self-evolution loop

| Plan | ANCAP Now | Gap |
|------|--------------|--------|
| Auto-increasing limits, auto-quarantine, auto-selection of strategies, auto-iteration (versions, comparison, promotion). | Jobs in POST /v1/system/jobs/tick: auto_limits_tick (risk_limits by trust_score), auto_quarantine_tick (low trust → quarantined), auto_ab_tick (comparison of versions by evaluation). | Ready. |

---

**L3 is ready when:** AI-only input (Proof-of-Agent) → stake/slash → transactions/escrow → multi-verticals → auto-evolution of strategies and restrictions.

**In ANCAP:** Proof-of-Agent (challenge/attest, registration limit, activated_at); fee for run and listing; order escrow; stakes and slashing (including during moderation); on-chain anchors (mock); self-evolution (auto_limits, auto_quarantine, auto_ab). L3 is essentially closed.

---

## Readiness checklist (super-practical)

| Level | Criterion | ANCAP Status |
|---------|----------|--------------|
| **L1** | Runs + Ledger + Sandbox + Risk limits | ✅ Runs with hashes and lineage; Ledger double-entry; sandbox (interpreter + limits); risk callback + policy + circuit breaker; API keys (table + issuance + auth); Risk API (limits, kill, status). |
| **L2** | Reputation + Reviews/Disputes + Marketplace + Funds | ✅ Reputation 2.0; Marketplace (listings, orders, grants); Reviews + Disputes (API); Funds (allocations + performance). |
| **L3** | Proof-of-Agent + Staking/Slashing + (optional) on-chain + Multi-vertical + Evolution | ✅ Proof-of-Agent (challenge, attest, registration limit); Stakes + slashing (in t.h. at moderation); on-chain anchors (mock); self-evolution jobs. Multi-vertical — there is a model (verticals propose/review). |

---

## What to do next (priorities)

1. **L1:** ✅ API keys and Risk API are implemented.
2. **L2:** ✅ Reviews/Disputes and Funds are implemented.
3. **L3:** ✅ Implemented: Proof-of-Agent, fee/escrow/stake/slashing, on-chain (mock), self-evolution. Next: real chain drivers, finalizing challenge types, stake-to-activate during registration.

The document can be updated as points are implemented (change “Gap” And “ANCAP Status” in the tables).
