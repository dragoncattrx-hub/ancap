# ANCAP Master Roadmap

> Status: active | Major revision: 2026-05-25
> Created: 2026-05-23 | Last updated: 2026-05-26
> Owner: ARDO
> Rule: execute top-to-bottom by priority. Everything must be either DONE, in progress, intentionally deferred, or replaced by a better approved plan.
> Source of truth: this is the only execution-priority roadmap. `PRODUCTION_ROADMAP.md`, `ROADMAP.md`, `ROADMAP-MONETIZATION.md`, and `docs/mobile/ROADMAP.md` are supporting or historical documents and must not override this file.
> Fast status index: `docs/STATUS_MATRIX.md`

---

## Consolidated project goals

Ship ANCAP as a production ACP-first AI workflow platform:
- real paid AI workflow execution
- proof receipts and realtime status
- creator + developer monetization
- stable production UI/admin surfaces
- reliable bridge and wallet infrastructure
- completed ACP mobile wallet MVP
- hardened CI/CD and security automation
- operational stability for real-money flows

## Current top-line truth (2026-05-25)

The biggest remaining tails are:
1. security / CI / prod-hardening
2. finishing the ACP mobile wallet to a real device-ready release state
3. deepening monetization after the first ACP-first revenue loop

Important: some older roadmap documents still read as more complete than the repo-wide execution truth. When there is any conflict, trust this file.

## Fixed decisions

- Primary LLM: Teneta/Claude-compatible Anthropic API
- Payments: ACP-first. Stripe/fiat is a later adapter after ACP checkout is stable.
- Fallback policy: template output is allowed only as explicit degraded fallback, never as a hidden premium LLM result.
- AI governance: tracked in \docs/AI_ISO_GOVERNANCE_NOTES.md\
- Public trust layer: whitepapers, terms, privacy, cookie consent published before broader paid acquisition
- CI rule: no \|| true\ soft-fails. A failing gate must fail the build.
- Open-source positioning rule: **ANCAP will be open-source where transparency increases trust, integration and adoption — while security-critical infrastructure, private keys, bridge signer operations, wallet hot-key logic and production secrets remain protected.**

## Open Source & GitHub Transparency

Status: [~] Active execution track. The public GitHub repo already exists, but the project still needs the full GitHub-first foundation, clearer public-safe scope boundaries, stronger repo governance, and a cleaner split between publishable components and sensitive operational infrastructure.

Goal:
- increase trust in ACP / wACP;
- make the project publicly auditable and easier to verify;
- simplify developer integrations;
- attract external contributors;
- prepare the project for audits, grants, listings, and partnerships.

Critical boundary:
- publish what improves trust, integration, and adoption;
- do **not** publish private keys, seed phrases, bridge signer internals, admin wallets, production `.env`, deploy secrets, hot-wallet operation logic, real RPC/API keys, or sensitive anti-fraud internals that would make abuse easier.

Reference detail: `docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md`

### Phase 1 — GitHub Public Foundation

Execution targets:
- create a public GitHub org (`ANCAP` or `ancap-network`) when ownership/naming is finalized;
- keep the main project repo public-safe and contributor-ready;
- add `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md`;
- add public docs for architecture, roadmap, API, ACP/wACP, and trust/security boundaries;
- add GitHub issue templates and a PR template;
- enable GitHub secret scanning, push protection, Dependabot, CodeQL, and branch protection.

### Phase 2 — Open Source Scope

Safe-to-open scope:
1. Core documentation
   - roadmap
   - architecture docs
   - tokenomics docs
   - ACP / wACP explanation
   - bridge concept
   - wallet feature docs
   - security model
   - API overview
2. Frontend
   - public site
   - wallet UI without production secrets
   - landing pages
   - docs UI
3. SDK / integration layer
   - TypeScript SDK
   - API client
   - examples
   - payment QR parser
   - wallet integration examples
4. Smart contracts / token contracts
   - wACP BEP-20 contract
   - bridge-related public contracts
   - verification scripts
   - testnet deployment instructions
5. Protocol specs
   - ACP decimals
   - ACP ↔ wACP conversion rules
   - bridge reserve model
   - transaction receipt model
   - payment intent model
   - QR Pay spec
   - Smart QR Pay flow

Explicitly private scope:
- private keys
- seed phrases
- bridge signer private logic
- admin wallets
- production `.env`
- real RPC/API keys
- exchange/listing accounts
- deployment secrets
- server credentials
- abuse-sensitive operational thresholds that should not be public

### Phase 3 — Repository Structure

Target public structure after the current monorepo hardening phase:
- `ancap-docs` — public documentation, roadmap, whitepaper, architecture, tokenomics
- `ancap-web` — public website and landing frontend
- `ancap-wallet` — mobile/web wallet interface and Smart QR Pay UI
- `ancap-sdk` — TypeScript SDK for ACP / wACP integrations
- `ancap-contracts` — wACP contract, bridge public contracts, deployment scripts
- `ancap-examples` — merchant/payment/API/QR integration examples
- `ancap-core` — publishable protocol components safe for public review

Private target repos:
- `ancap-infra`
- `ancap-bridge-operator`
- `ancap-admin`

### Phase 4 — Licensing

Default licensing direction:
- Apache-2.0 for core / protocol / SDK / contracts
- MIT for frontend / examples when frictionless adoption matters more
- CC BY 4.0 or Apache-2.0 for docs, depending on repo split

Current repo decision:
- this mixed monorepo defaults to **Apache-2.0** until the codebase is split into dedicated public repos with component-specific licensing if needed.

### Phase 5 — GitHub Security Baseline

Before publishing any additional repo or public split:
- remove `.env`, private keys, mnemonics, tokens, and RPC keys;
- keep `.env.example` only;
- check git history for secrets;
- enable GitHub secret scanning + push protection;
- enable Dependabot + CodeQL;
- block direct pushes to the default branch;
- require review before merge;
- define revoke/rotate procedure for leaked credentials;
- publish `SECURITY.md` and responsible disclosure instructions.

### Phase 6 — Public Transparency for ACP / wACP

Public docs must explain:
- what ACP is;
- what wACP is;
- why wACP exists on BSC;
- how ACP → wACP works;
- how wACP → ACP works;
- decimals and conversion rules;
- reserve/backing model;
- fee model;
- bridge risks;
- official contract addresses;
- scam/fake contract warnings;
- how users verify contracts and transactions.

### Phase 7 — Community Contribution Model

Community baseline:
- GitHub Issues for bug reports and feature requests;
- GitHub Discussions for ideas and technical questions;
- label system (`good first issue`, `help wanted`, `security`, `wallet`, `bridge`, `docs`, `sdk`, `contracts`, `frontend`);
- contributor guide;
- public roadmap board;
- monthly development update;
- changelog;
- release notes.

### Phase 8 — GitHub as Trust Layer

GitHub should function as public proof that ANCAP is a live technical project.

Publish and maintain:
- roadmap progress
- commits
- releases
- smart contract source code
- SDK updates
- security updates
- audit preparation
- integration examples
- public issues
- public milestones

### Immediate execution queue — Open Source Preparation

Sprint 1 — Open Source Preparation
- [ ] Create GitHub organization
- [ ] Create public `ancap-docs`
- [x] Add README.md
- [x] Add LICENSE
- [x] Add SECURITY.md
- [x] Add CONTRIBUTING.md
- [x] Add public roadmap
- [x] Add architecture overview
- [x] Add ACP / wACP docs
- [x] Add `.env.example`
- [x] Enable GitHub secret scanning
- [x] Enable branch protection

Sprint 2 — Public Developer Base
- [x] Publish API overview
- [x] Publish Smart QR Pay specification
- [x] Publish ACP / wACP conversion rules
- [ ] Publish wACP contract source
- [x] Publish SDK skeleton
- [ ] Add example payment integration
- [ ] Add example wallet connection flow
- [x] Add GitHub issue templates

Sprint 3 — Community + Audit Readiness
- [x] Add public security policy
- [x] Add responsible disclosure process
- [ ] Add bridge risk documentation
- [ ] Add contract verification guide
- [ ] Add public changelog
- [ ] Add release tags
- [ ] Add testnet deployment guide
- [ ] Add audit checklist

## Source documents this roadmap supersedes

- \PRODUCTION_ROADMAP.md\ -- merged into this document
- \ROADMAP-MONETIZATION.md\ -- merged into this document
- \docs/mobile/ROADMAP.md\ -- merged into Priority 5 section
- \docs/bridge-next-steps.md\ -- merged into Priority 4 section
- \docs/DELIVERY_BOARD.md\ -- archived
- legacy plaintext-key config snippet -- **DELETE. Do not use as reference. Contains leaked secret.**

---

## Priority 0 -- EMERGENCY (fix before next deploy)

### 0.1 Leaked API key remediation [CRITICAL]

Status: [~] Repo-side cleanup is tighter, but external secret rotation and access cleanup still require manual credentialed follow-through.

File: a previously tracked provider/config snippet contained a plaintext API key (redacted here; treat as compromised).

Verification (2026-05-25):
- the tracked plaintext-key snippet is absent from the repo
- repo-side token-shaped examples were removed from tracked docs
- repo scan found no other live leaked-token patterns; the only remaining sk-aw-... matches are this roadmap's own remediation notes / grep example

Action (in order):
1. Revoke the compromised provider key at the upstream dashboard/API
2. Generate a new key and store only in CI secrets / env management
3. Remove or replace any tracked docs/snippets that demonstrate direct key embedding
4. Search entire repo for any other leaked secrets:
   \\\bash
   grep -rn "sk-aw-\|sk-prod-\|sk_live_\|ghp_\|ghs_\|gho_" . \
     --include="*.py" --include="*.json*" --include="*.yml" \
     --include="*.yaml" --include="*.ts" --include="*.tsx" 2>/dev/null
   \\
5. Enable GitHub secret scanning: Settings > Code security and analysis > Secret scanning > On + Push protection > On

Reference: GitHub Docs -- any exposed secret = assume compromised, revoke immediately.
### 0.2 Insecure dev defaults in production configs [CRITICAL]

Status: [~] Repo-side hardening is in place and test-covered; production deployment still needs real secrets supplied in env/CI.

Files: \docker-compose.prod.yml\, \pp/config.py\

Verification (2026-05-25):
- `docker-compose.prod.yml` now requires `DATABASE_URL`, `POSTGRES_PASSWORD`, `SECRET_KEY`, `CURSOR_SECRET`, and `CRON_SECRET` without production fallbacks; compose `${VAR:?message}` guards make `docker compose config/up` fail immediately when any required secret is unset, and the API service now explicitly receives `POSTGRES_PASSWORD` too so the app-level production parity guard can validate bundled-postgres `DATABASE_URL` / `POSTGRES_PASSWORD` consistency at runtime instead of only in deploy-script preflight
- `app/config.py` fails fast in `environment=production` when `SECRET_KEY`, `CURSOR_SECRET`, or `CRON_SECRET` are missing/placeholder-like, rejects blank or non-absolute `DATABASE_URL` values and the insecure bundled-db default credentials, rejects placeholder/default DB passwords hidden inside `DATABASE_URL`, URL-decodes bundled-postgres passwords before comparison, and when the bundled compose `postgres` service is targeted — whether via authority host `@postgres:...` or socket/query host `?host=postgres` — it now also requires a real non-default non-placeholder `POSTGRES_PASSWORD` plus exact `DATABASE_URL` / `POSTGRES_PASSWORD` parity
- `scripts/deploy-ancap-cloud.ps1`, `scripts/deploy-ancap-cloud.sh`, and `scripts/rebuild-prod.ps1` now load repo-root `.env`, assert those required production secrets are present (including `POSTGRES_PASSWORD` for the bundled compose postgres service), reject placeholder-like `SECRET_KEY` / `CURSOR_SECRET` / `CRON_SECRET` values before compose startup, reject the insecure default `DATABASE_URL`, reject placeholder/default DB passwords embedded in `DATABASE_URL`, reject `DATABASE_URL` / `POSTGRES_PASSWORD` drift for the bundled compose postgres service (including socket/query-host DSNs such as `?host=postgres`), avoid shadowing compose interpolation with the bridge-only env file, and the bash helper now parses repo-root `.env` directly so CRLF-authored env files do not break preflight on Linux/WSL
- PowerShell deploy/rebuild and bash deploy preflight now also correctly accept URL-encoded bundled-postgres passwords inside `DATABASE_URL` (for example `p%40ss%3Aword`) while still comparing them against the raw `POSTGRES_PASSWORD` value, avoiding false mismatch failures when real secrets contain reserved URL characters, including the socket/query-host `?host=postgres` DSN form and percent-encoded socket-host query variants such as `?host=%70ostgres`
- `tests/test_prod_deploy_scripts.py` now goes beyond string-presence assertions and actually exercises the deploy/rebuild helpers against staged minimal repos, confirming that PowerShell deploy/rebuild and bash deploy can bootstrap required production secrets from a repo-root `.env` without relying on pre-exported shell state, including the CRLF-authored `.env` case for the bash helper and URL-encoded `DATABASE_URL` password handling across authority-host and socket/query-host bundled-postgres DSN variants; it now also directly exercises real `docker compose -f docker-compose.prod.yml config --quiet` success/failure behavior so the compose required-var guard itself is covered, including fail-fast proof that a missing required secret does not dump the other provided secret values to stdout/stderr
- `scripts/deploy-ancap-cloud.ps1` no longer relies on unsupported `??` null-coalescing syntax in Windows PowerShell error/log formatting, so deploy-script preflight failures now surface the intended guard messages instead of a parser error before any real validation runs
- the deploy helpers now also run `docker compose -f docker-compose.prod.yml config --quiet` before any build/start step, so compose interpolation or missing-required-var failures stop the deploy/rebuild path before image work begins without dumping resolved secrets to stdout; the staged-script tests assert that config validation is actually invoked for PowerShell deploy/rebuild and bash deploy, and the deploy helpers expose opt-in `-SkipPostDeployChecks` / `--skip-post-deploy-checks` switches for controlled staged-test contexts while keeping live `/api/v1/system/health`, `/api/v1/system/ready`, and `/internal/frontend-build` verification enabled by default on the real deploy path
- deploy-facing docs now consistently call out those required secrets before production compose startup, including `README.md`, `PRODUCTION_ROADMAP.md`, and `.github/RELEASE_PROCESS.md`, and they now explicitly note that `DATABASE_URL` must include the same real DB password as `POSTGRES_PASSWORD` when targeting the bundled compose postgres service; the prod-like compose/docs truth now also records that `POSTGRES_PASSWORD` is passed through to the API container so the same parity rule is enforced by app startup in real runtime, not just by helper-script preflight
- real local runtime follow-through was re-verified after the quiet-validation hardening and compose pass-through fix: `docker compose -f docker-compose.prod.yml config --quiet` succeeds under the current host secret set, the rendered compose model now includes `POSTGRES_PASSWORD` in the API service environment, `docker compose -f docker-compose.prod.yml up -d postgres redis api` brings the prod-like API stack up healthy again, and once the full proxy/frontend path is running the expected health target remains `http://127.0.0.1:8080/api/v1/system/health` with the canonical hardened header set
- `pytest tests/test_config_admin_ids.py tests/test_system.py tests/test_prod_deploy_scripts.py -q` passes with coverage for the production secret guard, explicit bundled-postgres `POSTGRES_PASSWORD` requirements, URL-encoded bundled-postgres password acceptance in both app config and deploy-script preflight (including `?host=postgres` and percent-encoded `?host=%70ostgres` socket/query-host DSNs), deploy-script preflight rejection of placeholder-like app secrets and insecure/default/invalid DB settings, repo-root `.env` bootstrap behavior, `DATABASE_URL` / `POSTGRES_PASSWORD` mismatch rejection, direct compose required-var success/failure coverage for `docker compose -f docker-compose.prod.yml config --quiet`, explicit compose proof that `POSTGRES_PASSWORD` is rendered into the API service environment for bundled-postgres prod runs, compose-config preflight invocation in deploy helpers, and cron-secret-gated jobs endpoints

Fix:
- \secret_key\ must not have a fallback default in production-configured files -- must be a required env var with no insecure fallback
- \cursor_secret\ dev fallback must not exist in any file that could be docker-compose-prodd
- production \DATABASE_URL\ must not silently keep insecure bundled-db local defaults
- Add startup guard: if \ENV == "production"\ and a required secret is missing -- fail fast

---

## Priority 1 -- CI/CD honesty and security automation

### 1.1 Fix backend CI soft-fails [HIGH]

Status: [x] Done. `backend-ci.yml` now fails on Bandit findings and on Docker build errors (no `|| true`, no invalid `--target deps`).

File: \.github/workflows/backend-ci.yml\

\\\diff
# Bandit -- must fail the build on findings
- run: bandit -r app/ -f txt 2>&1 | tee bandit-report.txt || true
+ run: bandit -r app/ -f txt 2>&1 | tee bandit-report.txt

# Docker build check -- the line below has two bugs:
#   (1) --target deps stage does NOT exist in root Dockerfile
#   (2) || true makes it always pass even on real build errors
- run: |
-     docker build --target deps -t ancap:build-check . 2>&1 | tail -20 || true
-     docker build -t ancap:build-check . 2>&1 | tail -10 || true
+ run: docker build -t ancap:build-check .
\\\

Exit criteria: CI build fails on Bandit HIGH/medium findings. CI build fails on Docker build error.

### 1.2 Enable Dependabot [HIGH]

Status: [x] Done. Dependabot config is in repo, GitHub vulnerability alerts / security update automation are enabled, secret scanning + push protection are enabled, and dependency PRs now have an explicit review gate.

Files: `.github/dependabot.yml`, `.github/workflows/dependency-review.yml`, `tests/test_dependency_review_workflow.py`

Verification (2026-05-26):
- `.github/dependabot.yml` covers pip, frontend npm, mobile npm, and GitHub Actions with weekly schedules
- `GET /repos/dragoncattrx-hub/ancap/vulnerability-alerts` returns `204 No Content`, confirming GitHub vulnerability alerts are enabled
- `gh api repos/dragoncattrx-hub/ancap --jq ".security_and_analysis"` reports:
  - `dependabot_security_updates: enabled`
  - `secret_scanning: enabled`
  - `secret_scanning_push_protection: enabled`
- new workflow `.github/workflows/dependency-review.yml` runs `actions/dependency-review-action@v4` on PRs that change Python or npm dependency manifests / lockfiles and fails on `moderate`+ findings
- `pytest tests/test_dependency_review_workflow.py tests/test_system_jobs_tick_workflow.py -q` passes

Exit criteria: satisfied — dependency update automation is enabled, secret scanning / push protection are on, and dependency PRs get a real review gate instead of relying on docs-only intent.

### 1.3 Add CodeQL scanning [HIGH]

Status: [x] Done. The repo uses an explicit advanced CodeQL workflow, recent real GitHub runs succeeded, and alerts are being published into GitHub code scanning.

File: `/.github/workflows/codeql.yml`

Verification (2026-05-26):
- `.github/workflows/codeql.yml` scans Python, JavaScript/TypeScript, and GitHub Actions on push / pull_request plus the weekly Monday 06:00 UTC schedule
- recent successful real CodeQL runs on `master`:
  - `26463212516` — `fix(frontend): remove duplicate page backgrounds after layout rollout`
  - `26460632345` — `fix(ci): harden e2e smoke and system jobs guards`
  - `26460162797` — `fix(ci): stabilize frontend e2e smoke and golden path`
- `GET /repos/dragoncattrx-hub/ancap/code-scanning/alerts` returns live CodeQL results (currently 89 open alerts; sample rule: `js/unused-local-variable` created `2026-05-26T16:09:58Z`), proving the workflow is publishing findings into GitHub code scanning
- `GET /repos/dragoncattrx-hub/ancap/code-scanning/default-setup` currently reports `state: not-configured`, which is expected because this repo uses the explicit workflow above instead of GitHub's default setup wizard

Exit criteria: satisfied — CodeQL is running on the intended languages in real GitHub Actions and feeding the code-scanning surface.

### 1.4 Playwright E2E in CI [HIGH]

Status: [x] Done. The full local CI-like smoke path is green and the same GitHub Actions `Frontend CI` / `e2e-tests` path completed successfully on a real push.

Verification (2026-05-26):
- `.github/workflows/frontend-ci.yml` contains an `e2e-tests` job that:
  - boots `postgres`, `redis`, and `api`
  - waits for `/v1/system/health`
  - runs `alembic upgrade head`
  - builds/starts the frontend on port `3001`
  - installs Playwright Chromium and runs `npx playwright test`
  - uploads Playwright artifacts and tears down services afterward
- `frontend-app/playwright.config.ts` is aligned with the CI pattern and accepts `PLAYWRIGHT_BASE_URL` overrides
- the repo contains real E2E specs under `frontend-app/e2e/` covering golden-path, growth, contracts, hydration, and public-surface flows
- local CI-like backend validation succeeds in isolated compose projects, including the current honest `3001/8001` path:
  - `docker compose -p ancap-e2e-ci up -d postgres redis api`
  - `docker compose -p ancap-e2e-ci exec -T api alembic upgrade head`
  - `http://127.0.0.1:8001/v1/system/ready` returned `{"status":"ready","checks":{"database":true,"redis":true}}`
  - `scripts/run-e2e-ci-smoke.ps1 -ProjectName ancap-ci-cycle -KeepStack -SkipBrowserInstall -SkipNpmCi` passes on the GitHub-faithful `3001/8001` path with `13 passed, 1 skipped`
  - `scripts/run-e2e-ci-smoke.ps1 -ProjectName ancap-ci-verify-20260526b -ApiPort 18002 -PostgresPort 15433 -RedisPort 16380 -FrontendPort 3312 -SkipBrowserInstall -SkipNpmCi` also passes on a fully isolated alternate-port path with `13 passed, 1 skipped`
- `scripts/run-e2e-ci-smoke.ps1` now does a stricter real-stack check on isolated ports, cleans up stale repo-owned frontend listeners before retrying `next start`, and fails fast with an explicit reusable message when Docker port bindings are already occupied by another smoke stack instead of surfacing the raw daemon bind error later during `docker compose up`
- live local CI-like verification on 2026-05-26 exposed and fixed real stack/runtime issues before GitHub CI could hide them:
  - `docker-compose.yml` did not pass `CORS_ORIGINS` into the dev API container, so isolated smoke stacks on alternate frontend ports (for example `3311`) silently fell back to the app default allowlist and cross-origin browser calls failed with UI-level `Failed to fetch`
  - this broke authenticated Playwright flows on `/contracts/{id}`, `/strategies/{id}`, and `/runs/{id}` even though direct API calls and static-page smoke tests still passed
  - `docker-compose.yml` now forwards `CORS_ORIGINS` into the API service with the current dev-safe default allowlist, so CI/local smoke runs can override it for alternate frontend ports without patching app config
  - `tests/test_cors_dev_stack.py` now locks that compose-level env pass-through in place
  - the remaining last red spec in the full smoke run turned out to be a false Playwright assumption in `frontend-app/e2e/ancap.ui.spec.ts`, not an app/runtime defect: the responsive unauthenticated header intentionally renders duplicate `/login` and `/register` links across desktop/mobile layouts, so the old raw `locator('a[href="/login"]')` assertion hit strict-mode ambiguity with one hidden duplicate
  - `frontend-app/e2e/ancap.ui.spec.ts` now scopes those assertions to the visible header and uses role-based link expectations, which matches the real responsive UI contract
- first real GitHub Actions success is now recorded:
  - workflow: `Frontend CI`
  - run: `26460162796`
  - conclusion: `success`
  - push SHA: `59a59b0d38397b34f0f26992a183a90d59efc340`
  - URL: `https://github.com/dragoncattrx-hub/ancap/actions/runs/26460162796`
  - the `e2e-tests` job completed successfully in `4m44s`

Fix: Keep the `e2e-tests` job in `frontend-ci.yml`, keep `scripts/run-e2e-ci-smoke.ps1` as the repeatable repro path, and preserve the compose-level `CORS_ORIGINS` pass-through that made the CI-faithful browser path honest again.

Files needed: `playwright.config.ts` and the E2E specs already exist; local repro helper now lives in `scripts/run-e2e-ci-smoke.ps1`.

Exit criteria: satisfied — the same E2E path now runs successfully in GitHub Actions on a real push.

### 1.5 RESTRICT ops/diagnostics endpoints [HIGH]

Status: [x] Done. Repo-side tier split and platform-admin protection are implemented, test-covered, and now live-verified on the prod-like path.

Files: `app/api/routers/system.py`, nginx/proxy config

Problem:
- `GET /system/health/full` does external LLM probe on every request
- `GET /system/economy-health` pings ACP RPC, returns operational details
- `GET /system/diagnostics` exposes `acp_rpc_url`, driver info
- All of the above are unauthenticated

Fix: Split into three tiers:
- **Tier 1 -- liveness**: `GET /system/health` (DB + Redis only, no external I/O, < 50ms)
- **Tier 2 -- readiness**: `GET /system/ready` (local checks, no external HTTP)
- **Tier 3 -- deep diagnostics** (internal only, platform-admin auth required):
  - `GET /internal/ops/deep-health`
  - `GET /internal/ops/diagnostics`
  - LLM probe: run async in background, cache result 60s
  - ACP RPC probe: run async in background, cache result 30s

Verification (2026-05-26):
- `app/api/routers/system.py` exposes:
  - `GET /v1/system/health` as lightweight liveness
  - `GET /v1/system/ready` as DB+Redis readiness
  - `GET /v1/system/health/full` as public local-only expanded health
  - `GET /v1/internal/ops/diagnostics`, `/deep-health`, and `/economy-health` behind `require_platform_admin`
- `tests/api/test_system_economy_health.py` passes for internal ops auth/shape coverage and now also locks the intended probe-refresh boundary: public `GET /v1/system/health/full` must not schedule external LLM/ACP probe refreshes, while internal `GET /v1/internal/ops/deep-health` does schedule the cached async refresh path; it also now proves internal deep-health reports the LLM check as degraded until a configured provider probe actually succeeds, instead of treating mere configuration as operational success
- `tests/test_nginx_security_headers.py` passes, confirming proxied nginx locations hide upstream security headers and re-add the canonical in-proxy header set
- `tests/test_system.py` now also covers the public `/v1/system/ready` and `/v1/system/health/full` response shapes, including proof that the public `health/full` payload does not expose `acp_rpc_url`
- live prod-like verification on `http://127.0.0.1:8080` now confirms the public surfaces meet the latency target without external I/O:
  - `/api/v1/system/health` -> `200` in `0.0150s`
  - `/api/v1/system/ready` -> `200` in `0.0111s`
  - `/api/v1/system/health/full` -> `200` in `0.0226s`
- unauthenticated access to `GET /api/v1/internal/ops/diagnostics` on the same prod-like path is denied with `401`, confirming deep diagnostics are no longer public

Exit criteria: satisfied — public endpoints return < 200ms without external I/O, and deep diagnostics remain internal/admin-protected.

### 1.6 Separate jobs_tick from HTTP [HIGH]

Status: [x] Done. The async enqueue path is implemented, test-covered, scheduled in GitHub Actions, and now live-verified on the prod-like runtime; the synchronous route remains manual emergency-only.

File: \pp/api/routers/system.py\

Problem: \POST /system/jobs/tick\ runs 20+ sequential jobs (edges_daily, agent relationships, auto limits, circuit breaker, reputation, referrals, notifications, leaderboards, activity feed, governance checks, graph enforcement, staking rewards, ledger invariant check, bridge reconciliation, mobile indexer) -- all in one HTTP request. This is a mini-orchestrator in a request handler.

Fix: Hybrid approach:
- \POST /system/jobs/tick/async\ -- enqueues job, returns \202 Accepted\ immediately (background task via FastAPI BackgroundTasks or Redis queue)
- \POST /system/jobs/tick\ -- kept for manual emergency ops triggers only
- Add GitHub Actions scheduled workflow (runs every 5 min) that calls \/system/jobs/tick/async\
- Jobs run with retry and dead-letter queue

Verification (2026-05-26):
- `.github/workflows/system-jobs-tick.yml` exists and schedules every 5 minutes
- the workflow still POSTs `X-Cron-Secret` to `ANCAP_SYSTEM_JOBS_TICK_URL`, but now also fails fast unless that secret URL ends with `/v1/system/jobs/tick/async`, so repo/GitHub secret drift cannot silently route scheduler traffic back to the sync/manual endpoint
- latest real scheduled GitHub run succeeded:
  - workflow: `System Jobs Tick`
  - run: `26460430404`
  - conclusion: `success`
- `tests/test_system.py` already covers `POST /v1/system/jobs/tick/async` returning `202 Accepted` plus cron-secret/retry/dead-letter behavior
- `tests/test_system_jobs_tick_workflow.py` now locks the async-endpoint guard into the workflow file
- live prod-like enqueue verification now also succeeds:
  - `POST /api/v1/system/jobs/tick/async` with the real `X-Cron-Secret` returned `202` in `0.4565s`
  - the created `system_job_runs` row `6196cb8c-3546-4316-bb5b-2751c02db0f3` completed as `succeeded` with `attempts=1` and `trigger_source=api`

Exit criteria: satisfied — the scheduled path now uses the async enqueue route, returns in < 1s, and heavy work completes in background job records instead of the scheduler request path.

---

## Priority 2 -- Domain model and skipped tests

### 2.1 Pool ownership model [HIGH]

Status: [x] Done. `Pool.owner_agent_id` is present in the data model and migration history, pool create/read APIs expose it, owner-aware allocation enforcement is live in `POST /v1/ledger/allocate`, and the repo docs now describe the backward-compatible legacy-null-owner rule explicitly.

Files: `app/db/models.py` (Pool class), `alembic/versions/911774c4bec4_add_owner_agent_id_to_pools.py`, `app/api/routers/pools.py`, `app/api/routers/ledger.py`, `tests/test_ledger.py`, `tests/test_pools.py`, `README.md`

Verification (2026-05-26):
- `Pool.owner_agent_id` exists in `app/db/models.py`
- migration `911774c4bec4_add_owner_agent_id_to_pools.py` adds the column in-repo
- pool create/get/list responses include `owner_agent_id`
- creating a pool optionally validates and persists `owner_agent_id`
- `POST /v1/ledger/allocate` now:
  - requires caller ownership when `pool.owner_agent_id` is set
  - allows authenticated backward-compatible allocation when it is unset
- `README.md` documents:
  - optional `owner_agent_id` on `POST /v1/pools`
  - `owner_agent_id` in pool read surfaces
  - owner-enforced allocation only for owned pools, with explicit legacy-null-owner compatibility
- `pytest tests/test_pools.py tests/test_ledger.py -q` passes (`9 passed`)

Exit criteria: satisfied — pool ownership is implemented, verified, and documented; any future product decision to forbid legacy null-owner pools is a separate tightening pass, not unfinished core ownership work.

### 2.2 Fix economy_health async/sync bug [MEDIUM]

Status: [x] Done. `ops_economy_health` is already async in `app/api/routers/system.py`, and ACP RPC probing now uses cached `httpx.AsyncClient` background refresh helpers instead of synchronous `httpx.post()` in-request.

File: `app/api/routers/system.py`

Verification (2026-05-25):
- `@_internal_router.get("/economy-health")` is implemented as `async def ops_economy_health(...)`
- ACP RPC probing is handled through `_refresh_acp_rpc_probe_cache()` with `httpx.AsyncClient`
- `tests/api/test_system_economy_health.py` passes against the current internal ops surface

### 2.3 Unskip ledger invariant test [MEDIUM]

Status: [x] Done. `tests/api/test_growth_layer.py::test_jobs_tick_sets_ledger_halt_blocks_faucet` now injects a malformed one-sided `transfer` event directly, runs `/v1/system/jobs/tick`, and verifies the faucet is blocked once the ledger invariant halt flag is raised.

File: \	ests/api/test_growth_layer.py\

### 2.4 Resolve test_unit.py bcrypt skip [LOW]

Status: [x] Done. `tests/test_unit.py` no longer contains the old bcrypt-backend skip, unit auth hashing tests pass directly against `bcrypt`, and dependency metadata now matches the actual runtime implementation instead of still declaring the stale `passlib[bcrypt]` extra.

Files: `tests/test_unit.py`, `app/services/auth.py`, `requirements.txt`, `pyproject.toml`

Verification (2026-05-25):
- `tests/test_unit.py` contains no `pytest.skip("bcrypt backend not available")` guard anymore
- `app/services/auth.py` hashes/verifies passwords directly with `bcrypt`
- `requirements.txt` now pins `bcrypt==5.0.0`
- `pyproject.toml` now declares `bcrypt>=5.0` instead of the stale `passlib[bcrypt]` extra
- `pytest tests/test_unit.py -q` passes

---

## Priority 3 -- Security hardening

### 3.1 Auth token: localStorage to HttpOnly cookies [MEDIUM]

Status: [x] Done. Browser auth now prefers HttpOnly `ancap_token` cookies instead of JS-readable auth storage, shared authenticated requests consistently send `X-Requested-With`, and the live prod-like stack confirms the cookie/CSRF path behaves as intended.

Files: `frontend-app/src/components/AuthProvider.tsx`, `frontend-app/src/lib/api.ts`, `app/api/deps.py`, `app/api/routers/auth.py`, `frontend-app/e2e/*.spec.ts`

Verification (2026-05-26):
- `AuthProvider` no longer depends on `auth.getToken()` to decide signed-in bootstrap; it restores cached user display data only and then resolves real auth from `/users/me`
- frontend shared API client now always sends `X-Requested-With: XMLHttpRequest`
- `frontend-app/src/lib/api.ts` centralizes raw authenticated fetch helpers (`apiFetchRaw` / shared headers), and the admin overview, funds create, vertical propose, profile loads, agent follow/unfollow, logout, and workflow revenue CSV export flows use that shared path instead of bespoke client-side fetch calls
- repo scan of `frontend-app/src` shows no remaining auth-token writes to localStorage; `ancap_user` is kept only as non-secret UI bootstrap data while Playwright auth seeders stage `ancap_token` as a cookie
- cookie-authenticated unsafe requests fail closed in `app/api/deps.py` unless `X-Requested-With` is present, while explicit Bearer-token clients remain allowed
- auth cookie set/clear paths use `SameSite=strict`
- local prod-like runtime truth on `http://127.0.0.1:8080` is healthy (`/api/v1/system/health` 200, `/api/v1/system/ready` ready, `/internal/frontend-build` matches build id `32b5d58`)
- `pytest tests/test_auth.py tests/test_system.py tests/api/test_system_economy_health.py -q` passes
- `npm run build` in `frontend-app` passes

Exit criteria: satisfied — no Bearer tokens are stored in localStorage for auth and CSRF protection is active on cookie-authenticated unsafe routes.

### 3.2 SameSite cookie + CORS hardening [MEDIUM]

Status: [x] Done. Auth cookies are `SameSite=strict`, CORS is explicit, and live prod-like preflight checks confirm the intended same-origin browser path while rejecting disallowed origins.

Files: `app/main.py`, `app/api/routers/auth.py`, `infra/nginx/default.conf`

Verification (2026-05-26):
- auth cookie set/clear paths use `SameSite=strict`
- `app.main` CORS middleware keeps explicit `allow_origins` and explicit allowed methods/headers (`Authorization`, `Content-Type`, `Idempotency-Key`, `X-API-Key`, `X-Bridge-Operator-Secret`, `X-Cron-Secret`, `X-Requested-With`, `X-Request-Id`)
- `app.main` already injects `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`
- `infra/nginx/default.conf` already matches `DENY` + HSTS across public locations
- live prod-like preflight to `OPTIONS /api/v1/auth/logout` with `Origin: https://ancap.cloud` and `Access-Control-Request-Headers: content-type,x-requested-with` now returns `200 OK` with `access-control-allow-origin: https://ancap.cloud`, `access-control-allow-credentials: true`, and `x-requested-with` present in the explicit allowlist
- the same preflight from a disallowed origin returns `400 Disallowed CORS origin`, confirming the app stayed explicit instead of drifting back to wildcard behavior
- `tests/test_auth.py` now locks those allowed-origin and rejected-origin preflight expectations in addition to the existing cookie-authenticated logout guard

Exit criteria: satisfied — browser preflight/runtime verification is in place and any future route-specific header expansion must be added deliberately to the explicit CORS allowlist.

### 3.3 Production security header alignment [LOW]

Status: [~] Inner prod proxy and outer origin nginx are now aligned and deduplicated, but public `ancap.cloud` / `api.ancap.cloud` still show Cloudflare-edge header rewriting that requires zone/dashboard access not currently available through the provided API token.

Files: `infra/nginx/default.conf`, production nginx config

Verification (2026-05-26):
- added `proxy_hide_header` for `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` in every proxied location of `infra/nginx/default.conf` before nginx re-adds the canonical header set
- this fixes the real local prod-like defect where `/api` responses previously carried duplicate security headers from both FastAPI and nginx
- `docker compose exec -T proxy nginx -t` ✅
- `docker compose exec -T proxy nginx -s reload` ✅
- live local checks now show a single canonical header set on both `http://127.0.0.1:8080/` and `http://127.0.0.1:8080/api/v1/system/health`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- production follow-through on the server was partially completed:
  - `/opt/ancap-migration/current/infra/nginx/default.conf` on `ancap-server` already contains `proxy_hide_header` rules for proxied locations
  - `docker compose -f docker-compose.prod.yml exec -T proxy nginx -t` on `ancap-server` succeeds
  - `docker compose -f docker-compose.prod.yml exec -T proxy nginx -s reload` on `ancap-server` succeeds
  - direct origin checks now show the inner container proxy is clean: `http://127.0.0.1:8080/api/v1/system/health` returns a single canonical set
  - direct HTTPS-to-origin checks with `Host: ancap.cloud` / `Host: api.ancap.cloud` initially exposed duplicate headers at the outer nginx layer, so the outer vhost files under `/etc/nginx/conf.d/domains/*.conf` and `*.ssl.conf` were patched to hide upstream security headers before `proxy_pass`, then `sudo systemctl reload nginx` was applied
  - after that outer-nginx patch, direct origin HTTPS checks return the canonical single set (`DENY`, `nosniff`, `strict-origin-when-cross-origin`, `camera=(), microphone=(), geolocation()`, HSTS) with no duplicates
- public Cloudflare-routed responses are still not the same as origin truth:
  - `https://ancap.cloud/api/v1/system/health` still returns `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy: same-origin`
  - `https://api.ancap.cloud/v1/system/health` also still returns `SAMEORIGIN` / `same-origin`, even while preserving the origin debug header `X-Debug-Vhost: api-https`
  - this proves the remaining mismatch is now at the Cloudflare edge layer, not the ANCAP app, inner proxy, or origin nginx
- Cloudflare access is currently insufficient to fix that edge rewrite from this runtime:
  - the provided bearer token verifies as active via `/user/tokens/verify`
  - but `GET /zones` returns an empty result set for this token, so no zone/rules management scope is currently exposed through it
- `tests/test_nginx_security_headers.py` still guards the in-repo nginx config so proxied locations must hide upstream security headers before re-adding the canonical set

Remaining follow-through:
- obtain Cloudflare zone/dashboard access with permission to inspect response-header / transform / managed rules for `ancap.cloud`
- remove the edge-layer rewrite that forces `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy: same-origin`
- re-run public production header inspection after the Cloudflare change and only then mark this item done

---

## Priority 4 -- Monetization depth

### 4.1 Stripe / fiat payment gateway [HIGH]

Status: [~] Core backend, schema, migration, deploy-env plumbing, and wallet credits UI are now implemented and passing repo checks. Remaining blocker before this can be marked done: no verified real end-to-end Stripe payment against configured secrets/webhook delivery yet.

ACP checkout is stable. New users must acquire ACP on exchange -- huge friction.

Implemented surfaces:
- `POST /v1/payments/stripe/intent` -- create Stripe-backed top-up PaymentIntent and return client session data
- `GET /v1/payments/stripe/intents/{intent_id}` -- poll owned Stripe top-up intent status / credited state, including Stripe-provider sync fallback when webhook delivery is delayed
- `POST /v1/webhooks/stripe` -- Stripe webhook handler with signature verification + idempotent event deduplication
- `GET /v1/payments/methods` -- list saved payment methods
- `DELETE /v1/payments/methods/{id}` -- remove payment method
- frontend wallet credits page now supports saved cards, new-card Stripe.js entry, submit flow, and webhook-status polling

Model changes now in repo:
- `User.stripe_customer_id` (nullable)
- `PaymentIntent.stripe_payment_intent_id` (nullable)
- new `StripeEvent` model/table for webhook deduplication
- migration `56f5c6a2d1ab_add_stripe_payment_support.py`

Deployment/config follow-through now in repo:
- `.env.example` documents Stripe env vars
- `docker-compose.prod.yml` passes Stripe runtime env through to API
- prod/rebuild scripts and settings validation now guard bundled-postgres URL/user/db consistency so deploys fail fast instead of drifting
- README documents Stripe adapter surfaces and fail-closed behavior when Stripe is unconfigured

Verification (2026-05-27):
- `pytest tests/api/test_payments.py -q` ✅ (now includes unsupported-currency fail-closed coverage for the first-slice Stripe allowlist)
- `pytest tests/test_prod_deploy_scripts.py -q` ✅ (`61 passed`)
- `pytest tests/test_config_admin_ids.py -q` ✅ (`10 passed`)
- `npm run test` in `frontend-app` ✅
- `npm run build` in `frontend-app` ✅
- `docker compose -f docker-compose.prod.yml exec -T api alembic upgrade head` ✅
- local prod stack healthy: `docker compose -f docker-compose.prod.yml ps` shows api/postgres/redis/frontend/proxy up; `http://127.0.0.1:8080/api/v1/system/health` returns `{"status":"ok"}`
- Stripe service layer now rejects unsupported checkout currencies with an explicit `400` (`USD`, `EUR` only for the current adapter slice) so the wallet UI and backend cannot silently drift into fake fiat coverage the repo has not actually implemented or verified

Existing `payment_intents` contract is preserved: Stripe is an adapter, not a replacement.

Remaining follow-through:
- run a real Stripe checkout with valid configured keys and confirm webhook delivery credits the wallet end-to-end
- verify saved-card reuse on a live/test Stripe customer, not only mocked repo tests
- only then mark this item done

### 4.2 Creator earnings withdrawal [HIGH]

`referral_reward` ledger event triggers on first-paid-workflow, but no withdrawal exists.

New endpoints:
- \POST /v1/payouts/request\ -- creator requests withdrawal
- \GET /v1/payouts\ -- creator: list requests + status
- \GET /admin/payouts\ -- admin: all requests
- \POST /admin/payouts/{id}/approve\ -- approve -> ledger debit -> ACP transfer
- \POST /admin/payouts/{id}/reject\ -- reject -> funds returned

Model: \PayoutRequest\ (id, user_id, amount_acp, status: pending|approved|rejected|completed|failed, method: acp_wallet|bsc_address|bank_transfer, destination, created_at, updated_at, processed_at, admin_notes)

Exit criteria: Creator can request payout. Admin can approve/reject.

### 4.3 Creator earnings dashboard [MEDIUM]

Page: \/dashboard/seller/earnings\ (new)

New endpoints:
- \GET /v1/creators/me/earnings\ -- total_earnings_acp, pending_payout_acp, paid_out_acp, earnings_by_workflow[], earnings_by_period[], conversion_rate
- \GET /v1/creators/me/conversions\ -- views, add_to_cart, checkout_started, completed by listing and period

UI: Line chart (revenue over time), breakdown by workflow, pending vs paid, CSV export.

### 4.4 Subscriptions for workflows [MEDIUM]

Schema supports \subscription_price\ in listings but subscriptions not implemented.

Model: \Subscription\ (id, user_id, listing_id, plan_id, status: active|paused|cancelled|past_due, billing_period: monthly|quarterly|annual, price_acp, next_billing_at, auto_renew, retry_count)

Scheduler (via jobs_tick):
- On \
ext_billing_at\: check ledger -> debit -> create workflow run -> mark renewed
- If insufficient balance: retry up to 3 times with 3-day intervals, then pause + notify

Exit criteria: Creator can offer subscription plans. User can subscribe. Billing auto-renews.

### 4.5 API monetization depth [MEDIUM]

Remaining from MONETIZATION_EXECUTION_PLAN.md:
- Monthly usage exports (CSV): \GET /v1/paid-api/usage/export\
- Per-endpoint spend caps: \PATCH /v1/organizations/{id}/api-keys/{key_id}\ with \spend_cap\
- Per-agent spend caps: new field on Agent model
- Cost-plus margin reporting: add \provider_cost\ to \pi_usage_events\
- New: \GET /v1/paid-api/revenue-summary\ -- gross, cost, margin by endpoint/period/org

### 4.6 Referral commission auto-payout [MEDIUM]

`referral_reward` trigger exists but commission is never paid out.

Model: \ReferralCommission\ (id, referrer_id, referred_user_id, trigger_type: first_paid_workflow|subscription_created, commission_amount_acp, status: pending|payable|paid|cancelled, paid_at)

Scheduler:
- Daily: mark pending commissions where trigger condition met -> payable
- Weekly: for payable commissions -> debit treasury -> credit referrer ledger -> mark paid

Exit criteria: Referrers receive ACP commissions automatically.

### 4.7 Marketplace search + filters [MEDIUM]

PostgreSQL FTS exists (Phase 5 DONE) but not connected to marketplace.

New:
- \GET /marketplace/listings\ with filters: search, category, price_min/max, sort (popular|recent|price_asc|price_desc|rating), pagination
- \listing_views\ counter on each view
- \listing_purchases\ counter on each purchase
- Connect FTS: \	o_tsvector(name || ' ' || description)\
- Add \is_featured\ / \is_trending\ computed columns

### 4.8 Chargebacks and dispute UI [MEDIUM]

Model: \RefundRequest\ (id, payment_intent_id, user_id, amount_acp, reason, status: pending|approved|rejected, admin_notes, created_at, processed_at)

Endpoints:
- \POST /v1/payments/refund-request\ -- user initiates
- \GET /v1/payments/refund-requests\ -- admin lists all
- \POST /admin/refund-requests/{id}/approve\ -- ledger credit
- \POST /admin/refund-requests/{id}/reject\ -- with reason

---

## Priority 5 -- Mobile wallet completion

### 5.1 Unblocked items (no native FFI dependency)

| ID | Task | Status |
|----|------|--------|
| P4-8 | PIN + biometrics | [~] wired, real device verification pending |
| P4-9 | SecureVault | [~] SecureStore wired, biometric migration done, verification pending |
| P4-15 | i18n EN/RU/UK/DE | [ ] i18next |
| P5-1 | MASVS L1 checklist | [ ] |
| P5-5 | No secrets in Sentry/logs | [ ] |
| P6-3 | Device matrix (iOS + Android) | [ ] |
| P6-4 | TestFlight + Play Internal | [ ] |
| P6-5 | Store listing + legal pages | [ ] |
| P6-6 | Production v1.0.0 | [ ] |

### 5.2 Blocked items (needs native build)

| ID | Task | Blocker |
|----|------|---------|
| P1-6 | Android FFI .so build | Run \uild-android-native.ps1\ (needs Android NDK) |
| P4-3 | Create wallet via FFI | Needs P1-6 |
| P4-11 | Send + preview + sign | Needs P1 FFI |
| P1-7 | iOS Swift UniFFI link | Run \uild-ios-native.ps1\ (needs macOS) |

### 5.3 Smart QR Pay / AI Payment Scanner / Claim Codes track (v1.1 / v2, after wallet release closure)

Status: [~] Execution started. Docs/specs are written, backend `capabilities` + deterministic `parse` are implemented and tested, `quote` + execution-session groundwork is in repo code, and the Expo beta flow already supports paste, QR import, camera scan, review, and session restore. The broader **AI Payment Scanner** (photo / OCR / invoice decode) and **ANCAP Claim Codes** layers are now formal roadmap targets, but they are **not shipped** and must not be marketed as live.

Product formula inside this track:
- `Photo / QR -> AI Decode -> Payment Intent -> Smart Swap -> Pay`
- `Lock crypto -> Generate claim code -> Share code -> Redeem -> Receive crypto`

Execution order inside this track:
1. [x] docs/spec split: plan + schema + API + security
2. [x] backend `GET /v1/mobile/smart-pay/capabilities`
3. [x] backend `POST /v1/mobile/smart-pay/parse` (deterministic ACP + raw EVM + EIP-681 first scope)
4. [~] backend `POST /v1/mobile/smart-pay/quote` for first supported routes
5. [~] backend execution-session groundwork:
   - `POST /v1/mobile/smart-pay/execute`
   - `GET /v1/mobile/smart-pay/payments/{executionId}`
   - `POST /v1/mobile/smart-pay/payments/{executionId}/recover`
6. [~] mobile SDK/client wiring for Smart Pay endpoints (`@ancap/acp-api-client` typed methods added; app integration started)
7. [~] Expo app scan/import/pay UX (beta screen now supports paste, gallery QR import, camera QR scan, explicit confirmation before execute, status flow, and persisted draft/session restore; polish/history still pending)
8. [ ] real route engine / bridge-swap execution integration
9. [ ] AI fallback classifier for ambiguous payloads (only after deterministic/heuristic path is solid)
10. [ ] receipt/history/recovery UX hardening
11. [ ] AI Payment Scanner MVP:
   - camera/photo upload in wallet and website
   - QR recognition + OCR for receipts, invoices, payment screens, and payment documents
   - detect amount, recipient, network, asset, memo/tag/comment, payment deadline, and payment currency
   - build `paymentIntent` preview with manual correction before execute
   - service fee charged in ACP
12. [ ] Smart Payment Flow expansion:
   - automatic asset matching
   - smart swap before payment
   - multi-chain routing beyond narrow first-scope routes
   - suspicious-address / risk scoring
   - duplicate invoice/payment detection
   - saved recipients, templates, and merchant payment mode
13. [ ] ANCAP Claim Codes / Crypto Voucher layer:
   - lock internal balance or escrowed asset
   - generate redeemable public claim code
   - redeem from website or wallet
   - one-time and multi-use codes
   - expiration, cancel/refund before redemption, and proof receipt
   - creation / redeem fees charged in ACP
14. [ ] Secure escrow and code-verification layer:
   - `claim_code` as public user code
   - `secret_hash` only in storage (never store redeem codes in plain text)
   - `locked_balance`, `status`, expiry, and redemption metadata
   - brute-force protection, rate limits, anti-fraud monitoring, optional PIN/password
15. [ ] Merchant / growth layer:
   - businesses create payment QR codes
   - users create gift or payout claim codes
   - campaigns distribute ACP/wACP through claim codes
   - referral claim codes, airdrop claim links, and QR vouchers for Telegram / X / web

Truth constraints:
- deterministic parser first, AI second
- user confirmation mandatory before any payment
- AI/OCR may prepare a payment, but it must never auto-send without explicit user confirmation
- ACP fee reserve required
- first release scope stays narrow: ACP + BSC/EVM supported paths only
- claim-code storage must be hash-based and abuse-resistant, not plain-text voucher storage

---

## Priority 6 -- Architecture and release hygiene

### 6.1 Deployment story cleanup [MEDIUM]

Problem: Two conflicting deployment paths:
1. Docker/Containerized: \rontend-app/Dockerfile\ + \docker-compose.prod.yml\ (confirmed working)
2. Cloudflare Workers: \wrangler.jsonc\ + static framework (appears abandoned)

PR #1 added Cloudflare Workers config but actual production uses containerized approach.

Fix: Either delete \wrangler.jsonc\ and cloudflare/ dir, OR fully migrate to Cloudflare Workers. Do not keep both.

### 6.2 Dependency management consolidation [MEDIUM]

Problem: `requirements.txt` (exact pins) and `pyproject.toml` (range pins) coexist.

Fix:
- `requirements.txt` -> source of truth for runtime deps
- `pyproject.toml` -> source of truth for dev deps + build config
- Add pip-compile workflow: when `requirements.in` changes -> regenerate `requirements.txt` with locked hashes
- Align Python version: 3.11 (CI) vs prod (check)

### 6.3 Formal releases and tags [MEDIUM]

Problem: No GitHub Releases / tags. \LOG.md\ is the changelog.

Fix: Add \.github/workflows/release.yml\:
\\\yaml
on:
  push:
    tags: ["v*"]
jobs:
  build:
    # tests + build
  draft-release:
    steps:
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
\\\

Policy: every merge to master touching \pp/\ or \rontend-app/\ -> bump patch. Feature branches -> minor. Breaking changes -> major. Tag format: \YYYY.MM.DD\ or \MAJOR.MINOR.PATCH\.

### 6.4 Documentation health [LOW]

Tasks:
- Mark \docs/AUDIT-2026-04-29.md\ as superseded
- Add \> Last verified: YYYY-MM-DD\ header to all roadmap and audit docs
- Create \docs/STATUS_MATRIX.md\ -- single source of truth mapping every component to status

---

## Priority 7 -- Retention and LTV (later expansion)

Goes after monetization core is stable:
- Volume discounts: 5+ runs = 10% off, 20+ = 20% off
- Credits expiry policy: unused credits expire after 12 months (notify at 30/7/1 days)
- Win-back campaigns: discount codes for users inactive > 30 days
- Upsell banners: inline CTAs on receipt pages, billing page, developer dashboard
- React Flow strategy canvas (after builder API stable)

---

## Consolidated test status

| Suite | Status | Notes |
|-------|--------|-------|
| \pytest -q\ | 258 passed, 3 skipped | Full backend suite |
| \
pm test --workspaces\ (mobile SDK) | 56 passed across 5 packages | Including wallet-service tests |
| \
px tsc --noEmit\ (Expo wallet) | TypeScript clean | |
| \playwright install --with-deps\ | Browser binary ready | **E2E not run in CI yet** |
| \andit -r app/\ | Runs but soft-fails | Fix: remove \\|\| true\ |
| \docker build\ | \--target deps\ nonexistent stage | Fix: remove invalid target |

**Skipped tests to unskip:**
- \	est_allocate\ -- after Pool ownership migration (055)
- \	est_jobs_tick_sets_ledger_halt_blocks_faucet\ -- rework to use malformed transfer
- \pytest.skip("bcrypt backend not available")\ -- fix system dependency

---

## Execution order

Current active phase: Priority 0 (emergency) + Priority 1 (CI/security automation)

**Execution sequence:**

Week 1 (Priority 0 -- EMERGENCY)
  0.1  Revoke leaked key + delete/clean legacy plaintext-key snippet
  0.2  Fix insecure dev defaults in docker-compose.prod.yml + config

Week 2 (Priority 1a -- CI fixes)
  1.1  Fix backend CI: remove || true from Bandit + Docker check
  1.2  Enable Dependabot (add .github/dependabot.yml + enable in settings)
  1.3  Add CodeQL workflow

Week 3 (Priority 1b -- E2E + ops separation)
  1.4  Playwright E2E in CI (add docker-compose job)
  1.5  Restrict ops/diagnostics endpoints (auth + tier split)
  1.6  Separate jobs_tick from HTTP request path

Week 4 (Priority 2 -- Domain model)
  2.1  Pool ownership migration (055) + unskip test_allocate
  2.2  Fix economy_health sync/async bug
  2.3  Unskip ledger invariant test
  2.4  Fix bcrypt skip

Week 5 (Priority 3 -- Security)
  3.1  localStorage -> HttpOnly cookies (auth migration)
  3.2  SameSite + CORS hardening
  3.3  Production header alignment

Week 6 (Priority 4a -- Monetization: payments)
  4.1  Stripe integration (intent + webhook + credit ledger)
  4.2  Creator earnings withdrawal
  4.8  Chargeback + dispute UI

Week 7 (Priority 4b -- Monetization: growth)
  4.3  Creator earnings dashboard
  4.4  Subscriptions for workflows
  4.6  Referral commission auto-payout

Week 8 (Priority 4c -- Monetization: platform)
  4.5  API monetization depth (cost-plus, exports, spend caps)
  4.7  Marketplace search + filters

Week 9 (Priority 5 -- Mobile)
  5.1  PIN + biometrics (real device verification)
  5.1  SecureVault (real device verification)
  5.1  i18n EN/RU/UK/DE (i18next)
  5.1  MASVS L1 checklist

Week 10 (Priority 6 -- Architecture hygiene)
  6.1  Deployment story cleanup (remove Cloudflare artifacts or migrate)
  6.2  Dependency management consolidation
  6.3  Formal release workflow
  6.4  Documentation health

Ongoing (Priority 7 -- Later)
  7   Retention / LTV mechanics
  Playwright smoke in CI (Phase 7 from old roadmap)
  React Flow strategy canvas

---

## Working tree rule

Before ending every session:
1. \git status --short\ -> must return nothing
2. \pytest -q\ -> must pass or show only known/skipped
3. Roadmap updated for any status changes
4. CLAUDE.md updated for any new patterns learned



