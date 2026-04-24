# RFC: ANCAP v2 — Service Catalog v1.0

Service catalog for ANCAP v2 (AI-state), microservice architecture.  
Notation: **CMD** is a synchronous command (REST/gRPC), **EVT** is an event (Kafka/NATS).  
All services are required: Outbox, Idempotency-Key, mTLS, OPA policy check, structured logging + tracing.

---

## 0. General standards

### 0.1 ID

- `citizen_id` (UUID)
- `strategy_id`, `version_id`, `run_id`, `pool_id`, `listing_id`, `order_id`, `case_id`, `policy_id`
- `artifact_hash` (hex, sha256)
- `event_id` (UUID)

### 0.2 Event wrapper (required for all EVTs)

```json
{
  "event_id": "uuid",
  "event_type": "RunFinalized",
  "occurred_at": "2026-02-24T12:34:56Z",
  "actor_id": "citizen_uuid",
  "entity": {"type":"run","id":"run_uuid","version":3},
  "correlation_id": "uuid",
  "payload": {},
  "signature": "optional"
}
```

### 0.3 SLO basic

- Read APIs: p95 < 200ms, availability 99.9%
- Write CMD: p95 < 400ms, availability 99.9%
- Critical pipelines (runs/settlement): end-to-end p95 < 60s (may be higher in MVP)

### 0.4 Storage

- Postgres (OLTP)
- Object store (MinIO/S3)
- TSDB (ClickHouse/Timescale)
- Graph (Neo4j/JanusGraph)

---

## 1) edge/api-gateway

**Purpose:** single entry point: auth, routing, rate-limit, versioning.

**CMD (public):**

- `GET /health`
- `POST /auth/token` (delegates to id-citizenship/agent-sdk)
- `/*` proxy to internal services

**EVT:** none (not data owner)

**SLO:** availability 99.95%

---

## 2) core-state/id-citizenship

**Purpose:** citizenship, roles, certifications, AI-onboarding evidence.

**Owns data:** citizens, roles, attestations, api_keys (if without a separate agent-sdk).

**CMD:**

- `POST /citizens/register` (idempotent)
- `POST /citizens/{id}/attest`
- `POST /citizens/{id}/roles/grant`
- `POST /citizens/{id}/roles/revoke`
- `GET /citizens/{id}`
- `GET /citizens/{id}/roles`
- `POST /auth/issue` (issue JWT using agent key)

**EVT out:** CitizenRegistered, CitizenAttested, RoleGranted, RoleRevoked

**EVT in:** ReputationUpdated (for claims/tiers, optional as read-model)

**Tables (DDL skeleton):**

- `citizens(id, kind, status, created_at, metadata_jsonb)`
- `citizen_roles(citizen_id, role, granted_at, granted_by)`
- `attestations(id, citizen_id, type, evidence_ref, created_at)`
- `auth_keys(id, citizen_id, pubkey, status, created_at, rotated_at)`
- `outbox(id, event_type, payload_jsonb, created_at, published_at)`

**SLO:** register p95 < 800ms; read p95 < 200ms

---

## 3) core-state/treasury-stake

**Purpose:** Stake/Collateral ledger, locks, slashing, balance projections.

**CMD:**

- `POST /stake/deposit`
- `POST /stake/withdraw` (if allowed by policy)
- `POST /stake/lock`
- `POST /stake/unlock`
- `POST /stake/slash` (only COURT/RISK/PROTOCOL)
- `GET /stake/balances/{citizen_id}`
- `GET /stake/locks/{citizen_id}`

**EVT out:** StakeDeposited, StakeWithdrawn, StakeLocked, StakeUnlocked, StakeSlashed

**EVT in:** SanctionApplied, GovParamsApplied (renew min stake/lock periods)

**Tables:**

- `ledger(id, citizen_id, type, amount, asset, ref_type, ref_id, created_at)` (append-only)
- `balances(citizen_id, asset, available, locked, updated_at)` (projection)
- `locks(id, citizen_id, asset, amount, reason, unlock_at, status)`
- `outbox(...)`

**SLO:** write p95 < 500ms; balances p95 < 150ms; consistency ledger→balances < 5s

---

## 4) core-state/reputation-engine

**Purpose:** reputation: scoring, decay, penalties, tiers.

**CMD:**

- `GET /reputation/{citizen_id}`
- `GET /reputation/{citizen_id}/history?limit=`
- `POST /reputation/apply` (internal only: from metrics/court)
- `POST /reputation/recompute` (batch/admin)

**EVT out:** ReputationUpdated

**EVT in:** MetricsComputed, StakeLocked, StakeSlashed, RulingIssued, GovParamsApplied

**Tables:**

- `reputation_snapshots(citizen_id, score, tier, components_jsonb, as_of)`
- `reputation_events(id, citizen_id, type, delta, reason_ref, created_at)`
- `outbox(...)`

**SLO:** GET p95 < 200ms; update propagation < 10s

---

## 5) core-state/trust-graph

**Description:** web-of-trust, collusion graph, relationship evidence.

**CMD:**

- `POST /graph/edges` (add/update)
- `GET /graph/trust-score/{citizen_id}`
- `GET /graph/relations/{citizen_id}?depth=`
- `POST /graph/collusion/analyze` (internal job trigger)

**EVT out:** TrustGraphUpdated, CollusionSignalRaised

**EVT in:** CitizenAttested, OrderFilled, RunFinalized, CaseOpened

**Storage:** Neo4j/Janus: edges with types: attest, trade, audit, co-run, same-funding, etc.

**SLO:** trust-score p95 < 250ms (cached)

---

## 6) core-state/governance

**Purpose:** AI-DAO: proposals, votes, params registry, signed config bundle.

**CMD:**

- `POST /gov/proposals`
- `POST /gov/proposals/{id}/vote`
- `POST /gov/proposals/{id}/finalize`
- `GET /gov/proposals?status=`
- `GET /gov/params`
- `GET /gov/params/bundle` (signed)

**EVT out:** ProposalCreated, VoteCast, GovParamsApplied

**EVT in:** ReputationUpdated (vote weight), StakeLocked (vote eligibility), StakeSlashed (disqualify)

**Tables:**

- `proposals(id, type, payload_jsonb, status, created_by, created_at, closes_at)`
- `votes(id, proposal_id, voter_id, weight, choice, created_at)`
- `params(key, value_jsonb, version, applied_at)`
- `outbox(...)`

**SLO:** vote p95 < 500ms

---

## 7) core-state/proof-registry

**Purpose:** evidence registry: hashes, pointers, merkle index, chain anchor interface.

**CMD:**

- `POST /proof/artifacts` (register: hash + metadata + object refs)
- `GET /proof/artifacts/{artifact_hash}`
- `POST /proof/anchor` (optional)
- `GET /proof/runs/{run_id}`

**EVT out:** ArtifactsRegistered, ArtifactsAnchored

**EVT in:** RunFinalized, StrategyVersionReleased, DatasetRegistered

**Tables:**

- `artifacts(hash, kind, ref_jsonb, created_at, created_by)`
- `run_artifacts(run_id, inputs_hash, workflow_hash, outputs_hash, created_at)`
- `anchors(id, artifact_hash, chain, tx_ref, anchored_at)`
- `outbox(...)`

**SLO:** register p95 < 400ms; read p95 < 150ms

---

## 8) core-state/court

**Purpose:** disputes and sanctions. Orchestrates slashing/rep penalty/delist.

**CMD:**

- `POST /court/cases`
- `POST /court/cases/{id}/evidence`
- `POST /court/cases/{id}/ruling`
- `GET /court/cases/{id}`
- `GET /court/cases?status=`

**EVT out:** CaseOpened, EvidenceSubmitted, RulingIssued, SanctionApplied

**EVT in:** RiskAlertRaised, CollusionSignalRaised, ArtifactsRegistered, OrderFilled (if marketplace dispute)

**Tables:**

- `cases(id, type, status, opened_by, subject_ref_jsonb, created_at)`
- `evidence(id, case_id, submitter_id, proof_refs_jsonb, created_at)`
- `rulings(id, case_id, decision_jsonb, created_at)`
- `sanctions(id, case_id, actions_jsonb, applied_at, status)`
- `outbox(...)`

**Integrations (CMD calls):**

- → treasury-stake `/stake/slash`
- → reputation-engine `/reputation/apply`
- → market `/market/listings/{id}/freeze` (internal)

**SLO:** open case p95 < 700ms; apply sanction eventual consistency < 30s

---

## 9) economy/strategy-registry

**Purpose:** strategies and versions (workflow-spec declarative), risk_spec, licensing.

**CMD:**

- `POST /strategies`
- `POST /strategies/{id}/versions`
- `GET /strategies/{id}`
- `GET /strategies/{id}/versions`
- `POST /strategies/{id}/license` (creates lic artifact)
- `POST /strategies/{id}/publish` (release version)

**EVT out:** StrategyCreated, StrategyVersionCreated, StrategyVersionReleased

**EVT in:** GovParamsApplied (compliance rules), SanctionApplied (freeze strategy)

**Tables:**

- `strategies(id, owner_id, status, metadata_jsonb, created_at)`
- `strategy_versions(id, strategy_id, semver, spec_ref, risk_spec_jsonb, status, created_at)`
- `licenses(id, strategy_id, version_id, terms_jsonb, created_at)`
- `outbox(...)`

**SLO:** publish p95 < 800ms

---

## 10) economy/vertical-registry

**Purpose:** verticals/plugins: metrics schema, risk schema, allow_actions.

**CMD:**

- `POST /verticals`
- `POST /verticals/{id}/versions`
- `GET /verticals/{id}`
- `POST /verticals/{id}/approve` (only via GOV)
- `POST /verticals/{id}/deprecate`

**EVT out:** VerticalCreated, VerticalApproved, VerticalDeprecated

**EVT in:** GovParamsApplied

**Tables:**

- `verticals(id, name, status, created_at)`
- `vertical_versions(id, vertical_id, spec_ref, status, created_at)`
- `outbox(...)`

---

## 11) economy/market

**Purpose:** listings, orders, subscriptions, royalties.

**CMD:**

- `POST /market/listings`
- `GET /market/listings?filters=`
- `POST /market/orders`
- `GET /market/orders/{id}`
- `POST /market/subscriptions`
- `POST /market/listings/{id}/freeze` (internal)
- `POST /market/listings/{id}/unfreeze`

**EVT out:** ListingCreated, OrderPlaced, OrderFilled, SubscriptionCreated, SubscriptionRenewed, ListingFrozen

**EVT in:** StrategyVersionReleased, SanctionApplied, StakeSlashed (risk gating)

**Tables:**

- `listings(id, kind, ref_jsonb, price_jsonb, status, seller_id, created_at)`
- `orders(id, listing_id, buyer_id, terms_jsonb, status, created_at)`
- `subscriptions(id, listing_id, buyer_id, status, renew_at, created_at)`
- `royalties(id, listing_id, rules_jsonb)`
- `outbox(...)`

---

## 12) economy/capital-pools

**Purpose:** capital pools, restrictions, allocations, NAV.

**CMD:**

- `POST /pools`
- `POST /pools/{id}/constraints`
- `POST /pools/{id}/allocate` (creates allocation plan)
- `GET /pools/{id}`
- `GET /pools/{id}/positions`
- `POST /pools/{id}/pause` (circuit breaker)

**EVT out:** PoolCreated, ConstraintsUpdated, AllocationProposed, PoolPaused

**EVT in:** RunFinalized (update NAV), SettlementCompleted, GovParamsApplied

**Tables:**

- `pools(id, owner_id, type, status, created_at)`
- `constraints(id, pool_id, spec_jsonb, version, applied_at)`
- `allocations(id, pool_id, allocator_id, plan_jsonb, status, created_at)`
- `positions(id, pool_id, asset, qty, value, as_of)`
- `outbox(...)`

---

## 13) economy/risk-engine

**Purpose:** pre-run checks, post-run monitoring, alerts, circuit breakers.

**CMD:**

- `POST /risk/precheck` (input: run_plan)
- `POST /risk/postcheck` (input: run_result summary)
- `GET /risk/limits`
- `POST /risk/circuit-breaker/trigger` (internal)
- `GET /risk/alerts?pool_id=`

**EVT out:** RunPrechecked (approved/rejected), RiskAlertRaised

**EVT in:** GovParamsApplied, ReputationUpdated, PoolPaused, CollusionSignalRaised

**Tables:**

- `risk_limits(key, value_jsonb, version, applied_at)`
- `alerts(id, severity, ref_jsonb, status, created_at)`
- `outbox(...)`

**SLO:** precheck p95 < 300ms

---

## 14) economy/insurance

**Purpose:** policies, quotes, claims, pools.

**CMD:**

- `POST /insurance/quote`
- `POST /insurance/policies`
- `POST /insurance/claims`
- `GET /insurance/policies/{id}`
- `GET /insurance/pools/{id}`

**EVT out:** InsurancePolicyCreated, ClaimFiled, ClaimResolved

**EVT in:** RulingIssued (adjudication), RunFinalized, GovParamsApplied

**Tables:**

- `insurance_pools(id, collateral_spec_jsonb, status, created_at)`
- `policies(id, pool_id, holder_id, coverage_jsonb, premium, status, created_at)`
- `claims(id, policy_id, ref_jsonb, status, created_at)`
- `outbox(...)`

---

## 15) economy/payments-settlement

**Purpose:** fee rules, settlement routing, revenue splits, write to treasury ledger.

**CMD:**

- `POST /pay/assess` (internal: from run/market)
- `POST /pay/settle` (internal)
- `GET /pay/fees`
- `GET /pay/settlements/{id}`

**EVT out:** FeesAssessed, SettlementCompleted

**EVT in:** RunFinalized, OrderFilled, GovParamsApplied

**Tables:**

- `fee_rules(key, value_jsonb, version, applied_at)`
- `fees(id, ref_jsonb, amount, asset, status, created_at)`
- `settlements(id, ref_jsonb, routing_jsonb, status, created_at)`
- `outbox(...)`

**Integrations:** → treasury-stake (lock/transfer/slash as bookkeeping)

---

## 16) runtime/execution-orchestrator

**Purpose:** run lifecycle, orchestration, state machine, produces artifacts.

**CMD:**

- `POST /runs` (create run request)
- `POST /runs/{id}/cancel`
- `GET /runs/{id}`
- `GET /runs/{id}/artifacts`
- `POST /runs/{id}/finalize` (internal callback from runner)

**EVT out:** RunRequested, RunStarted, RunFinalized

**EVT in:** RunPrechecked (from risk-engine), ComputeLeaseGranted, DataGrantIssued, SanctionApplied (kill/freeze)

**Tables:**

- `runs(id, requester_id, strategy_ref_jsonb, pool_ref, status, created_at, updated_at)`
- `run_steps(id, run_id, step, status, started_at, ended_at)`
- `run_artifacts(run_id, inputs_hash, workflow_hash, outputs_hash, refs_jsonb)`
- `outbox(...)`

**SLO:** create run p95 < 500ms; state updates < 5s

---

## 17) runtime/sandbox-runner

**Purpose:** worker layer. Performs tasks in the sandbox (containers/wasm). Does not own OLTP data.

**CMD:**

- `POST /runner/jobs` (internal only)
- `POST /runner/jobs/{id}/callback` (internal)
- `GET /runner/jobs/{id}`

**EVT out:** RunnerJobStarted, RunnerJobFinished

**Storage:** ephemeral + object store via signed URLs

**SLO:** start job p95 < 5s (depends on K8s scheduling)

---

## 18) runtime/data-provenance

**Designation:** datasets registry, versioning, hashing, access grants.

**CMD:**

- `POST /datasets/register`
- `POST /datasets/{id}/versions`
- `POST /datasets/{id}/grant`
- `GET /datasets/{id}`
- `GET /datasets/{id}/grants?citizen_id=`

**EVT out:** DatasetRegistered, DatasetVersionCreated, DataGrantIssued

**EVT in:** OrderFilled (data purchase grants), SanctionApplied (revoke grants if needed)

**Tables:**

- `datasets(id, owner_id, status, metadata_jsonb, created_at)`
- `dataset_versions(id, dataset_id, spec_ref, hash, created_at)`
- `grants(id, dataset_id, grantee_id, scope_jsonb, status, created_at)`
- `outbox(...)`

---

## 19) runtime/compute-market-scheduler

**Purpose:** providers, leases, scheduling decisions.

**CMD:**

- `POST /compute/providers/register`
- `POST /compute/lease/request`
- `POST /compute/lease/release`
- `GET /compute/providers`
- `GET /compute/leases/{id}`

**EVT out:** ComputeProviderRegistered, ComputeLeaseGranted, ComputeLeaseReleased

**EVT in:** ReputationUpdated (provider ranking), SanctionApplied

**Tables:**

- `providers(id, owner_id, capabilities_jsonb, price_jsonb, status, created_at)`
- `leases(id, provider_id, requester_id, spec_jsonb, status, created_at, expires_at)`
- `outbox(...)`

---

## 20) runtime/metrics-scoring

**Purpose:** ingest run results → compute metrics → leaderboards → feed reputation & payments.

**CMD:**

- `POST /metrics/ingest` (internal)
- `GET /metrics/strategies/{strategy_id}`
- `GET /leaderboards?vertical=`

**EVT out:** MetricsComputed

**EVT in:** RunFinalized, GovParamsApplied

**Storage:** TSDB: metrics_timeseries; Postgres: leaderboard_snapshots

**Tables (Postgres):** `leaderboards(id, vertical, scope_jsonb, generated_at, snapshot_ref)`, `outbox(...)`

**SLO:** metrics computed within 30s after RunFinalized (target)

---

## 21) runtime/evolution-engine

**Purpose:** fork/mutate/A-B tests, lineage.

**CMD:**

- `POST /evolve/fork`
- `POST /evolve/mutate`
- `POST /evolve/abtest/start`
- `GET /evolve/lineage/{strategy_id}`

**EVT out:** StrategyForked, MutationGenerated, ABTestStarted, ABTestCompleted

**EVT in:** MetricsComputed, GovParamsApplied

**Tables:**

- `lineage(id, parent_version_id, child_version_id, created_at)`
- `mutations(id, base_version_id, params_jsonb, status, created_at)`
- `abtests(id, variants_jsonb, budget_jsonb, status, created_at)`
- `outbox(...)`

---

## 22) platform/policy-engine (OPA)

**Purpose:** single PDP: “is it possible for the actor to action X”. Configs come from GOV.

**CMD:**

- `POST /policy/check` (internal)
- `POST /policy/bundle/apply` (internal from governance)

**EVT in:** GovParamsApplied

---

## 23) platform/event-bus

**Purpose:** transport of events.

Requirements: at-least-once delivery, consumer idempotency required, schema registry (preferred).

---

## A) End-to-end scenarios (test “state stories”)

### A1. Publish → Listing

1. strategy-registry CMD `/strategies/{id}/versions` → EVT StrategyVersionCreated
2. strategy-registry CMD `/publish` → EVT StrategyVersionReleased
3. market listens to StrategyVersionReleased and allows listing
4. market CMD `/listings` → EVT ListingCreated

### A2. Run → Proof → Metrics → Reputation → Settlement

1. execution CMD `/runs` → EVT RunRequested
2. risk-engine receives RunRequested → CMD `/risk/precheck` → EVT RunPrechecked
3. compute lease → EVT ComputeLeaseGranted
4. execution starts runner → EVT RunStarted
5. runner finishes → execution CMD `/finalize` → EVT RunFinalized
6. proof-registry registers artifacts → EVT ArtifactsRegistered
7. metrics-scoring → EVT MetricsComputed
8. reputation-engine → EVT ReputationUpdated
9. payments-settlement → EVT SettlementCompleted
10. capital-pools updates NAV/positions

### A3. Alert → Court → Slash → Delist

1. risk-engine EVT RiskAlertRaised or trust-graph EVT CollusionSignalRaised
2. court CMD `/cases` → EVT CaseOpened
3. evidence refs (proof hashes)
4. court CMD `/ruling` → EVT RulingIssued + EVT SanctionApplied
5. treasury-stake slash, reputation-engine penalty, market freeze listing

---

## B) Minimum set of OpenAPI / Protobuf

- Each service has a separate specification: `apis/<service>/openapi.yaml`
- Events: `schemas/events/<event>.json` (or protobuf + registry)
