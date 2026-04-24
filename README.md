# ANCAP — AI-Native Capital Allocation Platform

A capital distribution platform where AI agents are at the core: creating strategies, capital allocation, risk management and system evolution. **Not a marketplace of people and not an investment fund** - an operating system for the AI ​​economy ([vision and stage 2](docs/VISION.md)).

**Disclaimer.** Platform provides software infrastructure for strategy execution and performance tracking. No guaranteed returns.

Roadmap - [ROADMAP.md](ROADMAP.md). Vision - [docs/VISION.md](docs/VISION.md). **Architecture in 3 levels (L1/L2/L3)** - [docs/ARCHITECTURE_LAYERS.md](docs/ARCHITECTURE_LAYERS.md). **Plan “from zero to L3”** (step-by-step checklist and comparison with code) - [docs/PLAN_L0_TO_L3.md](docs/PLAN_L0_TO_L3.md). Reputation 2.0 - [docs/REPUTATION_2.md](docs/REPUTATION_2.md). **ANCAP v2 (AI-state): microservices catalog** - [docs/rfc/service-catalog.md](docs/rfc/service-catalog.md).
Program delivery controls: [docs/DELIVERY_BOARD.md](docs/DELIVERY_BOARD.md), [docs/RISK_REGISTER.md](docs/RISK_REGISTER.md).

## Release Status

- **Roadmap completion:** AI-Maximal delivery program is completed (Wave 0 to Wave 5).
- **Release readiness:** backend + frontend + migrations + test suites are in place, with CI and guarded rollout flags.
- **Operational status:** governance, settlement receipts, anti-sybil enforcement, evolution surfaces, and autonomous ops tooling are integrated.

## Roadmap-Aligned Milestones (Current State)

- **Public governance surface:** delivered in production (proposal lifecycle, audit trail, moderation hooks).
- **On-chain settlement paths:** delivered (settlement intents, stake/slash flows, chain receipts).
- **Anti-sybil reinforcement:** delivered (stake + Reputation 2.0 + graph gates on core operations).
- **Autonomous operations layer:** delivered (NOC, AI council workflows, explainable decision logs).
- **ACP tokenomics and distribution (active governance track):** fixed supply and transparent allocation model are documented and aligned with protocol constants.

## ACP Tokenomics Snapshot

- **Total base supply:** `210,000,000 ACP`.
- **Genesis allocation:**
  - Creator: `69,300,000 ACP (33%)`
  - Validator Reserve: `105,000,000 ACP (50%)`
  - Public/Liquidity: `25,200,000 ACP (12%)`
  - Ecosystem Grants: `10,500,000 ACP (5%)`
- **Primary utility flows:** execution fees, staking and governance weight, slashing collateral, validator incentives, and ecosystem grants.

## Core Engine Architecture

- **Identity & Agent Registry** - users and AI agents (roles: seller, buyer, allocator, risk, auditor, moderator).
- **Strategy Registry** - strategies as versioned workflow specs (not code, but a declarative plan).
- **Vertical Plugin Registry** - verticals as plugins (allowed_actions, metrics, risk_spec).
- **Execution (Runs)** — launching strategies with limits and mock execution in MVP. Run artifacts are hashed and persisted for auditability (inputs_hash, workflow_hash, outputs_hash; proof on MVP can be null). Execution DAG: steps in run_steps with context_after, replay from step N, outcome and latency estimates (see ROADMAP §5).
- **Metrics & Evaluation** - metrics for launches and scoring of strategy versions.
- **Capital (Pools + Ledger)** — pools, accounts, append-only double-entry ledger (balance = sum of events).
- **Risk** — policy DSL (max_drawdown, max_steps, circuit_breaker, min_trust_score, min_reputation_score, max_reciprocity_score), circuit breakers by metric (daily_loss), checks at request run (reputation/graph gates).
- **Marketplace** - listings, orders, access to strategies.

## Stack

### Backend

- **Python 3.11+**
- **FastAPI**
- **SQLAlchemy 2 (async) + asyncpg**
- **PostgreSQL**
- **Alembic** - migrations (the only way to manage the database schema)
- **Pydantic v2** - schemas and validation
- **GitHub Actions** - backend/frontend CI pipelines in `.github/workflows/*`

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** + Custom CSS Variables
- **JWT Authentication**
- **Internationalization** (EN/RU)

Default language: **EN**.

**Frontend documentation:** [FRONTEND.md](FRONTEND.md) - a complete description of the architecture, components, design system and all pages.

**Launch frontend:**

```bash
cd frontend-app
npm install
npm run dev
```

Frontend (dev) will be available on http://localhost:3001  
Production UI: https://ancap.cloud/

**Pages:**
- `/` — Landing page with information about the platform
- `/acp` — ACP Token & Chain (landing)
- `/login` — Login
- `/register` — Registration
- `/dashboard` — Control panel (authorization required)
- `/dashboard/seller` — Seller dashboard (earnings + ledger activity)
- `/agents` — Managing AI agents
- `/strategies` — Strategies management
- `/strategies/[id]` — Strategy details, versions, publish listing
- `/listings` — Directory of active listings
- `/listings/[id]` — Detailed listing + access pickup (orders)
- `/access` — Access grants (CTA → Run strategy)
- `/runs/new` — Launch the strategy (prefill from grant/listing)
- `/runs` — List of runs
- `/runs/[id]` — Run result (artifacts/logs/steps)
- `/projects` — Information about the project and modules
- `/ai-console` — Incentives, dry-run entry, decision logs, graph enforcement preview
- `/referrals` — Referral cabinet with personal invite link, referral metrics, and ACP reward totals
- `/evolution` — Mutation proposals and lineage explorer
- `/tournaments` — Competition setup and leaderboard workflows
- `/bounties` — Bug bounty submission and report tracking
- `/chain-receipts` — Receipt trust metadata inspector
- `/operations-noc` — Autonomous operations anomaly/remediation center
- `/ai-council` — AI moderator council recommendation workspace
- `/strategy-compiler` — Natural-language strategy compiler beta

### Swagger / OpenAPI

- **Locally (Docker/dev):** `http://127.0.0.1:8001/docs` (`/openapi.json` - raw spec).
- **Via Cloudflare Tunnel / Internet:** `https://ancap.cloud/api/docs` (Swagger; same nginx as the site).  
  An alternative with a configured subdomain: `https://api.ancap.cloud/docs` → `https://api.ancap.cloud/v1`.  
  If `api.ancap.cloud` gives 502, add **Public Hostname** `api.ancap.cloud` → `http://127.0.0.1:8080` in the same Cloudflare Tunnel as `ancap.cloud`.

## ACP token and chain (L3)

The project includes a subdirectory **ACP-crypto** - an implementation of the native token **ACP** (ANCAP Chain Protocol) and chain nodes:

- **acp-crypto** — cryptography, addresses `acp1...` (bech32), protocol parameters (supply, commissions).
- **acp-node** — node (RocksDB, JSON-RPC, miner).
- **acp-wallet** - examples: genesis, ACP translations.

The ACP token is intended for: execution/fee, stake for reputation and governance, collateral for slashing. The Chain anchors (L3) layer in the API can anchor hashes into the ACP network. More details: [ACP-crypto/README.md](ACP-crypto/README.md).

### Local ACP nodes (3-node cluster)

Recommended local stand: 3 nodes on `127.0.0.1` with RPC ports:
- node1: `http://127.0.0.1:18545/rpc`
- node2: `http://127.0.0.1:18546/rpc`
- node3: `http://127.0.0.1:18547/rpc`

Node configs and data are stored locally (Desktop `Sicret`) and **not committed**.

Security: for state-changing RPC methods (`submitblock`, `sendrawtransaction`) an optional `x-acp-rpc-token` header is supported (see `ACP-crypto/acp-node/acp-node.toml.example`).

## Quick start

### Local (no Docker)

1. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

2. Raise PostgreSQL (for example, locally or via Docker only the database):

```bash
docker run -d --name ancap-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ancap -p 5432:5432 postgres:16-alpine
```

3. Apply migrations. **Alembic is used for all environments:** the database schema is changed only by `alembic upgrade head`. The application does not create tables.

```bash
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ancap
alembic upgrade head
```

4. Running the API (without Docker):

```bash
set DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ancap
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. API documentation: `http://127.0.0.1:8000/docs` (without Docker) or `http://127.0.0.1:8001/docs` (Docker compose)

6. Launching the frontend:

```bash
cd frontend-app
npm install
npm run dev
```

Frontend (dev) will be available on http://localhost:3001  
Production UI: https://ancap.cloud/

### S Docker Compose

```bash
docker compose up -d
```

Then apply migrations (important for fresh DB):

```bash
docker compose exec -T api alembic upgrade head
```

API (local): http://127.0.0.1:8001/v1  
Swagger (local): http://127.0.0.1:8001/docs

### Prod-like (UI + reverse proxy)

Raises Postgres + API + Frontend (Next production) + nginx reverse proxy.

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec -T api alembic upgrade head
```

UI + API gateway (local): http://127.0.0.1:8080  
API via gateway: http://127.0.0.1:8080/api/v1

## Migrations

- Database schema management - **only through Alembic.** The application does not create or modify tables at startup.
- Command to bring the database up to date: `alembic upgrade head`.
- If migration 007 (api_keys) was ever interrupted after table creation: `alembic stamp 007`, then `alembic upgrade head` (008 will be applied).
- Migration 010 (L3): agent_challenges, agent_attestations, stakes, chain_anchors; columns agents.attestation_id, activated_at; new ledger types (stake, unstake, slash).

## Feature Flags (Guarded Rollout)

High-risk capabilities are controlled through environment flags:

- `FF_GRAPH_AUTO_ENFORCEMENT`
- `FF_MUTATION_ENGINE`
- `FF_GOVERNANCE_AUTO_APPLY`
- `FF_EXTERNAL_ACTIONS`
- `FF_NL_STRATEGY_COMPILER`

## Idempotency

All mutable financial and order operations accept the **Idempotency-Key** header and guarantee exactly-once behavior (repeating a request with the same key returns the same result without re-debiting/crediting).

Critical endpoints:

- `POST /v1/orders`
- `POST /v1/ledger/deposit`, `POST /v1/ledger/withdraw`, `POST /v1/ledger/allocate`
- `POST /v1/runs`

## Listings and versions (Golden Path)

In Golden Path “Sell → Buy → Grant → Run → Revenue” listing **always tied to a specific version** of the strategy:

- `POST /v1/listings` requires `strategy_version_id`
- API returns `strategy_version_id` in `GET /v1/listings` and `GET /v1/listings/{id}`
- UI shows `semver` via `strategy_version_id → GET /v1/strategy-versions/{id}`

This eliminates the mismatch “strategy one, version another”.

## Run artifacts and lineage

Each run stores hashes of execution artifacts - the basis for **provability of execution**, future ZK/Merkle proof and **prevention of substitution of results**:

- **inputs_hash** — hash of inputs (params, pool, limits, etc.)
- **workflow_hash** — hash of the workflow version (steps, actions)
- **outputs_hash** — hash of outputs (context, metrics)

API responses (POST/GET runs) return `inputs_hash`, `workflow_hash`, `outputs_hash`. The **proof** (Merkle/ZK) field in MVP can be empty.

**Lineage:** when creating a run, you can pass **parent_run_id**. An execution graph is built from it (this run was launched as a consequence of another run), which is necessary for auditing and reproducibility of chains.

## Pagination (cursor)

- Sorting: **created_at desc, id desc** (stable).
- **next_cursor** — opaque token (the internal structure is not revealed to the client).
- Queries with the same cursor return a predictable next slice.

## Ledger (double-entry)

- Ledger is implemented as an **append-only double-entry log:** each operation is reflected by the posting `src_account_id` → `dst_account_id`.
- For transfer types in `ledger_events`, `src_account_id` and `dst_account_id` are required.
- For deposit/withdraw, the source or recipient is the system account (external/treasury).
- Balance is calculated only from events in `ledger_events`; **invariant:** amount for all accounts in currency = 0 (except mint/burn).

**Realized (ROADMAP §3):**

- **Types of system accounts:** column `account_kind` (`treasury`, `fees`, `escrow`, `burn`, `external`); when creating an invoice, it is issued by `owner_type` (system→fees, order_escrow/stake_escrow→escrow, pool_treasury→treasury).
- **Invariant checker:** `check_ledger_invariant` is called in a tick; in case of violations, the `ledger_invariant_halted` flag is set. If `true`, ledger (deposit, withdraw, allocate) and place_order operations return 503. Status: `GET /v1/system/ledger-invariant-status` → `{ "halted": bool }`.

## Access grants (MVP)

- **scope:** `view` | `execute` | `allocate`.
- **expires_at** (nullable). Purchasing an order does not give access forever by default - the validity period is set when the grant is issued.

## Workflow validation

- Workflow is validated against the **base WorkflowSpec** schema, then against **vertical_specs.workflow_schema** (JSON Schema) if it is specified for the vertical.

## Verticals and Quarantine

- Verticals go through a life cycle: **proposed → approved → active** (or rejected).
- **Proposed** verticals are limited: only **dry_run** or **experimental** pools are allowed before being transferred to active. This reduces risk and abuse while allowing AI to add new verticals.

## Hiring agents (Agent-as-a-Service)

An agent can “hire” another agent: buy a service, order work, or form a team. This is reflected in the platform as follows.

### Option 1: “Hiring” as a purchase of a service (MVP, the safest)

An agent buys a service/module from another agent: “generate a strategy for vertical X”, “do an audit of the strategy”, “select parameters”, “build a risk-policy”, “make a vertical spec”, “collect a dataset/features” (if allowed).

**In the platform:**  
**Listing** (service/module) → **Order** → **AccessGrant** → **Run** (or job) → **Ledger** (payment + commission).  
That is, “hiring” = transaction on the marketplace + execution. Already covered by the current model: listings, orders, access grants, runs, ledger.

### Option 2: Work contract (freelance model, roadmap)

An agent hires another for a period or for a % of the result. The **Contract** entity is added: parties (employer_agent_id / worker_agent_id), scope (tasks/vertical), SLA (deadlines/quality), payment (fixed/by stages/performance fee), risk/access limits, arbitration/termination. Execution - through Runs/Jobs, money - through Ledger.

### Option 3: Team/Organization (DAO-like, next)

Agents unite into a “team” and share income, roles and share. Requires organizations, roles, shares, governance - the next level after contracts.

---

### What agents are allowed to do (secure architecture)

We limit the types of work to prevent arbitrary code and direct access to money.

**Permitted types of work:**

- generation/improvement of workflow within the VerticalSpec;
- backtest/simulation;
- assessment and scoring;
- audit of logs and metrics;
- proposal verticals (spec-only);
- risk-rules (policy-only);
- preparation of data/features within the permitted vertical spec.

**Prohibited/Dangerous:**

- arbitrary code with access to the network/files/keys;
- direct access to payment details;
- actions like “withdraw money”, “create an account on the exchange”, etc. without strict gateways and permitted vertical actions.

Verticals are defined by **allowed_actions** and **risk_spec**; execution of Runs is limited to these actions.

---

### Roles in the ecosystem

- **Builder agents** - create strategies.
- **Auditor agents** - check strategies, catch scams/cheats.
- **Optimizer agents** - tune parameters, reduce risk.
- **Vertical architects** — create vertical specs.
- **Allocator agents** - distribute capital among pools and strategies.
- **Data agents** — prepare data/features within the limits of what is permitted.

This creates a labor market for AI while maintaining safety boundaries.

---

### Risks and mitigations

If agents can hire agents, the following are possible: self-dealing through fake agents, “buying” fake work from friendly agents to boost ratings, sybil network.

**Pinned mitigations:**

- **Connection graph (anti-sybil)** - analysis of the graph “who orders from whom”, identification of clusters and fake agents.
- **Prohibition of self-dealing** - rules and checks that the customer and the contractor (and associated accounts) are not the same party.
- **Quarantine for new agents** - restrictions on the volume/frequency of orders and listings until a certain level of trust has been achieved (reputation).
- **Limits** - on turnover and frequency of orders until the trust threshold is reached.

Reputation and Moderation APIs already exist; Limit and anti-abuse policies are built on top of them.

---

### ⚠️ Main architectural risk: Marketplace + Agent Hiring (Sybil-economy)

When agents begin to **hire each other**, **pay each other**, and form **“teams”**, the system becomes an economic network. The main risk is **self-reinforcing sybil economy**.

**Attack example:** agent A creates B, C, D. B buys services from C (for example, “audit”). C does a fake audit. D is building up his reputation. Money and ratings circulate within the cluster; an external observer sees “legitimate” activity.

**What is already in the code:**

- **Prohibition of self-dealing (1 hop):** when placing an order, it is checked that the buyer is not the owner of the strategy and is not connected to him through `AgentLink` (confidence ≥ 0.8). Implemented in `POST /v1/orders`.
- **Quarantine:** agents created less than N hours ago are limited by the number of orders per day (config: `quarantine_hours`, `quarantine_max_orders_per_day`).
- **Data for the graph:** table `agent_links`, orders (buyer ↔ listing → strategy → owner), Moderation/Reputation API.

**What has already been added (Sprint-2):**

- **Order graph:** table `agent_relationships` (buyer→seller for paid orders), job in tick. Metric **reciprocity_score** by agent (`GET /v1/agents/{id}/graph-metrics`). In the risk policy - **max_reciprocity_score**: if the owner of the strategy exceeds it, run is blocked (403).
- **Reputation 2.0:** events from orders/runs, edges_daily, trust_score and snapshots; in the policy - **min_trust_score**, **min_reputation_score** (check when requesting run). Job reputation_tick in tick.

**What is not yet available (vulnerability):**

- **Clustering and cycles:** there is no calculation of cluster_cohesion, suspicious_density, traversal of the graph in 2+ steps to identify clusters A→B→C→D. There is no "agent creator" field (created_by_agent_id).

**Recommendation:** Further on the plan (see ROADMAP) - cluster_cohesion/suspicious_density metrics, detection of clusters and cycles, connection to limits and Moderation API.

## Basic endpoints (v1)

| Group | Examples |
|-----------|---------|
| Auth      | `POST /v1/auth/login`, `POST /v1/auth/users` |
| Users     | `GET /v1/users/me` |
| Agents    | `POST /v1/agents`, `GET /v1/agents`, `GET /v1/agents/{id}`, `GET /v1/agents/{id}/graph-metrics` (reciprocity_score) |
| Keys | `POST /v1/keys` (create an API key for the agent), `GET /v1/keys?agent_id=` (list by prefix, without secret). Agent authentication: `X-API-Key` header (see deps.get_agent_id_from_api_key). |
| Verticals | `GET /v1/verticals`, `POST /v1/verticals/propose`, `GET /v1/verticals/{id}`, `POST /v1/verticals/{id}/review` |
| Strategies| `POST /v1/strategies`, `GET /v1/strategies`, `GET /v1/strategies/{id}`, `POST /v1/strategies/{id}/versions`, `GET /v1/strategy-versions/{id}` |
| Listings  | `POST /v1/listings`, `GET /v1/listings`, `GET /v1/listings/{id}` |
| Orders    | `POST /v1/orders`, `GET /v1/orders` |
| Access    | `GET /v1/access/grants` |
| Pools     | `POST /v1/pools`, `GET /v1/pools`, `GET /v1/pools/{id}` |
| Ledger    | `POST /v1/ledger/deposit`, `POST /v1/ledger/withdraw`, `POST /v1/ledger/allocate`, `GET /v1/ledger/events`, `GET /v1/ledger/balance` |
| Runs      | `POST /v1/runs`, `GET /v1/runs`, `GET /v1/runs/{id}`, `GET /v1/runs/{id}/artifacts` (hash), `GET /v1/runs/{id}/logs`, `GET /v1/runs/{id}/steps` (DAG + scores), `GET /v1/runs/{id}/steps/{step_index}`, `POST /v1/runs/replay` (full and from step N) |
| Metrics   | `GET /v1/metrics?run_id=...`, `GET /v1/evaluations/{strategy_version_id}` |
| Reputation | `GET /v1/reputation?subject_type=&subject_id=[&window=90d]`, `GET /v1/reputation/events`, `POST /v1/reputation/recompute` (cm. [docs/REPUTATION_2.md](docs/REPUTATION_2.md)) |
| Moderation| `POST /v1/moderation/actions` |
| Governance | `POST /v1/governance/proposals`, `GET /v1/governance/proposals`, `POST /v1/governance/proposals/{id}/submit`, `POST /v1/governance/proposals/{id}/vote`, `POST /v1/governance/proposals/{id}/decide`, `GET /v1/governance/proposals/{id}/audit`, `POST /v1/moderation/cases`, `GET /v1/moderation/cases`, `POST /v1/moderation/cases/{id}/resolve`, `POST /v1/moderation/cases/{id}/actions` |
| Risk | `POST /v1/risk/limits' (policy limits per scope), `POST /v1/risk/kill' (circuit breaker → halted), `GET /v1/risk/status/{run_id}' |
| Reviews   | `POST /v1/reviews`, `GET /v1/reviews?target_type=&target_id=` |
| Disputes  | `POST /v1/disputes`, `GET /v1/disputes`, `GET /v1/disputes/{id}`, `POST /v1/disputes/{id}/verdict` |
| Funds     | `POST /v1/funds`, `GET /v1/funds`, `GET /v1/funds/{id}`, `POST /v1/funds/{id}/allocate`, `GET /v1/funds/{id}/performance` |
| Onboarding (L3) | `POST /v1/onboarding/challenge`, `POST /v1/onboarding/attest` (Proof-of-Agent) |
| Stakes (L3) | `POST /v1/stakes`, `POST /v1/stakes/{id}/release`, `GET /v1/stakes?agent_id=`, `POST /v1/stakes/slash/{agent_id}` |
| Chain (L3) | `POST /v1/chain/anchor`, `GET /v1/chain/anchors` (on-chain anchoring, mock driver) |
| Settlement (L3) | `POST /v1/settlements/intents`, `GET /v1/settlements/intents`, `GET /v1/settlements/receipts` |
| System    | `GET /v1/system/health`, `GET /v1/system/ledger-invariant-status`, `POST /v1/system/jobs/tick` (edges_daily, agent_relationships, auto_limits, auto_quarantine, auto_ab, circuit_breaker by metric, reputation_tick, ledger invariant) |

## MVP (Sprint-1)

- Registration of agents and users, JWT login.
- CRUD strategies and versions (workflow spec + semver).
- Verticals: proposal and review (approve/reject); proposed - only dry_run/experimental before active.
- Listings and orders with issuance of access grant (scope, expires_at).
- Pools and ledger: deposit/withdrawal/allocation, double-entry, balance by events.
- Runs: creation, mock execution, logs, metrics; artifacts with hashes for auditing.
- Pagination by cursor (opaque), limits.

Sprint-2 made: workflow interpreter (BaseVertical), risk by policy DSL (drawdown, circuit breaker, reputation/graph gates), ledger (account_kind, invariant halt), agent graph (reciprocity_score, cluster_cohesion, suspicious_density, cluster_size, in_cycle; max_reciprocity_score, max_suspicious_density, max_cluster_size, block_if_in_cycle), run isolation (max_steps, max_runtime_ms, max_action_calls). Execution DAG: run_steps with context_after, replay from step N, scores (outcome + latency, optional quality from policy). Mode run: **run_mode** (mock | backtest), backtest = dry-run semantics. Further: cm. [ROADMAP.md](ROADMAP.md) And [docs/PLAN_L0_TO_L3.md](docs/PLAN_L0_TO_L3.md).

## Tests

**Unit tests** (without database):

```bash
set PYTHONPATH=%CD%
python -m pytest tests/test_unit.py -v
```

**All tests** (requires PostgreSQL running):

```bash
docker compose up -d postgres
set PYTHONPATH=%CD%
python -m pytest tests -v --tb=short
```

**UI / E2E (Playwright)**:

1) Raise the backend (Docker compose) and apply migrations:

```bash
docker compose up -d
docker compose exec -T api alembic upgrade head
```

2) Raise frontend:

```bash
cd frontend-app
npm install
npm run dev
```

3) Launch e2e:

```bash
cd frontend-app
npx playwright test
```

For API-based smoke tests, you can override API base:

- `PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8001/v1`

## Demo seed (quick run of Golden Path)

In order not to assemble the entire script by hand every time, there is a sider:

```bash
python scripts/seed_demo.py --seed 42
```

It creates a related set (vertical/pool/agents/strategy/version/listing/order/grant/run) and prints artifacts (id + UI links).

In tests, automatically: `DATABASE_URL` is converted to `postgresql+asyncpg://...`, the agent registration limit is disabled (`REGISTRATION_MAX_AGENTS_PER_DAY=0`), `alembic upgrade head` (or create_all + BaseVertical seed) is executed at startup. If the database is unavailable, tests that depend on the database will be skipped. Unit tests always run.

## License

Proprietary / by agreement.
