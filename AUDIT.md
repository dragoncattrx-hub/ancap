#Audit of the ANCAP project

**Date:** February 24, 2025  
**Project:** ANCAP — AI-Native Capital Allocation Platform

---

## 1. Summary

The project is a mature platform for capital distribution with AI agents: FastAPI, PostgreSQL, Alembic, declarative workflow strategies, marketplace, ledger, reputation, L3 (stakes, onboarding, chain anchors). Documentation and development plan (ROADMAP, PLAN_L0_TO_L3, LOG) at a high level. Tests pass (130 passed). Below are structured conclusions and recommendations.

---

## 2. Strengths

### 2.1 Architecture and documentation
- **Clear vision:** README, VISION, ARCHITECTURE_LAYERS, PLAN_L0_TO_L3 - L1/L2/L3 levels and code compliance are described explicitly.
- **Single monolith:** `app/` (api, db, engine, jobs, services, schemas) - a clear structure, without unnecessary fragmentation.
- **Migrations only through Alembic** - the database schema is not created by the application at startup; The fintech approach is followed.
- **Log of changes (LOG.md)** - changes with dates, goals and test results; convenient for onboarding and debugging.

### 2.2 Fintech and security model
- **Double-entry ledger:** append-only events, balance = sum of events; types of accounts (treasury, fees, escrow, burn, external); checking the invariant and stopping operations if violated.
- **Anti-abuse:** anti-self-dealing (1-hop), quarantine of new agents, graph (reciprocity_score, cluster_cohesion, suspicious_density, in_cycle), policy gates (max_reciprocity_score, block_if_in_cycle, etc.).
- **Reputation 2.0:** event sourcing, trust_scores, reputation_snapshots, window and algo_version.
- **Run audit:** inputs_hash, workflow_hash, outputs_hash, env_hash; lineage by parent_run_id; run_steps with context_after And replay from step N.

### 2.3 Stack and dependencies
- **Current versions:** FastAPI 0.115, SQLAlchemy 2.0 (async), Pydantic v2, asyncpg, Alembic.
- **requirements.txt** - fixed versions, separate section for tests (pytest, pytest-asyncio).

### 2.4 Testing
- **130 tests**, all pass (pytest with sync TestClient, one event loop - no skip due to loop).
- Coating: auth, agents, keys, ledger, runs, reputation, moderation, risk, L3 (onboarding, stakes, chain anchors), step_quality, engine unit.
- conftest: single database (alembic upgrade head or create_all + seed BaseVertical), reset ledger_invariant_halted before each test.

### 2.5 Configuration
- **pydantic-settings** from env + `.env`; class `Settings` with reasonable defaults; `get_settings()` with `lru_cache`.
- `.env.example` is - DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, DEBUG are listed.

---

## 3. Notes and risks

### 3.1 Security and secrets (critical for production)
- **SECRET_KEY** by default `"change-me-in-production-use-long-random-string"` - must be redefined via env in production; in docker-compose for the api, `SECRET_KEY: dev-secret-change-in-production` is specified - this is not enough for production.
- **cursor_secret** default `"change-me-cursor-secret"` - used for HMAC in cursor pagination; in production there should be a separate random secret.
- **CORS:** `allow_origins=["*"]` - for production you need to limit domains.
- **POST /v1/system/jobs/tick** - the code states: “In production, protect (e.g. internal only / cron secret)” - protection is not implemented; without this, anyone can pull the tick and affect the watermark/reputation/ledger invariant.

**Recommendations:**  
- In the README or deployment doc, explicitly require the SECRET_KEY, CURSOR_SECRET and CORS limit in production.  
- Add optional header/key check for `/v1/system/jobs/tick` (e.g. X-Cron-Secret from env).

### 3.2 Idempotency (divergence from README)
- The README states: mutable financial and order transactions accept **Idempotency-Key** and guarantee exactly-once for:
  - `POST /v1/orders`
  - `POST /v1/ledger/deposit`, `withdraw`, `allocate`
  - `POST /v1/runs`
- There is **no** processing of the Idempotency-Key header in the code (grep by idempotency / Idempotency-Key in `app/` is empty).

**Recommendation:**  
Either implement the Idempotency-Key technique and save the result by key (with the return of the saved response when repeated), or remove/weaken the wording in the README to “recommended for implementation.”

### 3.3 Versions and warnings
- **alembic.ini:** `sqlalchemy.url` is set by default in ini. In `alembic/env.py` the URL is taken from `get_settings().database_url` (env), so in production an environment variable is used. It makes sense not to commit real passwords to ini and rely on env.
- **Pydantic:** 19 warnings (class-based `config` deprecated, `json_encoders` deprecated) - come from dependencies (pydantic internal), but when your models with `Config` appear, it is better to switch to ConfigDict and the current serialization method.

### 3.4 Infrastructure and Repository
- **.gitignore:** not found in root (only `.pytest_cache/.gitignore` found). It is worth adding a root `.gitignore` with: `.env`, `__pycache__/`, `.venv/`, `*.pyc`, `.pytest_cache/`, `*.egg-info/`, `ACP-crypto/target/`, etc., so as not to commit secrets and artifacts.
- **Git:** the repository is not initialized (No git repo) - for history and CI, it makes sense to initialize git and add CI if necessary (for example, running pytest on push).

### 3.5 Scaling and reliability
- **Queues:** PLAN states “Queue: no” - all operations are synchronous. For heavy jobs (reputation_tick, agent_relationships, circuit_breaker_by_metric, etc.) in the future you may need a queue (Redis/NATS) and workers.
- **S3/artifacts:** large artifact runs are not saved (only hashes); when there are requirements for storing logs/dumps, set up object storage.
- **Rate limiting:** the global rate limit is not visible at the API level - with a public API it is worth considering IP/key limits.

---

## 4. Code structure (briefly)

- **Routers** - in `app/api/routers/`, dependencies via `deps.py` (get_db, get_current_user_id, get_agent_id_from_api_key).
- **Services** — V `app/services/` (ledger, risk, auth, api_keys, reputation, onboarding, stakes, chain_anchor, step_quality etc..).
- **Jobs** - in `app/jobs/` (reputation_tick, circuit_breaker_by_metric, agent_relationships_upsert, edges_daily_upsert, watermark, etc.); launch is centralized via `POST /v1/system/jobs/tick`.
- **Models** - in `app/db/models.py`; enums and connections are carefully defined.
- **Config** - one class in `app/config.py`, without duplicating secrets in the code.

There were no comments regarding gross antipatterns or duplication.

---

## 5. Checklist of recommendations

| Priority | Action |
|-----------|----------|
| Tall | Protect `POST /v1/system/jobs/tick` (internal access or secret). |
| Tall | Implement Idempotency-Key for orders/ledger/runs or adjust the README. |
| Tall | Add root `.gitignore` and don't commit `.env` and artifacts. |
| Medium | In the deployment documentation, record the mandatory change of SECRET_KEY, CURSOR_SECRET and CORS in production. |
| Medium | Check that Alembic in production uses the URL from env (env.py) and not from alembic.ini. |
| Low | Eliminate Pydantic deprecation in their models (ConfigDict, serialization). |
| Low | Consider rate limiting and a queue for background jobs as the load increases. |

---

## 6. Summary

The project is in good condition: a strong architectural foundation, a well-thought-out risk and reputation model, an up-to-date stack, passing tests and useful documentation. The main points of growth are bringing security (tick, secrets, CORS) and idempotency in line with what is stated in the README and preparing for production (git, .gitignore, env for Alembic). After this, the platform is ready for use in a controlled environment and for further development using ROADMAP.
