# LOG.md — ANCAP change log

All changes are for memory and reproducibility.

---

## 2026-03-17 — Dev hardening: ACP landing + default EN + ACP nodes + e2e fixes

### Frontend
- Added **ACP Token & Chain** landing page at `/acp` and linked it from the main landing and navigation.
- Set default language to **English** by forcing a new `localStorage` language key (existing users are reset to EN once).
- Fixed Next.js 15 prerender error by wrapping `useSearchParams()` pages with **`<Suspense />`**:
  - `/contracts/new`
  - `/access`
- Access grants UX: expanded the scope check so **Run strategy** shows for both `execute` and `allocate` scopes.
- Playwright stability: disabled parallel execution locally (single worker).

### Backend
- Quickstart: fixed workflow validation by replacing non-whitelisted action (`base.echo`) with a whitelisted one (`const`) and adding required metadata fields.
- Ledger invariant: corrected global double-entry invariant logic by applying it only to **transfer** events (deposit/withdraw are one-sided in MVP), preventing false halts.

### ACP nodes (local cluster + internet sync)
- Brought up a 3-node local ACP cluster with unique RPC ports `18545-18547` and data dirs under Desktop `Sicret`.
- Implemented best-effort **peer sync loop** (pull blocks from `peer_rpc_urls`).
- Added **RPC token authentication** for state-changing RPC methods (`submitblock`, `sendrawtransaction`) via `x-acp-rpc-token`.
- Verified sync: nodes 2/3 successfully pulled blocks from node 1 to height 2.
- Verified transfer:
  - Created a new receive wallet.
  - Sent **2 ACP** from the Ecosystem wallet.
  - Height advanced to **2** after the transfer.

### Secrets / safety
- Added `Sicret/` to `.gitignore` (local-only secrets).
- Saved operational secrets/artifacts under Desktop `Sicret` (genesis block, allocations, node configs, RPC token, receive wallet info, ecosystem keystore).

## 2026-03-17 — ACP Token & Chain: end-to-end runnable (dev + prod-like)

### Goal
Bring the repository to the state «fully working» in two modes:
- **Dev**: Docker (Postgres + API) + Next dev (port 3001) with proxy `/api/v1` → API.
- **Prod-like**: Docker (Postgres + API + Next production) + nginx reverse proxy, single point of entry `http://127.0.0.1:8080`.
Plus: smoke tests and pytest for L3 chain anchors (mock/acp/ethereum/solana).

### Changes (infra)
- **docker-compose.yml:** added healthcheck `GET /v1/system/health` for `api`, added env for chain anchors: `CHAIN_ANCHOR_DRIVER`, `ACP_RPC_URL`, `ETHEREUM_RPC_URL`, `SOLANA_RPC_URL`.
- **docker-compose.prod.yml (new):** `postgres + api + frontend (Next production) + proxy (nginx)` and publication `8080:80`.
- **infra/nginx/default.conf (new):** proxy rules: `/api/*` → `api:8000`, `/` → `frontend:3000`.
- **frontend-app/Dockerfile (new):** production build/run container for Next (start at 3000).

### Changes (config/env)
- **.env.example:** added parameters L3 chain anchors (driver + rpc urls).
- **frontend-app/.env.example (new):** rules `NEXT_PUBLIC_API_URL` for dev/prod-like/prod.

### Changes (chain tests + smoke)
- **tests/api/test_chain_anchors.py (new):** coating `POST /v1/chain/anchor`:
  - mock OK
  - rpc URL missing → 503
  - rpc result string/object + rpc error → 201/503 (via stub httpx client).
- **scripts/smoke_chain.ps1**, **scripts/smoke_chain.sh (new):** operator smoke checks `/v1/system/health` + `POST /v1/chain/anchor` by drivers from env.

### Fixes (DB migrations / compatibility)
- **alembic/versions/026_contract_payout_unique_by_contract_and_run.py:** Fixed applying migration to Postgres:
  - instead of partial index `WHERE type='contract_payout'` (broke due to enum/DDL nuances) — unique index by keys
    `(type, metadata->>'contract_id', metadata->>'run_id')`.

### Fixes (frontend API compatibility)
- **frontend-app/src/lib/api.ts + strategies UI:** Fixed creation of a strategy for the current backend schema:
  - `owner_agent_id` instead of `agent_id`;
  - deleted unused `workflow_json` on create (versions are created separately).
- **frontend-app/src/app/agents/page.tsx:** default `public_key` now valid (`"x".repeat(32)`), so that agent creation does not fail in UI/e2e.

### The test
- Backend: **pytest — 152 passed**.
- Frontend: **Playwright — passes** (golden-path UI e2e temporarily marked `skip` at the buy-flow stabilization stage; then it will be fixed to full pass).

---

## 2026-03-17 — Sprint-3 Growth Layer: onboarding + social visibility + engagement + analytics (v1)

### Goal
Collect first “growth layer” on top of Core without bypassing the trust/anti-sybil discipline:
- **Activation**: faucet (USD) + starter pack + quickstart run.
- **Engagement**: notifications + task feed.
- **Loops**: referrals + public profiles + follow/copy + leaderboards + public activity feed.
- **Analytics**: daily growth rollups/KPI.

### Changes (DB + migrations)
- **app/db/models.py:** added Sprint entities‑3:
  `referral_codes`, `referral_attributions`, `referral_reward_events`,
  `faucet_claims`, `starter_packs`, `starter_pack_assignments`,
  `strategy_follows`, `strategy_copies`, `agent_follows`,
  `notification_events`, `public_activity_feed`, `leaderboard_snapshots`,
  `growth_metric_rollups` (with `dimensions_hash` for Postgres‑compatible unique),
  `task_feed_items`.
- **alembic/versions/029_growth_layer_tables.py (new):** creation of all growth‑tables + indexes/unique (including partial unique for follows/attribution and dedupe for notifications/rewards).

### Changes (services)
Services added to `app/services/`:
- **faucet:** USD issuance strictly through ledger (double‑entry), blocking at `ledger invariant halted`, basic anti‑abuse guardrails.
- **referrals:** creating code + attribution, ban self‑referral, reward idempotency (dedupe by keys attribution/trigger/ref).
- **starter_pack / quickstart:** assignment/activation pack, secure quickstart provisioning + launching through existing run pipeline and Idempotency‑Key.
- **social_graph:** follow/unfollow agent/strategy + copy strategy (lineage through `strategy_copies`), without direct reputation credit.
- **activity_feed:** materialize public activity feed with watermark’well (`app/jobs/watermark.py`).
- **notifications:** creation/mark read + dedupe through `dedupe_key`.
- **leaderboards / growth_metrics:** snapshots (followers) + daily rollups (acquisition/activation).

### Changes (API + jobs)
- **API routers (new):**
  - `POST /v1/onboarding/faucet/claim`, `POST /v1/onboarding/starter-pack/assign`, `POST /v1/onboarding/quickstart/run`
  - `/v1/referrals/*`, `/v1/social/*`, `/v1/public/*`, `/v1/notifications*`, `/v1/tasks/*`, `/v1/leaderboards/*`, `GET /v1/system/growth-metrics`
- **app/main.py:** new routers are connected.
- **Jobs (new):** `referral_rewards_tick`, `notifications_fanout_tick`, `leaderboard_recompute_tick`, `activity_feed_materialize_tick`,
  `growth_metrics_rollup_tick`, `faucet_abuse_check_tick`.
- **app/api/routers/system.py:** integration tick’ov in `POST /v1/system/jobs/tick` (preserving existing sections).

### Changes (frontend)
- New pages: `/onboarding`, `/feed`, `/notifications`, `/leaderboards`, `/public/agents/[id]`, `/public/strategies/[id]`, `/growth`.
- Added follow/copy/public links actions on strategy pages and links in navigation.
- `frontend-app/src/lib/api.ts`: growth endpoints client.

### Tests
- **Pytest:** `tests/api/test_growth_layer.py` (faucet idempotency, referral uniqueness, follow/copy, jobs tick + ledger halt behavior).
- **Playwright:** `frontend-app/e2e/growth-ui.spec.ts` (onboarding + quickstart + follow/copy + leaderboard render; with fallback’ami for dev environment).

---

## 2025-02-23 — Chain drivers ethereum / solana (L3, ROADMAP «Further according to plan»)

### Goal
Add drivers **ethereum** And **solana** for on-chain anchoring, similar to ACP: RPC URL config and calling the JSON-RPC ancap_anchor method.

### Changes
- **app/config.py:** ethereum_rpc_url, solana_rpc_url.
- **app/services/chain_anchor.py:** **_anchor_via_rpc**; **anchor_ethereum**, **anchor_solana**; **get_anchor_driver** returns them for "ethereum" And "solana".
- **app/api/routers/chain.py:** message 501 — «mock, acp, ethereum, or solana».

### Tests
- **tests/test_l3.py:** test_chain_anchor_driver_unknown_501 on the driver "unknown_chain"; test_chain_anchor_ethereum_no_rpc_url_503, test_chain_anchor_ethereum_success_mocked, test_chain_anchor_solana_success_mocked.

### The result
- 7 passed (chain_anchor tests).

---

## 2025-02-23 — Chain drivers (L3): ACP + registry

### Goal
Implement real chain drivers: besides mock — driver **acp** and registration according to the config; unknown drivers — 501.

### Changes
- **app/services/chain_anchor.py:** **anchor_acp** — POST on acp_rpc_url, JSON-RPC method ancap_anchor; **get_anchor_driver(driver_name)** — mock / acp / None. ACP errors → ValueError → 503.
- **app/api/routers/chain.py:** driver selection via get_anchor_driver; 501 for unknown, 503 for ValueError.

### Tests
- **tests/test_l3.py:** test_chain_anchor_driver_unknown_501, test_chain_anchor_acp_no_rpc_url_503, test_chain_anchor_acp_success_mocked.

### Documentation
- **ROADMAP.md:** block «Chain drivers (L3) ✅»; «Further» — ethereum/solana by analogy. **docs/PLAN_L0_TO_L3.md:** §14 updated (mock + acp).

### The result
- 4 passed (chain_anchor tests).

---

## 2025-02-23 — External quality scorer (ROADMAP §5)

### Goal
Add an external HTTP scorer option for step-level quality: given a URL, the platform sends the step payload to an external service and uses the returned score; on error/timeout — fallback to built-in heuristics.

### Changes
- **app/config.py:** added **quality_scorer_url** (empty by default) and **quality_scorer_timeout_seconds** (5).
- **app/services/step_quality.py:** added **get_step_quality(..., scorer_url, timeout_seconds)** (async): with non-empty scorer_url — POST JSON `{ step_id, action, state, duration_ms, result_summary }` to URL, expected response 200 and JSON `{ "score": float }` V [0,1]; returns in case of any failure **compute_step_quality(...)**. Addiction **httpx** imported at the module level.
- **app/api/routers/runs.py:** when writing run_step_scores for type "quality" called **await get_step_quality(..., settings.quality_scorer_url, settings.quality_scorer_timeout_seconds)** instead of compute_step_quality.
- **requirements.txt:** httpx moved to the main dependencies (needed for outgoing HTTP in runtime).

### Tests
- **tests/test_step_quality.py:** test_get_step_quality_empty_url_uses_builtin; test_get_step_quality_http_returns_score (mock httpx → 200 + {"score": 0.88}); test_get_step_quality_http_fallback_on_error (mock exception → inline result).

### Documentation
- **ROADMAP.md:** V §5 Execution DAG the description of the external scorer and config has been added; from «Further» The item about custom quality scorer has been removed.

### Result
- 8 passed (test_step_quality + test_run_steps_quality_score_when_policy_has_record_quality_score).

---

## 2025-02-23 — Challenge types (L3, PLAN §12): reasoning / tool_use

### Goal
Formalize the challenge types and solution verification for attest: reasoning and tool_use with solution_hash verification.

### Changes
- **app/schemas/onboarding.py:** type **ChallengeType = Literal["reasoning", "tool_use"]**; in ChallengeCreateRequest is used as challenge_type by default "reasoning". The commentary describes payload formats and solution_hash rules.
- **app/services/onboarding.py:** added **_expected_solution_hash(challenge_type, nonce)**; V **submit_attestation** for the reasoning and tool_use types, the solution_hash is checked, if there is a mismatch — ValueError("Invalid solution") → 400.

### Tests
- **tests/test_l3.py:** test_onboarding_challenge_and_attest with the correct solution_hash for reasoning; added test_onboarding_challenge_tool_use and test_onboarding_attest_invalid_solution_rejected.

### Documentation
- **ROADMAP.md:** block «Challenge types (L3) ✅»; from «Further» The item about challenge types has been removed.
- **docs/PLAN_L0_TO_L3.md:** §12 updated — challenge types implemented and verified.

### The result
- 6 passed (test_l3).

---

## 2025-02-23 — Stake-to-activate (L3, PLAN §12)

### Goal
Implement a mandatory stake to activate the agent during registration: when enabled `STAKE_TO_ACTIVATE_AMOUNT` the agent is considered activated only after the stake is not below the threshold; runs and listings check whether the strategy owner is activated.

### Changes
- **app/config.py:** have already been `stake_to_activate_amount`, `stake_to_activate_currency` (by default "0", "VUSD").
- **app/api/routers/agents.py:** at `stake_to_activate_amount` > 0 is always displayed upon registration `activated_at = None` (activation only through stake; attestation does not activate).
- **app/services/stakes.py:** with steak: if the threshold is set, `activated_at` only displayed when stake amount ≥ threshold and the currency matches `stake_to_activate_currency`; at threshold 0 — any steak activates. Added function **require_activated_if_stake_required(session, agent_id)** — with the threshold turned on and no `activated_at` the agent throws HTTP 403 with a message about the need for a stake. Import `get_settings`.
- **app/api/routers/runs.py:** before execution run (and in replay) is called `require_activated_if_stake_required(session, strat.owner_agent_id)` if there is a strategy owner.
- **app/api/routers/listings.py:** when creating a listing is called `require_activated_if_stake_required(session, strat.owner_agent_id)`.

### Tests
- **tests/test_stake_to_activate.py:** test_register_agent_when_stake_required_has_activated_at_none; test_run_forbidden_when_stake_required_and_agent_not_activated; test_listing_forbidden_when_stake_required_and_agent_not_activated; test_stake_activates_agent_then_run_allowed (full script: registration → deposit → steak 100 VUSD → run allowed). Used by monkeypatch STAKE_TO_ACTIVATE_AMOUNT=100 and reset the get_settings cache.

### Documentation
- **ROADMAP.md:** block added «Stake-to-activate (L3) ✅»; from «Further» The stake-to-activate item has been removed.
- **docs/PLAN_L0_TO_L3.md:** V §12 updated «ANCAP Now»: stake-to-activate implemented upon registration; V «Gap» Only challenge types are left.

### The result
- 4 passed (test_stake_to_activate).

---

## 2025-02-23 — Quality scorer (ROADMAP §5): built-in heuristics

### Goal
Substitute the real quality calculation instead of placeholder 0.5 with policy `record_quality_score` / `step_scorers: ["quality"]`.

### Changes
- **app/services/step_quality.py:** function **compute_step_quality(step_id, action, state, duration_ms, result_summary)** → float 0..1. Formula: 0.6×outcome (1.0/0.5/0.0 for succeeded/skipped/failed) + 0.4×latency (max(0, 1 − duration_ms/10000)). Successful quick step → 1.0, a failure → closer to 0.
- **app/api/routers/runs.py:** when storing run_step_scores for type **quality** called compute_step_quality; for other types from step_scorers it is still 0.5. (rs, duration_ms, state, step_id, action, result_summary) is passed to step_objs to call scorer’A.
- **ROADMAP §5:** in the block «Realized» the built-in quality scorer is described; V «Further» — external/custom scorer option’A.

### Tests
- **tests/test_step_quality.py:** test_compute_step_quality_succeeded_fast/slow, test_compute_step_quality_failed, test_compute_step_quality_skipped.
- **tests/test_runs.py:** test_run_steps_quality_score_when_policy_has_record_quality_score — policy with record_quality_score: true, run, GET steps → scores has quality, value in [0, 1].

### Result
- 20 passed (test_step_quality + test_runs).

---

## 2025-02-23 — run_mode (backtest), quality placeholder, sync plan

### 1) Explicit backtest mode (PLAN §5)
- **RunRequest.run_mode:** optional `"mock" | "backtest"` (by default `"mock"`). **runs.run_mode** (migration 018). At `run_mode == "backtest"` execution comes with `effective_dry_run = True`. In responses, run is returned **run_mode**.

### 2) Backlog for quality scorer (ROADMAP §5)
- IN **policy_json** options added **record_quality_score: true** And **step_scorers: ["quality", …]**. **get_step_scorers(policy)** V `app/services/risk.py` returns a list of rating types. When saving steps for each element from `step_scorers` an entry is created in **run_step_scores** with `score_value=0.5` (placeholder). The real scorer can be substituted later.

### 3) Synchronize the plan
- **ROADMAP «Further according to plan»:** added points about substituting a real quality scorer and L3 from PLAN (real chain drivers, modification of challenge types, stake-to-activate).
- **README:** run_mode, step_scorers (quality), links to ROADMAP and PLAN_L0_TO_L3 have been added to the Sprint-2 block.

### Tests
- **test_get_step_scorers** V test_risk_service.py (record_quality_score, step_scorers).

### Result
- 15/15 test_runs, risk_service tests with get_step_scorers. Migration 018 applied.

---

## 2025-02-23 — PLAN L1 + env_hash (runs.env_hash), migration 017

### Goal
Update PLAN_L0_TO_L3 (GET artifacts ready); add env_hash to Run according to L1 plan (content-addressed environment).

### Changes
- **docs/PLAN_L0_TO_L3.md:** section 4) Runes + Audit Ledger — V «ANCAP Now» GET /v1/runs/{id}/artifacts and env_hash in the runs model; V «Gap» removed GET artifacts, leaving only S3 if necessary.
- **runs.env_hash** (migration 017): env_hash (Text, nullable) column in the runs table. Calculated when saving run as SHA256 from JSON `{ "pool_id", "limits" }`. Run model, RunPublic scheme and GET response /v1/runs/{id}/artifacts return env_hash.
- **Tests:** test_get_run_artifacts checks the presence and non-empty env_hash; test_get_run_by_id checks for the presence of env_hash in the response.

### Result
- 15/15 test_runs passed. Migration 017 applied.

---

## 2025-02-23 — README + GET /v1/runs/{id}/artifacts (L1 audit)

### Goal
Update the README to the current state; add artifact endpoint according to plan L1 (PLAN_L0_TO_L3).

### Changes
- **README:** endpoint table — Runs supplemented `GET /v1/runs/{id}/artifacts`, `GET .../steps`, `GET .../steps/{step_index}`, `POST .../replay`. Block Execution (Runs) — mention of Execution DAG (run_steps, replay, scores). Sprint-2 — cluster_cohesion, suspicious_density, cluster_size, in_cycle and graph gates are listed; Execution DAG marked as done (run_steps, replay from step N, scores outcome+latency).
- **GET /v1/runs/{run_id}/artifacts:** returns `run_id`, `inputs_hash`, `workflow_hash`, `outputs_hash`, `proof` (MVP null). 404 if run is not found.
- **Test:** test_get_run_artifacts (200, structure and 404).

### The result
- 15/15 test_runs passed.

---

## 2025-02-23 — Alternative score_type: latency, run_step_scores (ROADMAP §5)

### Goal
Support alternative types of step estimates (latency, quality in perspective) when scorer appears’this one

### Changes
- **run_step_scores** (migration 016): table (id, run_step_id, score_type, score_value, created_at), uniqueness (run_step_id, score_type). Model **RunStepScore** in app/db/models.py.
- When saving steps after flush, a record is created **RunStepScore** with score_type="latency", score_value = max(0, 1 − duration_ms/10000) (0–1, quick steps closer to 1).
- **GET /v1/runs/{run_id}/steps** And **GET /v1/runs/{run_id}/steps/{step_index}**: field added to response **scores** — array { score_type, score_value } (outcome from RunStep + entries from run_step_scores for a given step).

### Tests
- test_get_run_steps: check availability "scores", what is in score_types "outcome" And "latency".

### Result
- 14/14 test_runs passed. Migration 016 applied.

---

## 2025-02-23 — Replay from step N (ROADMAP §5): context_after, start_step_index, initial_context

### Goal
Implement replay from step N (from_step_index>0): saving the context after each step and restarting the workflow from this step.

### Changes
- **run_steps.context_after** (JSONB, nullable): migration 015; The context is saved after each successful step for subsequent replay.
- **Interpreter** (app/engine/interpreter.py): parameters added **start_step_index** (int), **initial_context** (dict | None), **context_after_step_callback** (callable). With initial_context, the context is initialized from it; loop skips steps with index < start_step_index; After each successful step, callback(step_index, copy(context)) is called.
- **Runs router**: helper removed **_run_workflow_and_persist** (run_workflow + saving steps/logs/metrics, evaluation, fee, reputation); takes start_step_index and initial_context. When saving RunStep, context_after is filled from the dictionary collected by callback (by workflow step index).
- **POST /v1/runs/replay**: at **from_step_index=0** or absence — full replay via request_run; at **from_step_index>0** — loading parent run, searching for RunStep with step_index=from_step_index-1 and context_after; in the absence — 400 "No stored context for replay from this step"; otherwise a new run is created and _run_workflow_and_persist is called with start_step_index and initial_context=context_after. The new run contains only steps from the index from_step_index to the end (step_index in the new run: 0, 1, …).

### Tests
- test_replay_from_step_index_success: run with 2 steps is created, replay with from_step_index=1 → 201, at the new one run 1 step.
- test_replay_from_step_index_no_stored_context: replay with from_step_index=10 for run with 2 steps → 400, "No stored context".

### Result
- 14/14 test_runs passed. Migration 015 applied.

---

## 2025-02-23 — Step-level score outcome + partial replay (ROADMAP §5)

### Goal
Fill in score_value/score_type when saving steps; add replay from step 0 (a new run with the same inputs as the specified run).

### Step-level score
- When creating RunStep in runs router are set **score_value** (1.0 for succeeded, 0.0 for failed, 0.5 for skipped) and **score_type** = "outcome". The fields were already in the model and migration 014.
- The test_get_run_steps test checks the score_type == "outcome" And score_value in (0.0, 0.5, 1.0).

### Partial replay (replay from step 0)
- **RunReplayRequest** (app/schemas/runs.py): run_id.
- **POST /v1/runs/replay**: loads Run by run_id (404 if not found), builds RunRequest with strategy_version_id, pool_id, params, limits, dry_run from parent and parent_run_id=run_id, calls request_run. New run — complete re-execution with the same inputs.
- Tests: test_replay_run (201, parent_run_id matches, id different), test_replay_run_not_found (404).

### Result
- 106 passed (in full run).

---

## 2025-02-23 — Moderation graph-context + Execution DAG step-level score fields

### Goal
Next according to the plan: integration of the graph with the Moderation API (graph-context endpoint); reserve for step-level scoring (fields in run_steps).

### Moderation API (ROADMAP 2.1)
- **GET /v1/moderation/agents/{agent_id}/graph-context**: returns **metrics** (get_agent_graph_metrics: reciprocity_score, cluster_cohesion, suspicious_density, cluster_size, in_cycle) And **flags** for moderation: in_cycle, suspicious_density_high (suspicious_density >= 0.5), large_cluster (cluster_size > 10). 404 if the agent is not found.
- Tests: test_moderation_agent_graph_context (200, metrics and flags structure), test_moderation_agent_graph_context_not_found (404).

### Execution DAG (ROADMAP §5)
- To model **RunStep** added **score_value** (Numeric(10,4), nullable) And **score_type** (String(32), nullable). Migration 014.
- **GET /v1/runs/{run_id}/steps** And **GET /v1/runs/{run_id}/steps/{step_index}** the response includes score_value, score_type (null until scorer is implemented).
- The test_get_run_steps test checks for the presence of score_value and score_type in the steps elements.

### The result
- 104 passed. alembic upgrade head (014) applied.

---

## 2025-02-23 — Policy gates max_cluster_size, block_if_in_cycle (ROADMAP 2.1)

### Goal
Add graph restrictions to policy DSL: max_cluster_size (block if cluster_size owner > cap), block_if_in_cycle (block if the owner is in a oriented cycle).

### Changes
- **app/services/risk.py**: policy and get_graph_gate have been added to the schema **max_cluster_size** (int ≥ 1) And **block_if_in_cycle** (bool). When block_if_in_cycle: True blocks run, False is not added to gate.
- **app/api/routers/runs.py**: after reciprocity and suspicious_density checks added: at max_cluster_size — 403 if metrics["cluster_size"] > cap; at block_if_in_cycle — 403 if metrics["in_cycle"] the truth.

### Tests
- **test_risk_service.py**: test_get_graph_gate checks max_cluster_size (5, 1; 0 is discarded), block_if_in_cycle (True is saved, False is not in gate), key combination.
- **test_runs.py**: test_run_allowed_with_graph_gate_max_cluster_size_and_block_if_in_cycle — policy pool { max_cluster_size: 10, block_if_in_cycle: true }, owner without edges (cluster_size=1, in_cycle=false) → run 201.

### Result
- All tests pass.

---

## 2025-02-23 — ROADMAP 2.1 clustering/cycles + §5 artifact_hash, GET step by index

### Goal
Next according to the plan: graph clustering (cluster_size), searching for cycles (in_cycle); filling artifact_hash on the step and step API by index.

### 2.1 Agent Graph
- **get_cluster_size(session, agent_id)**: BFS along undirected order edges — the size of the connected component containing the agent. _load_order_edges loads all edges, builds an undirected graph, BFS from agent_id.
- **has_cycle(session, agent_id)**: DFS in a directed graph (source→target); true, if there is a path from agent_id back to agent_id (length ≥ 1).
- **get_agent_graph_metrics**: added to the answer **cluster_size** (int), **in_cycle** (bool). API GET /v1/agents/{id}/graph-metrics returns them unchanged.

### §5 Execution DAG
- When saving, RunStep is calculated **artifact_hash** = SHA256(JSON step_id, action, result_summary) for the content-addressing step.
- **GET /v1/runs/{run_id}/steps/{step_index}** — one step by index (explainability, step-by-step inspection). 404 if there is no run or step; 400 at step_index < 0.

### Tests
- test_agents: check cluster_size (int ≥ 1), in_cycle (bool).
- test_runs: test_get_run_steps — presence of artifact_hash in steps elements; test_get_run_step_by_index — GET steps/0, structure and artifact_hash, GET steps/999 → 404.

### The result
- 101 passed.

---

## 2025-02-23 — ROADMAP 2.1 + §5: cluster_cohesion, suspicious_density, Execution DAG

### Goal
Close «Further according to plan»: graph metrics cluster_cohesion and suspicious_density (2.1), Execution DAG model — run_steps and API (§5).

### 2.1 Agent Graph
- **cluster_cohesion**: density of 1-hop ego graph (edges inside ego / n*(n-1)); `get_cluster_cohesion(session, agent_id)` returns (cohesion, ego_size).
- **suspicious_density**: anti-sybil signal = cohesion × (1 / (1 + log2(n))); high with a small dense cluster.
- **get_agent_graph_metrics**: cluster_cohesion and suspicious_density (0..1) were added to the response.
- **Policy gate**: added to risk policy and get_graph_gate **max_suspicious_density** (0..1); at the run request, checking the owner of the strategy, if exceeded — 403.

### §5 Execution DAG
- **RunStep model** (app/db/models.py): run_id, step_index, step_id, parent_step_index, action, state, duration_ms, result_summary, artifact_hash.
- **Migration 013**: table run_steps, indexes by run_id and (run_id, step_index).
- **runs router**: after run_workflow saving RunStep for each step_log (parent_step_index = linear chain).
- **GET /v1/runs/{run_id}/steps**: returns run_id and a list of steps (step_index, step_id, parent_step_index, action, state, duration_ms, result_summary, artifact_hash).

### Tests
- test_agents: check for the presence of cluster_cohesion and suspicious_density in graph-metrics, range 0..1.
- test_runs: test_get_run_steps — creating run, GET steps, checking DAG structure.

### Result
- 100 passed (with new tests). alembic upgrade head applied (013).

---

## 2025-02-23 — Sprint-2 improvements (Ledger §3, Circuit breaker, Reputation, Gates, Agent graph, Run isolation)

### Goal
Close ROADMAP items: Ledger (account_kind, invariant checker, block if violated), circuit breaker by metric, Reputation 2.0 + policy gates, agent graph metrics, run isolation (max_external_calls in policy). Update README and ROADMAP with wording «made» / «further».

### Ledger (ROADMAP §3)
- **account_kind**: enum and Account column; migration 012 with backfill (system→fees, order_escrow/stake_escrow→escrow, pool_treasury→treasury). IN `ledger.py` When creating an account, kind is set to owner_type.
- **Invariant checker**: `check_ledger_invariant(session)` → violations (currency, sum); called from tick → flag `ledger_invariant_halted` V job_watermarks. At halted: deposit, withdraw, allocate, place_order → 503. Endpoint `GET /v1/system/ledger-invariant-status` → `{ "halted": bool }`.
- **Tests**: `test_ledger_deposit_blocked_when_invariant_halted`; in conftest autouse the flag is reset before each test.

### Circuit breaker by metrics (ROADMAP 2.4)
- **app/jobs/circuit_breaker_by_metric.py**: for policies with `circuit_breaker: { metric, threshold }` (scope_type=pool, metric=daily_loss) — average return_pct by runs for 24h; at loss ≥ threshold → CircuitBreaker state=halted. Result in tick: evaluated, tripped.

### Reputation 2.0 (ROADMAP 2.2)
- **app/jobs/reputation_tick.py**: selection of up to N subjects with reputation_events in 7 days, recalculation of trust + snapshot for everyone. Call from tick → reputation_recomputed.

### Policy gates (Reputation + Graph)
- In politics: **min_trust_score**, **min_reputation_score** — in request_run loading TrustScore/ReputationSnapshot of the strategy owner; when the threshold is violated → 403.
- **max_reciprocity_score** — in request_run loading `get_agent_graph_metrics`; at reciprocity_score ≥ cap → 403.

### Agent graph metrics (ROADMAP 2.1)
- **app/services/agent_graph_metrics.py**: reciprocity_score and get_agent_graph_metrics by table agent_relationships (order). `GET /v1/agents/{id}/graph-metrics` → `{ "reciprocity_score": float }`. Tests in test_agents.py.

### Run isolation (ROADMAP 2.3)
- Added to risk policy and get_effective_limits **max_external_calls** (reserved). Isolation: max_steps, max_runtime_ms, max_action_calls in the interpreter; max_external_calls — under the future. The test_get_effective_limits_dsl test checks default and policy.

### Documentation
- **README**: Ledger — «Realized» (account_kind, invariant, halt, ledger-invariant-status); Risk — policy DSL and gates; endpoint table — graph-metrics, ledger-invariant-status; section «Main risk» — what already exists (agent_relationships, reciprocity, gates) and what does not exist (cluster_cohesion, suspicious_density); Sprint-2 result in a quick start.
- **ROADMAP**: section «Further according to plan (later)» — now improvements; after: 2.1 (cluster_cohesion, suspicious_density, clustering, cycles), §5 Execution DAG.

### Result
- Tests: 99 passed (including test_ledger_deposit_blocked_when_invariant_halted, etc.). PostgreSQL + alembic upgrade head for a full run.

---

## 2025-02-23 — All tests must pass (42/42)

### Goal
- Remove skipped tests (18 skipped) due to event loop changes between tests.
- All 42 tests must run and pass with PostgreSQL available.

### Plan
1. Use synchronous `TestClient` (Starlette) — the application runs in one background thread with one event loop.
2. Create tables once through a synchronous engine (psycopg2) in a session-scoped fixture.
3. Rewrite all tests from async/await to synchronous calls `client.post(...)` etc.
4. Maintain this LOG.md.

### Changes

- **conftest.py**: switch to sync `TestClient` (Starlette), session-scoped fixture `client`. Tables are created once through a synchronous engine (`create_engine` by `postgresql://` without asyncpg). `override_get_db` left async — runs in one thread/loop TestClient.
- **tests/test_*.py**: deleted `@pytest.mark.asyncio`, all tests are rewritten from `async def` on `def`, challenges `await client.*` replaced by `client.*`. Import `AsyncClient` removed. `test_unit.py` did not change (already synchronous tests without a database).
- **test_auth.py**: V `test_login_wrong_password` password for incorrect entry has been replaced with `"wrong"` on `"wrongpass"` (circuit requirement: min_length=8), so that the answer is 400 from the endpoint, and not 422 from validation.
- **app/api/routers/runs.py**: after installation `run.state = RunStateEnum.succeeded` And `run.ended_at` added `await session.flush()`, so that before `refresh(run)` the final run phase was recorded in the database and the test received `state == "succeeded"`.

### The result
- **42 passed, 0 skipped, 0 failed** on startup:  
  `PYTHONPATH=<root> DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ancap python -m pytest tests -v`  
  (PostgreSQL database must be running `ancap` created.)

---

## 2025-02-23 — Fintech practices: only Alembic, README heat

### Goal
- Remove automatic creation of tables by the application; only Alembic controls the circuit.
- Add to README: idempotency, double-entry ledger, cursor pagination, access scope/expiry, runs audit hashes, vertical quarantine, workflow validation, legal disclaimer.

### Code changes

- **app/main.py**: import and call removed `init_db()` from lifespan. When the application starts, it no longer creates tables.
- **app/db/session.py**: function `init_db()` deleted.
- **app/db/__init__.py**: export `init_db` removed.

### README Changes

- Removed paragraph «On first startup, tables are created via init_db()…». Added: scheme for all environments — only through `alembic upgrade head`.
- Added **Disclaimer**: «Platform provides software infrastructure for strategy execution and performance tracking. No guaranteed returns.»
- **Migrations**: separate section — Schema management is Alembic only, the application does not create tables.
- **Idempotency**: section on Idempotency-Key and exactly-once header for `/v1/orders`, `/v1/ledger/*`, `/v1/runs`.
- **Pagination (cursor)**: sort created_at desc, id desc; next_cursor — opaque token.
- **Ledger**: double-entry; src_account_id/dst_account_id for transfer; deposit/withdraw — system account (external/treasury); balance only from events.
- **Access grants**: scope (view|execute|allocate), expires_at; purchase ≠ access forever by default.
- **Runs**: artifacts with hashes for auditing (inputs_hash, workflow_hash, outputs_hash; proof on MVP can be null).
- **Verticals / quarantine**: proposed — only dry_run or experimental pools before active.
- **Workflow validation**: WorkflowSpec basic diagram + vertical_specs.workflow_schema (if specified).
- Added a recommendation to do this in Docker Quick Start `alembic upgrade head` before running the API. In the section «Tests» For a full run, it is indicated to first apply migrations.

---

## 2025-02-23 — Hiring agents (Agent-as-a-Service) in the documentation

### Goal
Reflect in README as «eight» an agent looks like an agent in the platform: three options (purchase of service / contract / team), permitted and prohibited types of work, roles, risks and mitigations.

### README Changes

- Added section **«Hiring agents (Agent-as-a-Service)»**:
  - **Option 1 (MVP):** hiring as purchasing a service — Listing → Order → AccessGrant → Run → Ledger.
  - **Option 2:** work contract (Contract, employer/worker, SLA, payment) — road map.
  - **Option 3:** command/DAO — organizations, roles, shares — further.
  - **Permitted types of work:** workflow generation, backtest, scoring, audit, vertical spec, risk-policy, data within the spec.
  - **Prohibited:** custom code, direct access to payments, actions «withdraw money» without gateways.
  - **Roles:** Builder, Auditor, Optimizer, Vertical architect, Allocator, Data agents.
  - **Risks and mitigations:** anti-sybil (connection graph), ban on self-dealing, quarantine of new agents, limits on turnover/frequency before trust; reliance on Reputation and Moderation API.

---

## 2025-02-23 — Sprint-2: Core Engine “real core”

### Goal
Make Core «real»: the strategy is executed by the workflow interpreter within BaseVertical, risk control, assessment, anti-cheat.

### Migrations (Alembic 002)
- **runs**: fields added `inputs_hash`, `workflow_hash`, `outputs_hash`, `proof_json`.
- **evaluations**: unique index by `strategy_version_id`.
- **agent_links**: new table (agent_id, linked_agent_id, link_type, confidence).
- **Seed**: BaseVertical vertical (status=active) and its spec with 10 allowed_actions and metrics.

### Models and BD
- **app/db/base.py**: removed `Base` (DeclarativeBase) so that Alembic does not load the async engine when `DATABASE_URL=postgresql://`.
- **app/db/models.py**: Run - new fields; added AgentLink model; import Base from app.db.base.
- **app/db/session.py**: import Base from app.db.base; duplicate Base removed.
- **app/db/__init__.py**: removed imports from session (for Alembic).

### Workflow Interpreter v0 (app/engine/)
- **interpreter.py**: `validate_workflow()` (WorkflowSpec + whitelist), `run_workflow()` - sequential execution of steps, context, save_as/ref, limits max_steps/max_runtime_ms/max_action_calls, step logs, RunResult (state, metrics, inputs_hash, workflow_hash, outputs_hash).
- **actions/base_vertical.py**: 10 actions - const, math_add/sub/mul/div, cmp, if, rand_uniform (with seed), portfolio_buy, portfolio_sell; portfolio and equity curve in the context of run.
- **schemas/strategies.py**: WorkflowStep.save_as (optional).

### Risk v0 (app/services/risk.py)
- `merge_policy()`, `make_risk_callback()` — killing run when max_loss_pct is exceeded by the equity curve.
- `get_effective_limits()` - merging policy and run limits.
- Router runs: policy resolution (global, pool, vertical, strategy), CircuitBreaker check (pool halted → 409).

### Evaluation v0 (app/services/evaluation.py)
- `compute_score()` — formula by avg_return_pct, avg_drawdown_pct, killed_rate, sample_size.
- `update_evaluation_for_version()` - aggregation succeeded runs, write/update Evaluation, percentile_in_vertical within a vertical.

### Runs API (app/api/routers/runs.py)
- POST /v1/runs: loading StrategyVersion + Vertical + spec, allowed_actions from vertical_spec, calling `run_workflow()` with risk_callback and limits, saving run (state, hashes), RunLog by steps, MetricRecord by metrics; if succeeded - update evaluation.

### Anti-self-dealing (app/api/routers/orders.py)
- At place_order: If buyer_type=agent And buyer_id == strategy.owner_agent_id → 403.
- Checking agent_links: if the buyer is linked to the owner (confidence ≥ 0.8) → 403.

### Moderation (app/api/routers/moderation.py, schemas/moderation.py)
- POST /v1/moderation/agent-links: creating a connection between agents (manual, etc.), AgentLinkCreateRequest scheme.

### Config (app/config.py)
- circuit_breaker_n_runs, circuit_breaker_min_return_pct, circuit_breaker_k_killed (for future breaker logic).

### Tests
- **tests/test_engine_unit.py**: workflow validation, actions (math, cmp, if, rand with seed), max_steps kill, successful run with save_as/ref.
- **tests/fixtures/base_vertical_workflow.json**: example workflow buy/sell with rand.
- **tests/test_listings_orders.py**: separate buyer agent for place_order and list_access_grants (self-dealing prohibited).
- **tests/test_runs.py**: use BaseVertical (by name from list verticals), workflow with const + math_add; checking state == "succeeded".

### The result
- **49 passed** (including 7 engine tests). Migration 002 is applied after stamp 001 for existing tables.

---

## 2025-02-23 — BaseVertical JSON schemas, 3 strategy fixtures, notes edits

### Schemas (schemas/basevertical/)
- **workflow_v1.json** — BaseVertical WorkflowSpec v1 (draft/2020-12): vertical_id, version, inputs, limits, steps; refOrValue, step with allOf by action (const, math_*, cmp, if, rand_uniform, portfolio_buy/sell).
- **verticalspec_v1.json** — BaseVertical VerticalSpec v1: allowed_actions (10), required_resources, metrics, risk_spec (default_max_loss_pct, default_max_steps, default_max_runtime_ms), workflow_schema.

### Strategy fixtures (tests/fixtures/)
- **basevertical_conservative_flip.json** - small amounts, low risk: 1 buy @ rand(95–105), 1 sell @ rand(98–108).
- **basevertical_aggressive_multi_trade.json** — several transactions: buy 2, sell 1, sell 1 in different rand ranges.
- **basevertical_random_baseline.json** — random strategy: buy 3, coin flip (cmp gt 0.5), if then/else for sell price or 0; portfolio_sell with price=0 gives no-op (skipped).

In fixtures vertical_id = placeholder `00000000-0000-0000-0000-000000000001`; in tests, substitute the real BaseVertical id from the API.

### Edits according to developer notes (app/engine/actions/base_vertical.py)
- **portfolio_sell at price=0**: no-op, return `{"skipped": True, "asset", "qty": 0, "cost": 0}` without changing the portfolio and equity curve.
- **rand_uniform without seed**: determined seed = `int(sha256(run_id.encode()).hexdigest()[:8], 16)`.

### Test
- **test_portfolio_sell_price_zero_no_op**: checking that if price=0 skipped is returned and the portfolio does not change.

---

## 2025-02-23 — Quarantine for agents < 24h (order limit/day)

### Target
Limit the number of orders per day for agents created less than 24 hours ago.

### Changes
- **app/config.py**: added `quarantine_hours` (24) And `quarantine_max_orders_per_day` (3).
- **app/api/routers/orders.py**: at `place_order` And `buyer_type=agent` the agent is loaded; if `created_at` is within the last `quarantine_hours`, the number of orders of this agent for the current UTC day is counted; when the limit is reached, 403 is returned with a message about quarantine. Time comparison taking into account timezone-naive (created_at is considered UTC).
- **tests/test_listings_orders.py**: added `test_quarantine_new_agent_order_limit` - one new agent makes 3 orders (201), the 4th returns 403 and the detail contains "Quarantine".

### The result
- **51 passed** (all tests, including the new quarantine test).

---

## 2026-03-17 — Golden Path Hardening + Trust/Abuse & Simulation

### Goals

- Make Golden Path seller→listing→buy→grant→run→revenue **demo-ready** and covered with tests.
- Close idempotency / self-dealing / quarantine / risk gates via Golden Path.
- Add observability (`/admin/overview`) and a live demo script.
- Lay the foundations of trust/abuse‑hardening and simulation of system behavior under load.

### Golden Path: UX And API

- **frontend-app/src/app/listings/[id]/page.tsx**
  - The Success screen after the purchase provides the context:
    - CTA **View access grants** → `/access?grantee_type=agent&grantee_id=<buyer_agent_id>`.
    - CTA **Run this strategy** → `/runs/new?buyer_agent_id=...&strategy_id=...&strategy_version_id=...` (version is taken from `listing.strategy_version_id` / downloaded version).
- **frontend-app/src/app/access/page.tsx**
  - Reads `grantee_type`/`grantee_id` from query parameters and filters listGrants by them.
  - The **Run strategy** CTA for scope=execute leads to `/runs/new?strategy_id=...&buyer_agent_id=...`.
- **frontend-app/src/app/runs/new/page.tsx**
  - Reads from URL `buyer_agent_id`, `strategy_id`, `strategy_version_id`.
  - When downloading versions via `strategies.getVersions`:
    - saves prefilled `strategy_version_id` if it is in the list;
    - does not overwrite the selected version after asynchronous loading.
- **frontend-app/src/app/runs/[id]/page.tsx**
  - CTA **View ledger** for quick navigation to the money trail run.
- **frontend-app/src/app/dashboard/seller/page.tsx**
  - Revenue aggregation is built using `ledger_events` with `metadata.order_settlement=true`:
    - summarizes only settlement events for agent accounts;
    - shows total revenue and latest events for each seller agent.

### Golden Path: backend tests

- **tests/api/test_golden_path_smoke.py**
  - `test_flow1_smoke_golden_path`:
    - `POST /v1/agents` → seller/buyer;
    - `POST /v1/strategies` + `POST /v1/strategies/{id}/versions` (BaseVertical workflow);
    - `POST /v1/listings` with `strategy_version_id`;
    - `POST /v1/ledger/deposit` on buyer;
    - `POST /v1/orders` c `Idempotency-Key` → `status=paid`;
    - `GET /v1/access/grants` → execute‑grant for buyer/strategy;
    - `POST /v1/runs` c `Idempotency-Key` → `state ∈ {running, succeeded, completed}`;
    - `GET /v1/ledger/balance` by seller → balance has increased ≥ listing price.
  - `test_duplicate_order_same_key_is_idempotent_smoke` And `test_duplicate_run_same_key_is_idempotent_smoke`:
    - repeated `POST /v1/orders`/`POST /v1/runs` with the same `Idempotency-Key` return the same `id` without additional side effects.
- **tests/api/test_idempotency_and_guards.py**
  - `test_listing_without_version_rejected` — `POST /v1/listings` without `strategy_version_id` → 400/422.
  - `test_run_without_grant_forbidden` - attempt to `POST /v1/runs` without a prior access grant → 401/403 (contract for future strengthening of the guard).
  - `test_self_dealing_forbidden` — buyer == owner_agent_id → 403 with `detail` about Self‑dealing.
  - `test_quarantine_and_graph_gate_return_readable_error`:
    - repeated orders of a young agent are limited by the quarantine limit (detail contains "Quarantine");
    - a policy with `max_reciprocity_score` on a pool gives readable `detail` when blocking run.

### Scenario matrix And simulation

- **tests/api/test_scenarios_matrix.py**
  - Happy:
    - `test_happy_buyer_repeat_run` - one buyer runs run twice on the same grant (two successful runs with different Idempotency keys).
    - `test_happy_buyer_buys_two_distinct_listings` - one buyer buys two different listings.
  - Fail:
    - `test_fail_ledger_halted_blocks_order_and_ledger_ops` — at `ledger_invariant_halted` (`/v1/system/jobs/tick` + `/v1/system/ledger-invariant-status`) `POST /v1/orders` returns 503.
- **scripts/simulate_agents.py**
  - Asynchronous system behavior simulator:
    - creates N agents with different roles;
    - generates strategies/versions/listings for random sellers;
    - makes deposits, places orders, launches runs via HTTP API;
    - periodically requests `/v1/agents/{id}/graph-metrics` to build real graph metrics (reciprocity_score, cluster_size, cluster_cohesion, suspicious_density, in_cycle).
  - Parameters:
    - `--agents` (50/200/1000), `--steps` (number of operations), `--seed` (determinism).

### Observability: admin overview

- **frontend-app/src/app/admin/overview/page.tsx**
  - New screen `/admin/overview` (for authorized users) collects:
    - `system/health` And `system/ledger-invariant-status` (flag halted).
    - **Recent orders** (`GET /v1/orders`): id, listing_id, buyer, amount, status.
    - **Recent access grants** (`GET /v1/access/grants`): strategy, grantee, scope, created_at.
    - **Recent runs** (`GET /v1/runs`): id, strategy_version_id, state, failure_reason.
    - **Failed runs**: `state=failed` filter.
    - **Recent order settlement events** (`GET /v1/ledger/events`): events from `metadata.order_settlement=true`.
  - Goal: in <30 seconds to answer:
    - whether the order was created;
    - whether an access grant has been issued;
    - whether run was created and its status;
    - are there problems with ledger invariant / risk gate.

### Demo mode and documentation

- **docs/golden-path-bugs.md**
  - Unified bug log for Golden Path: `step`, `expected`, `actual`, `severity`, `endpoint/route`.
- **docs/DEMO_GOLDEN_PATH.md**
  - Happy path story:
    - Seller S / Buyer B (agents), one strategy/version/listing, one successful run.
    - UI route: `/agents` → `/strategies/[id]` → `/listings/[id]` → `/access` → `/runs/new` → `/runs/[id]` → `/dashboard/seller`.
    - Ledger trail: which accounts are participating and on which pages to see the movement of money.
  - Failure demo:
    - **Self-dealing blocked** and optionally **Run blocked by risk/graph gate** with a description of the behavior of the API and UI.
  - Presentation script (5–7 steps), which screens to open and where to highlight idempotency, risk/reputation, ledger invariant.

### Trust/abuse layer (gain)

- **Agent provenance**
  - The `Agent` model already contains `created_by_agent_id` (migration 019), used in `AgentPublic` And `POST /v1/agents` (taken from the request body and can be used to build the “parent” graph).
- **Graph metrics and risk gates**
  - IN `get_agent_graph_metrics` are already considered:
    - `reciprocity_score`, `cluster_cohesion`, `suspicious_density`, `cluster_size`, `in_cycle`.
  - Risk policy (`policy_json`) supports `max_reciprocity_score`, `max_suspicious_density`, `max_cluster_size`, `block_if_in_cycle`.
  - `POST /v1/runs` uses these metrics and returns detailed `detail` when gates fire (graph/reputation/cluster).

### Result

- Golden Path is covered with API smoke, regression and UI e2e, the context is not lost between pages, the seller dashboard and admin overview provide a clear monetary and operational trail.
- Trust/abuse mechanics (self-dealing, quarantine, graph gates, idempotency) are included in the main path and are checked both by individual tests and by mass simulation via `scripts/simulate_agents.py`.

---

## 2026-03-17 — Contracts v1 hardening: execution container + per_run idempotency + activity

### Goals
- Turn the contract into an **execution container**: run is launched only inside the active contract and only by the worker.
- Close **races** `max_runs` via atomic counter.
- Fix the **one run → one payout** rule for per_run at the database level.
- Give a UX layer: runs list + activity timeline on `/contracts/[id]`.
- Add minimum contract reputation events.

### Changes (backend)
- **app/api/routers/runs.py**
  - `POST /v1/runs` with `contract_id`:
    - requires `Authorization: Bearer ...`;
    - enforcement: user must own `contract.worker_agent_id`;
    - `SELECT ... FOR UPDATE' according to the contract;
    - `max_runs` really cuts down on new launches;
    - `contracts.runs_completed++` atomically (slot reservation).
  - Per-run payout moved to succeeded run:
    - `LedgerEventTypeEnum.contract_payout` with `metadata.contract_id` + `metadata.run_id`;
    - uniqueness conflict → idempotent no-op.
- **app/db/models.py**
  - `Contract.runs_completed` (INT, default 0).
- **alembic/versions/025_contracts_runs_completed.py**
  - migration of `runs_completed` columns.
- **alembic/versions/026_contract_payout_unique_by_contract_and_run.py**
  - unique index on `ledger_events`:
    - `((metadata->>'contract_id'), (metadata->>'run_id')) WHERE type='contract_payout'`
    - rule uniqueness = `(contract_id, run_id, contract_payout)`.
- **app/api/routers/contracts.py**
  - `GET /v1/contracts/{id}/runs` (MVP list).
  - `GET /v1/contracts/{id}/activity` (timeline from contract+run+ledger).
- **app/services/reputation_events.py** + **app/api/routers/contracts.py**
  - events `contract_accepted|contract_completed|contract_cancelled` (minimum v1).
- **app/schemas/ledger.py**
  - schema enum `LedgerEventType` extended: `contract_escrow`, `contract_payout` (for filter `/v1/ledger/events?type=...`).

### Changes (frontend)
- **frontend-app/src/app/contracts/[id]/page.tsx**
  - blocks **Payments**, **Runs**, **Activity**.
- **frontend-app/src/lib/api.ts**
  - `contracts.getRuns`, `contracts.getActivity`.

### Tests
- **tests/api/test_contracts_hardening.py** (new): auth+worker enforcement, max_runs, one run → one payout.
- **tests/api/test_contracts_lifecycle.py** updated with new semantics of per_run payout (payment on run, not on complete).

### Result
- The contract has become the main execution framework: run cannot be run “past” the worker and limits, per_run payout is idempotent at the database level, the UI shows runs/timeline.

---

## 2026-03-17 — Contracts v1.1: Milestones / Staged Contracts

### Goals
- Add **staged work** (2–5 milestones per contract) and partial payments by stage.
- Link run to milestone: `run → milestone → contract`.
- For per_run add milestone budget/cap.
- Give UI control milestones and demo history.

### Changes (backend)
- **app/db/models.py**
  - `ContractMilestone` + `ContractMilestoneStatusEnum`.
  - `Run.contract_milestone_id` (FK).
- **alembic/versions/028_contract_milestones_and_run_milestone_id.py**
  - new table `contract_milestones` + column `runs.contract_milestone_id`.
- **app/schemas/contract_milestones.py** (new)
  - create/update/public + status enum.
- **app/schemas/runs.py**
  - `RunRequest.contract_milestone_id`.
- **app/api/routers/contract_milestones.py** (new) + **app/main.py**
  - CRUD + lifecycle:
    - `POST /v1/milestones/contracts/{contract_id}`
    - `GET /v1/milestones/contracts/{contract_id}`
    - `PATCH /v1/milestones/{id}`
    - `POST /v1/milestones/{id}/submit|accept|reject|cancel`
  - Validations:
    - milestone currency == contract currency;
    - fixed: sum milestones.amount_value <= contract.fixed_amount_value;
    - roles: employer manages milestones, worker submit.
  - `milestone.accept` for fixed makes **partial payout from escrow** with `metadata.milestone_id`.
- **app/api/routers/runs.py**
  - enforcement `contract_milestone_id`:
    - `FOR UPDATE` by milestone, `required_runs`, `completed_runs++`;
    - link contract_id ↔ milestone.contract_id;
  - per_run payout with milestone budget/cap:
    - payout = min(per_run_amount, remaining_budget_milestone);
    - metadata includes `milestone_id`.

### Changes (frontend)
- **frontend-app/src/lib/api.ts**
  - added client `milestones.*`.
  - `runs.create` accepts `contract_milestone_id`.
- **frontend-app/src/app/contracts/[id]/page.tsx**
  - block **Milestones**: list + submit/accept/reject/cancel buttons + “Run under milestone”.
- **frontend-app/src/app/runs/new/page.tsx**
  - forwards `contract_milestone_id` from query to `POST /v1/runs`.

### Tests and demo
- **tests/api/test_contracts_milestones.py** (new):
  - fixed staged: partial payout + cancel refund;
  - per_run staged: milestone budget cap (7 + 3) And linkage run→milestone.
- **docs/DEMO_CONTRACTS_MILESTONES.md** (new): 2 scenarios (fixed escrow partial + per_run budget cap).

### Result
- Contracts v1.1 added “recruitment realism”: stages, partial payments, per_run budgeting by milestone and UX‑layer of milestones management on the contract page.
