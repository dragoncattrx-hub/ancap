# ANCAP Master Roadmap

> Status: active | Major revision: 2026-05-25
> Created: 2026-05-23 | Last updated: 2026-05-28
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
- Open-source positioning rule: **ANCAP will be open-source where transparency increases trust, integration and adoption - while security-critical infrastructure, private keys, bridge signer operations, wallet hot-key logic and production secrets remain protected.**

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

### Phase 1 - GitHub Public Foundation

Execution targets:
- create a public GitHub org (`ANCAP` or `ancap-network`) when ownership/naming is finalized;
- keep the main project repo public-safe and contributor-ready;
- add `README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md`;
- add public docs for architecture, roadmap, API, ACP/wACP, and trust/security boundaries;
- add GitHub issue templates and a PR template;
- enable GitHub secret scanning, push protection, Dependabot, CodeQL, and branch protection.

### Phase 2 - Open Source Scope

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

### Phase 3 - Repository Structure

Target public structure after the current monorepo hardening phase:
- `ancap-docs` - public documentation, roadmap, whitepaper, architecture, tokenomics
- `ancap-web` - public website and landing frontend
- `ancap-wallet` - mobile/web wallet interface and Smart QR Pay UI
- `ancap-sdk` - TypeScript SDK for ACP / wACP integrations
- `ancap-contracts` - wACP contract, bridge public contracts, deployment scripts
- `ancap-examples` - merchant/payment/API/QR integration examples
- `ancap-core` - publishable protocol components safe for public review

Private target repos:
- `ancap-infra`
- `ancap-bridge-operator`
- `ancap-admin`

### Phase 4 - Licensing

Default licensing direction:
- Apache-2.0 for core / protocol / SDK / contracts
- MIT for frontend / examples when frictionless adoption matters more
- CC BY 4.0 or Apache-2.0 for docs, depending on repo split

Current repo decision:
- this mixed monorepo defaults to **Apache-2.0** until the codebase is split into dedicated public repos with component-specific licensing if needed.

### Phase 5 - GitHub Security Baseline

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

### Phase 6 - Public Transparency for ACP / wACP

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

### Phase 7 - Community Contribution Model

Community baseline:
- GitHub Issues for bug reports and feature requests;
- GitHub Discussions for ideas and technical questions;
- label system (`good first issue`, `help wanted`, `security`, `wallet`, `bridge`, `docs`, `sdk`, `contracts`, `frontend`);
- contributor guide;
- public roadmap board;
- monthly development update;
- changelog;
- release notes.

### Phase 8 - GitHub as Trust Layer

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

### Immediate execution queue - Open Source Preparation

Sprint 1 - Open Source Preparation
- [~] Create GitHub organization (blocked pending final ownership/name decision plus GitHub org-admin access; `ANCAP` is already taken by an unrelated user profile and current auth cannot inspect/create org state without `admin:org` scope)
- [~] Create public `ancap-docs` (repo-split seed bundle + export script prepared in-repo; export now rewrites out-of-bundle links to source-monorepo GitHub URLs and validates the standalone docs bundle for broken relative links; actual GitHub repo creation still blocked on org/ownership/access)
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

Sprint 2 - Public Developer Base
- [x] Publish API overview
- [x] Publish Smart QR Pay specification
- [x] Publish ACP / wACP conversion rules
- [x] Publish wACP contract source
- [x] Publish SDK skeleton
- [x] Add example payment integration
- [x] Add example wallet connection flow
- [x] Add GitHub issue templates

Sprint 3 - Community + Audit Readiness
- [x] Add public security policy
- [x] Add responsible disclosure process
- [x] Add bridge risk documentation
- [x] Add contract verification guide
- [x] Add public changelog
- [x] Add release tags
- [x] Add testnet deployment guide
- [x] Add audit checklist

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

Status: [~] Repo-side cleanup is tighter, `docs/SECRET_ROTATION_RUNBOOK.md` now captures the operator follow-through checklist, but external secret rotation and access cleanup still require manual credentialed follow-through.

File: a previously tracked provider/config snippet contained a plaintext API key (redacted here; treat as compromised).

Verification (2026-05-25 / 2026-05-28):
- the tracked plaintext-key snippet is absent from the repo
- repo-side token-shaped examples were removed from tracked docs
- repo scan found no other live leaked-token patterns; the only remaining sk-aw-... matches are this roadmap's own remediation notes / grep example
- `scripts/check_secret_hygiene.py` now gives the repo a repeatable tracked-files secret-pattern scan so this verification is executable instead of living only as a one-off grep note
- `.github/workflows/secret-hygiene.yml` now runs that scan on pushes / pull requests, and `.github/workflows/release.yml` also gates tagged releases with the same scan plus `pytest tests/test_secret_hygiene.py -q`
- `docs/SECRET_ROTATION_RUNBOOK.md` now captures the operator-side containment / revoke / replace / evidence checklist so the remaining manual work is explicit instead of living only in status notes

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

Status: [x] Done for the current host/runtime. Repo-side hardening is in place and test-covered, `docs/PRODUCTION_SECRET_BASELINE.md` captures the operator provisioning/evidence checklist, and the current prod-like host runtime now has real required secrets provisioned outside the repo with healthy verification.

Files: \docker-compose.prod.yml\, \pp/config.py\

Verification (2026-05-25):
- `docker-compose.prod.yml` now requires `DATABASE_URL`, `POSTGRES_PASSWORD`, `SECRET_KEY`, `CURSOR_SECRET`, and `CRON_SECRET` without production fallbacks; compose `${VAR:?message}` guards make `docker compose config/up` fail immediately when any required secret is unset, and the API service now explicitly receives `POSTGRES_PASSWORD` too so the app-level production parity guard can validate bundled-postgres `DATABASE_URL` / `POSTGRES_PASSWORD` consistency at runtime instead of only in deploy-script preflight
- `app/config.py` fails fast in `environment=production` when `SECRET_KEY`, `CURSOR_SECRET`, or `CRON_SECRET` are missing/placeholder-like, rejects blank or non-absolute `DATABASE_URL` values and the insecure bundled-db default credentials, rejects placeholder/default DB passwords hidden inside `DATABASE_URL`, URL-decodes bundled-postgres passwords before comparison, and when the bundled compose `postgres` service is targeted - whether via authority host `@postgres:...` or socket/query host `?host=postgres` - it now also requires a real non-default non-placeholder `POSTGRES_PASSWORD` plus exact `DATABASE_URL` / `POSTGRES_PASSWORD` parity
- `scripts/deploy-ancap-cloud.ps1`, `scripts/deploy-ancap-cloud.sh`, and `scripts/rebuild-prod.ps1` now load repo-root `.env`, assert those required production secrets are present (including `POSTGRES_PASSWORD` for the bundled compose postgres service), reject placeholder-like `SECRET_KEY` / `CURSOR_SECRET` / `CRON_SECRET` values before compose startup, reject the insecure default `DATABASE_URL`, reject placeholder/default DB passwords embedded in `DATABASE_URL`, reject `DATABASE_URL` / `POSTGRES_PASSWORD` drift for the bundled compose postgres service (including socket/query-host DSNs such as `?host=postgres`), avoid shadowing compose interpolation with the bridge-only env file, and the bash helper now parses repo-root `.env` directly so CRLF-authored env files do not break preflight on Linux/WSL
- PowerShell deploy/rebuild and bash deploy preflight now also correctly accept URL-encoded bundled-postgres passwords inside `DATABASE_URL` (for example `p%40ss%3Aword`) while still comparing them against the raw `POSTGRES_PASSWORD` value, avoiding false mismatch failures when real secrets contain reserved URL characters, including the socket/query-host `?host=postgres` DSN form and percent-encoded socket-host query variants such as `?host=%70ostgres`
- `tests/test_prod_deploy_scripts.py` now goes beyond string-presence assertions and actually exercises the deploy/rebuild helpers against staged minimal repos, confirming that PowerShell deploy/rebuild and bash deploy can bootstrap required production secrets from a repo-root `.env` without relying on pre-exported shell state, including the CRLF-authored `.env` case for the bash helper and URL-encoded `DATABASE_URL` password handling across authority-host and socket/query-host bundled-postgres DSN variants; it now also directly exercises real `docker compose -f docker-compose.prod.yml config --quiet` success/failure behavior so the compose required-var guard itself is covered, including fail-fast proof that a missing required secret does not dump the other provided secret values to stdout/stderr
- `scripts/deploy-ancap-cloud.ps1` no longer relies on unsupported `??` null-coalescing syntax in Windows PowerShell error/log formatting, so deploy-script preflight failures now surface the intended guard messages instead of a parser error before any real validation runs
- the deploy helpers now also run `docker compose -f docker-compose.prod.yml config --quiet` before any build/start step, so compose interpolation or missing-required-var failures stop the deploy/rebuild path before image work begins without dumping resolved secrets to stdout; the staged-script tests assert that config validation is actually invoked for PowerShell deploy/rebuild and bash deploy, and the deploy helpers expose opt-in `-SkipPostDeployChecks` / `--skip-post-deploy-checks` switches for controlled staged-test contexts while keeping live `/api/v1/system/health`, `/api/v1/system/ready`, and `/internal/frontend-build` verification enabled by default on the real deploy path
- deploy-facing docs now consistently call out those required secrets before production compose startup, including `README.md`, `PRODUCTION_ROADMAP.md`, `.github/RELEASE_PROCESS.md`, and `docs/PRODUCTION_SECRET_BASELINE.md`; they explicitly note that `DATABASE_URL` must include the same real DB password as `POSTGRES_PASSWORD` when targeting the bundled compose postgres service, and the new baseline doc captures the remaining operator-side provisioning / evidence checklist so the manual env/CI follow-through is explicit instead of living only in status notes; the prod-like compose/docs truth now also records that `POSTGRES_PASSWORD` is passed through to the API container so the same parity rule is enforced by app startup in real runtime, not just by helper-script preflight
- current host follow-through is now explicitly verified against real provisioned runtime state, not only repo-side docs/tests: `docker compose -f docker-compose.prod.yml config --quiet` succeeds under the current host secret set, the rendered compose model includes `POSTGRES_PASSWORD` in the API service environment, the required `DATABASE_URL`, `POSTGRES_PASSWORD`, `SECRET_KEY`, `CURSOR_SECRET`, and `CRON_SECRET` values are present from repo-root `.env` with no placeholder-like values, bundled-postgres password parity holds, and `http://127.0.0.1:8080/api/v1/system/health` plus `/api/v1/system/ready` both return healthy responses on the current host
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

Exit criteria: satisfied - dependency update automation is enabled, secret scanning / push protection are on, and dependency PRs get a real review gate instead of relying on docs-only intent.

### 1.3 Add CodeQL scanning [HIGH]

Status: [x] Done. The repo uses an explicit advanced CodeQL workflow, recent real GitHub runs succeeded, and alerts are being published into GitHub code scanning.

File: `/.github/workflows/codeql.yml`

Verification (2026-05-26):
- `.github/workflows/codeql.yml` scans Python, JavaScript/TypeScript, and GitHub Actions on push / pull_request plus the weekly Monday 06:00 UTC schedule
- recent successful real CodeQL runs on `master`:
  - `26463212516` - `fix(frontend): remove duplicate page backgrounds after layout rollout`
  - `26460632345` - `fix(ci): harden e2e smoke and system jobs guards`
  - `26460162797` - `fix(ci): stabilize frontend e2e smoke and golden path`
- `GET /repos/dragoncattrx-hub/ancap/code-scanning/alerts` returns live CodeQL results (currently 89 open alerts; sample rule: `js/unused-local-variable` created `2026-05-26T16:09:58Z`), proving the workflow is publishing findings into GitHub code scanning
- `GET /repos/dragoncattrx-hub/ancap/code-scanning/default-setup` currently reports `state: not-configured`, which is expected because this repo uses the explicit workflow above instead of GitHub's default setup wizard

Exit criteria: satisfied - CodeQL is running on the intended languages in real GitHub Actions and feeding the code-scanning surface.

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

Exit criteria: satisfied - the same E2E path now runs successfully in GitHub Actions on a real push.

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

Exit criteria: satisfied - public endpoints return < 200ms without external I/O, and deep diagnostics remain internal/admin-protected.

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

Exit criteria: satisfied - the scheduled path now uses the async enqueue route, returns in < 1s, and heavy work completes in background job records instead of the scheduler request path.

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

Exit criteria: satisfied - pool ownership is implemented, verified, and documented; any future product decision to forbid legacy null-owner pools is a separate tightening pass, not unfinished core ownership work.

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

Exit criteria: satisfied - no Bearer tokens are stored in localStorage for auth and CSRF protection is active on cookie-authenticated unsafe routes.

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

Exit criteria: satisfied - browser preflight/runtime verification is in place and any future route-specific header expansion must be added deliberately to the explicit CORS allowlist.

### 3.3 Production security header alignment [LOW]

Status: [x] Done. Inner prod proxy, outer origin nginx, and public Cloudflare-routed responses are now aligned on the canonical security-header set.

Files: `infra/nginx/default.conf`, production nginx config

Verification (2026-05-28):
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
- production follow-through on the server was completed:
  - `/opt/ancap-migration/current/infra/nginx/default.conf` on `ancap-server` already contains `proxy_hide_header` rules for proxied locations
  - `docker compose -f docker-compose.prod.yml exec -T proxy nginx -t` on `ancap-server` succeeds
  - `docker compose -f docker-compose.prod.yml exec -T proxy nginx -s reload` on `ancap-server` succeeds
  - direct origin checks now show the inner container proxy is clean: `http://127.0.0.1:8080/api/v1/system/health` returns a single canonical set
  - direct HTTPS-to-origin checks with `Host: ancap.cloud` / `Host: api.ancap.cloud` initially exposed duplicate headers at the outer nginx layer, so the outer vhost files under `/etc/nginx/conf.d/domains/*.conf` and `*.ssl.conf` were patched to hide upstream security headers before `proxy_pass`, then `sudo systemctl reload nginx` was applied
  - after that outer-nginx patch, direct origin HTTPS checks return the canonical single set (`DENY`, `nosniff`, `strict-origin-when-cross-origin`, `camera=(), microphone=(), geolocation()`, HSTS) with no duplicates
- public Cloudflare-routed responses are now aligned with origin truth too:
  - `https://ancap.cloud/api/v1/system/health` now returns `X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin`
  - `https://api.ancap.cloud/v1/system/health` now returns the same canonical set while preserving the origin debug header `X-Debug-Vhost: api-https`
  - both public endpoints now return the expected `Permissions-Policy: camera=(), microphone=(), geolocation()` and `Strict-Transport-Security: max-age=31536000; includeSubDomains` headers too
- `tests/test_nginx_security_headers.py` still guards the in-repo nginx config so proxied locations must hide upstream security headers before re-adding the canonical set

Exit criteria: satisfied - local, origin, and public Cloudflare-routed responses now match the intended single-source-of-truth security header set.

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

Status: [x] Done. Creator payout requests, admin review, ledger hold/refund handling, migration history, and repo tests are implemented. Remaining future work is payout automation/completion depth, not the baseline withdrawal flow itself.

Implemented surfaces:
- `POST /v1/payouts/request` -- creator requests ACP withdrawal
- `GET /v1/payouts` -- creator lists own payout requests and filters by status
- `GET /v1/admin/payouts` -- platform admin lists all payout requests
- `POST /v1/admin/payouts/{id}/approve` -- platform admin approves a pending request and records the approval event
- `POST /v1/admin/payouts/{id}/reject` -- platform admin rejects a pending request and refunds the held balance

Model in repo:
- `PayoutRequest` with status `pending|approved|rejected|completed|failed`
- methods: `acp_wallet|bsc_address|bank_transfer`
- amount/destination/admin notes + request/approval/rejection ledger event links
- migration `57b0c4a8d9ef_add_payout_requests.py`

Verification (2026-05-27):
- `app/db/models.py` contains `PayoutRequest` plus `PayoutRequestStatusEnum`
- `app/api/routers/payouts.py` implements creator request/list and admin approve/reject/list routes behind auth / platform-admin enforcement
- create-request flow fails closed on non-ACP currency, non-positive amount, insufficient balance, and duplicate in-progress payout requests
- create-request flow places the requested amount on ledger hold immediately; rejection restores the held ACP; approval leaves the hold in place while recording admin approval metadata for downstream/manual settlement
- `tests/api/test_payouts.py -q` ✅ (`8 passed`) covering hold behavior, insufficient balance, duplicate prevention, admin auth, approve/reject, filters, and terminal-state reprocessing guards

Exit criteria: satisfied -- creator can request payout, and admin can approve/reject it. Full automatic on-chain payout completion can be layered later without reopening this baseline item.

### 4.3 Creator earnings dashboard [MEDIUM]

Status: [x] Done. Creator earnings/conversion endpoints, seller dashboard UI, timeline chart, and CSV export are implemented and passing validation. Remaining future work is deeper funnel instrumentation for views/add-to-cart/checkout-started, not the baseline creator earnings surface.

Implemented surfaces:
- `GET /v1/creators/me/earnings` -- total/window revenue, pending payout, paid out, workflow breakdown, per-day earnings timeline
- `GET /v1/creators/me/conversions` -- listing/period conversion counts with explicit funnel coverage metadata
- `/dashboard/seller/earnings` -- seller-facing revenue cards, workflow breakdown, conversion coverage panel, daily line chart, CSV export
- seller dashboard quick-link now points creators directly to the new earnings page

Verification (2026-05-27):
- `app/api/routers/creators.py` aggregates creator-owned listing revenue from paid ACP orders and payout backlog/completions
- `app/schemas/creators.py` defines the public response contracts for earnings timelines and conversion summaries
- `tests/api/test_creators.py -q` ✅ (`3 passed`) covering earnings aggregation, conversion coverage defaults, and auth enforcement
- `pytest tests/api/test_creators.py tests/api/test_payouts.py -q` ✅ (`11 passed`) confirming the earnings dashboard slice stays consistent with payout-hold/refund behavior
- `npm run build` in `frontend-app` ✅, including the new `/dashboard/seller/earnings` route in the production build output

Exit criteria: satisfied -- creators can inspect revenue by workflow/day, see pending vs paid payout state, export CSV, and understand current funnel coverage limits.

### 4.4 Subscriptions for workflows [MEDIUM]

Status: [x] Done. Workflow subscription pricing, buyer subscribe flow, renewal scheduler, retry/pause notifications, and marketplace/listing UI support are implemented and validated. Remaining future work belongs to broader monetization depth, not this baseline subscription item.

Implemented surfaces:
- `POST /v1/subscriptions` -- start a subscription for an active listing with monthly/quarterly/annual ACP billing
- `GET /v1/subscriptions` -- list the caller's subscriptions with status filtering and cursor pagination
- scheduler integration via `POST /v1/system/jobs/tick` / `subscriptions_tick(...)` for due renewals
- creator listing publish flow now supports subscription price tiers on strategy/listing surfaces
- marketplace + listing detail UI now supports choosing billing period and starting subscriptions

Model in repo:
- `Subscription` (id, user_id, listing_id, plan_id, status: active|paused|cancelled|past_due, billing_period: monthly|quarterly|annual, price_acp, next_billing_at, auto_renew, retry_count, last_order_id)
- migration `9f1c7a4b2d10_add_subscriptions.py`

Scheduler behavior (implemented):
- On `next_billing_at`: check ledger -> debit buyer -> credit seller -> create renewal order -> extend access grant -> mark renewed
- If insufficient balance: retry up to 3 times with 3-day intervals, then pause + notify
- If listing becomes unavailable: pause + notify

Verification (2026-05-28):
- `app/api/routers/subscriptions.py` implements create/list subscription routes with ACP-only pricing validation and insufficient-balance / duplicate guards
- `app/jobs/subscriptions_tick.py` renews due subscriptions, records renewal orders/transfers, emits low-balance + paused + renewed notifications, and pauses inactive-listing subscriptions
- `frontend-app/src/app/strategies/[id]/page.tsx`, `frontend-app/src/app/listings/[id]/page.tsx`, `frontend-app/src/app/listings/page.tsx`, and `frontend-app/src/app/marketplace/page.tsx` expose subscription pricing and purchase flows in the UI
- `pytest tests/api/test_subscriptions.py -q` ✅ (`4 passed`)
- `docker compose exec -T api alembic upgrade head` ✅
- clean `npm run build` in `frontend-app` ✅ after clearing stale `.next` cache artifacts from a previous build attempt

Exit criteria: satisfied -- creators can offer subscription plans, users can subscribe, and billing auto-renews with retry/pause handling.

### 4.5 API monetization depth [MEDIUM]

Status: [x] Done. Usage export, per-agent spend caps, per-endpoint / per-org-key spend caps, cost-plus margin snapshots, and admin revenue reporting now exist in repo and are test-covered.

Implemented / verified (2026-05-28):
- `GET /v1/paid-api/me/usage/export` -- monthly usage export CSV for callers
- `POST /v1/paid-api/agents/{agent_id}/spend-cap` -- per-agent monthly spend caps stored on agent metadata
- `PATCH /v1/organizations/{org_id}/api-keys/{key_id}` -- per-endpoint / per-currency monthly spend caps stored on org or org-attached agent API keys
- paid API usage events now persist `provider_cost`, `estimated_margin`, `api_key_id`, and org attribution metadata for captured charges
- `GET /v1/paid-api/revenue-summary` -- platform-admin-only gross / provider-cost / margin summary grouped by endpoint, period, and organization
- org attribution now survives agent-owned API keys after agent -> organization transfer by falling back to `Agent.metadata_.org_id` when the key itself is not org-owned
- verification:
  - `pytest tests/api/test_paid_api.py tests/api/test_organizations.py -q` ✅
  - `pytest tests/api/test_paid_api.py tests/api/test_organizations.py tests/test_release_workflow.py tests/test_open_source_examples.py tests/test_public_trust_docs.py -q` ✅

### 4.6 Referral commission auto-payout [MEDIUM]

Status: [x] Done. Referral reward issuance, optional on-chain payout job enqueueing, jobs-tick execution, and runtime/deploy env wiring are implemented and now covered by repo tests.

Implemented behavior:
- first paid ACP workflow capture issues both `referral_signup_bonus` and `referral_commission_share` reward events idempotently
- reward issuance credits the beneficiary ledger immediately while preserving ledger invariants
- when `REFERRAL_ONCHAIN_PAYOUT_ENABLED=true` and the ACP wallet runtime is configured, ACP beneficiary wallets also receive queued `referral_onchain_payout_jobs`
- `POST /v1/system/jobs/tick` processes pending referral payout jobs through the ACP wallet helper and records `sent` / retryable `pending` / terminal `failed` outcomes
- admin economy-health diagnostics expose `pending_referral_payout_jobs` and `failed_referral_payout_jobs`
- production compose/env/docs now pass through `REFERRAL_ONCHAIN_PAYOUT_ENABLED`, `REFERRAL_ONCHAIN_PAYOUT_KEYSTORE_FILE`, and `REFERRAL_ONCHAIN_PAYOUT_FEE_ACP`

Verification:
- `pytest tests/api/test_ai_console_wave1.py -q` ✅
- `pytest tests/api/test_ai_console_wave1.py tests/test_prod_deploy_scripts.py tests/api/test_workflow_store.py tests/api/test_system_economy_health.py -q` ✅

Remaining future work: richer payout operations/monitoring may still be layered later, but the baseline referral commission auto-payout path itself is no longer missing.

### 4.7 Marketplace search + filters [MEDIUM]

Status: [x] Done. Marketplace discovery now exposes server-side search/filter/sort, returns listing popularity/rating metadata, and records listing-open view activity for discovery ranking.

Implemented / verified (2026-05-28):
- `GET /v1/listings/marketplace/listings` now supports `search`, `category`, `price_min`, `price_max`, `sort` (`popular|recent|price_asc|price_desc|rating`), `limit`, and `offset`
- PostgreSQL FTS is connected to marketplace discovery via `to_tsvector(...)` / `plainto_tsquery(...)` over strategy + vertical fields, with `ILIKE` fallback matching on names/descriptions/notes/ids
- marketplace responses now include computed `price`, `listing_purchases`, `listing_views`, `rating`, `rating_count`, `is_featured`, `is_trending`, and `available_categories`
- `GET /v1/listings/{id}` now records a lightweight public `listing_opened` activity event so discovery view counts are backed by real runtime events instead of docs-only intent
- frontend marketplace page now consumes the server-side marketplace API directly and exposes live search, category filter, min/max price, popular/newest/price/rating sort, plus featured/trending merchandising badges
- verification:
  - `pytest tests/test_listings_orders.py -q` ✅
  - `pytest tests/test_listings_orders.py tests/api/test_ai_console_wave1.py -q` ✅
  - `npm run build` in `frontend-app` ✅
  - `docker compose -f docker-compose.prod.yml config --quiet` ✅

Remaining future work: richer dedicated view-tracking instrumentation and deeper recommendation logic can still be layered later, but the roadmap baseline marketplace search/filter/discovery slice itself is no longer missing.

### 4.8 Chargebacks and dispute UI [MEDIUM]

Status: [x] Done baseline. Refund requests now have a persistent backend model, user initiation path, user-visible status, and admin approve/reject review surface wired into the workflow payment ledger trail.

Implemented / verified (2026-05-28):
- `RefundRequest` persistence model + migration with pending/approved/rejected states, user/admin indexes, notes, timestamps, and refund-ledger linkage
- `POST /v1/payments/refund-request` lets users open a refund request against a captured workflow payment intent
- `GET /v1/payments/my-refund-requests` exposes user-visible refund status/history, optionally filtered by payment intent
- `GET /v1/payments/refund-requests` remains platform-admin-only for review queue listing
- `POST /v1/admin/refund-requests/{id}/approve` credits the user ledger back, marks the payment intent refunded, updates proof trail metadata, and emits refund webhook events best-effort
- `POST /v1/admin/refund-requests/{id}/reject` closes the request with admin notes without crediting balance
- workflow run detail UI now exposes refund/dispute submission for completed captured runs and shows current request status inline
- admin overview now shows pending refund requests with approve/reject actions next to existing top-up approvals
- verification:
  - `pytest tests/api/test_refund_requests.py -q` ✅
  - `npm run test -- --run src/lib/__tests__/api.test.ts` in `frontend-app` ✅
  - `npm run build` in `frontend-app` ✅
  - `docker compose -f docker-compose.prod.yml config --quiet` ✅

Remaining future work: deeper dispute evidence capture, external fiat-provider chargeback sync, and richer customer-facing refund history UX can still be layered later, but the roadmap baseline refund / dispute / chargeback slice itself is no longer missing.

---

## Priority 5 -- Mobile wallet completion

### 5.1 Unblocked items (no native FFI dependency)

| ID | Task | Status |
|----|------|--------|
| P4-8 | PIN + biometrics | [~] wired, real device verification pending |
| P4-9 | SecureVault | [~] SecureStore wired, biometric migration done, verification pending |
| P4-15 | i18n EN/RU/UK/DE | [x] react-i18next wired in the Expo app with persisted language selection and translated core wallet flows/screens |
| P5-1 | MASVS L1 checklist | [~] repo-baseline closed in `docs/mobile/SECURITY_MODEL.md` (hashed PIN verifier, device-only secure storage, biometric-gated vault migration, error redaction, screenshot/clipboard/auto-lock controls); remaining closure is real-device/native release verification |
| P5-5 | No secrets in Sentry/logs | [x] mobile wallet error surfaces now route thrown messages through a shared secret-redacting helper; mnemonic/keystore/rawTx/bearer-token shaped values are scrubbed before UI/log propagation |
| P6-3 | Device matrix (iOS + Android) | [~] matrix/checklist doc added in `docs/mobile/DEVICE_MATRIX.md`; real device runs still pending |
| P6-4 | TestFlight + Play Internal | [~] release-readiness checklist added in `docs/mobile/RELEASE_CHECKLIST.md`; real uploads still pending |
| P6-5 | Store listing + legal pages | [~] legal routes exist and release pack is outlined in `docs/mobile/RELEASE_CHECKLIST.md`; final operator/assets review still pending |
| P6-6 | Production v1.0.0 | [~] final release gate is now scaffolded in `docs/mobile/RELEASE_RUNBOOK.md`; real native/device/store execution still pending |

### 5.2 Native-build-dependent items

| ID | Task | Status / blocker |
|----|------|------------------|
| P1-6 | Android FFI `.so` build | [x] `ancap-mobile/scripts/build-android-native.ps1` now succeeds on the current Windows host with Android SDK/NDK installed, emitting `arm64-v8a`, `armeabi-v7a`, and `x86_64` `libacp_mobile_ffi.so` artifacts into `ancap-mobile/modules/expo-acp-core/android/src/main/jniLibs` |
| P4-3 | Create wallet via FFI | [~] Android native artifacts now exist, but Expo Android dev-build/runtime verification is still pending and iOS still depends on P1-7 |
| P4-11 | Send + preview + sign | [~] Android native artifacts now exist, but end-to-end native sign/broadcast verification is still pending on real Android runtime and iOS still depends on P1-7 |
| P1-7 | iOS Swift UniFFI link | [~] Run `ancap-mobile/scripts/build-ios-native.ps1` on macOS/Xcode and verify packaged artifacts |

### 5.3 Smart QR Pay / AI Payment Scanner / Claim Codes track (v1.1 / v2, after wallet release closure)

Status: [~] First-scope Smart Pay groundwork is implemented beyond docs-only intent: backend `capabilities` + deterministic `parse` + `quote` + execute/status/recover endpoints exist in repo code with API tests, typed mobile client methods exist with client tests, and the Expo beta flow already supports paste, QR import, camera scan, review, execute, refresh/recover, and session restore. The broader **AI Payment Scanner** (photo / OCR / invoice decode), real route execution beyond placeholder orchestration, and **ANCAP Claim Codes** layers are still **not shipped** and must not be marketed as live.

Product formula inside this track:
- `Photo / QR -> AI Decode -> Payment Intent -> Smart Swap -> Pay`
- `Lock crypto -> Generate claim code -> Share code -> Redeem -> Receive crypto`

Execution order inside this track:
1. [x] docs/spec split: plan + schema + API + security
2. [x] backend `GET /v1/mobile/smart-pay/capabilities`
3. [x] backend `POST /v1/mobile/smart-pay/parse` (deterministic ACP + raw EVM + EIP-681 first scope)
4. [x] backend `POST /v1/mobile/smart-pay/quote` for first supported routes
5. [x] backend execution-session groundwork:
   - `POST /v1/mobile/smart-pay/execute`
   - `GET /v1/mobile/smart-pay/payments/{executionId}`
   - `POST /v1/mobile/smart-pay/payments/{executionId}/recover`
6. [x] mobile SDK/client wiring for Smart Pay endpoints (`@ancap/acp-api-client` typed methods plus client tests cover capabilities/parse/quote/execute/status/recover)
7. [~] Expo app scan/import/pay UX (beta screen now supports paste, gallery QR import, camera QR scan, explicit confirmation before execute, refresh/recover, and persisted draft/session restore in-device; polished UX/history and real route execution still pending)
8. [ ] real route engine / bridge-swap execution integration (still blocked on local non-custodial EVM spend/sign closure plus backend route orchestration beyond placeholder sessions)
9. [ ] AI fallback classifier for ambiguous payloads (only after deterministic/heuristic path is solid)
10. [~] receipt/history/recovery UX hardening
   - Expo beta now persists recent device-local Smart Pay session snapshots, supports tap-to-resume, fetches backend receipt snapshots, and renders a richer receipt summary from receipt/intent/quote/execution data
   - backend payment-history listing, final receipt polish, and route-execution-linked proof surfaces still remain
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

Status: [x] Done. The abandoned Cloudflare Workers repo path was removed; Docker/containerized deploy is now the single repo-declared production path.

Problem: Two conflicting deployment paths:
1. Docker/Containerized: `frontend-app/Dockerfile` + `docker-compose.prod.yml` (confirmed working)
2. Cloudflare Workers: `wrangler.jsonc` + static framework (appeared abandoned)

PR #1 had added Cloudflare Workers config but actual production uses the containerized approach.

Implemented:
- removed stale `wrangler.jsonc` from the repo
- kept Docker/nginx deployment as the canonical production path
- aligned repo state with the already-working production topology instead of keeping a broken parallel build path

Verification (2026-05-27):
- repo no longer contains `wrangler.jsonc`
- production deploy path remains `docker-compose.prod.yml` + deploy scripts
- GitHub/Cloudflare no longer have a repo-declared abandoned Workers config to treat as a build source

### 6.2 Dependency management consolidation [MEDIUM]

Status: [x] Done. Runtime dependency inputs are now centralized in `requirements.in`, `requirements.txt` is the generated runtime lock, packaging metadata imports runtime deps from that same source, and CI/release workflows install a single `.[dev]` package definition instead of drifting between separate lists.

Problem: `requirements.txt` (exact pins) and `pyproject.toml` (range pins) coexist.

Implemented:
- added `requirements.in` as the runtime dependency input file for backend image / Python CI installs
- `requirements.txt` is now explicitly the generated runtime lock target for `python -m piptools compile --generate-hashes --output-file requirements.txt requirements.in` and is regenerated in-repo with hashes from that source
- `pyproject.toml` now uses setuptools dynamic metadata to import runtime dependencies from `requirements.in`
- `pyproject.toml` now defines a `dev` extra for Python test/security tooling (`pytest`, `pytest-asyncio`, `bandit`)
- backend CI and release workflows now install `pip install .[dev]` instead of maintaining a second manual test-tool list
- dependency-review workflow now also triggers on `requirements.in`
- contributor/release docs now describe the regenerate-lock flow explicitly
- `tests/test_dependency_management_consolidation.py` locks the new source-of-truth wiring into repo coverage

Verification (2026-05-28):
- `requirements.in` exists and contains the backend runtime dependency set
- `requirements.txt` documents the `piptools compile` regeneration path and no longer pretends to be a hand-maintained mixed runtime+dev list
- `pyproject.toml` imports runtime deps from `requirements.in` and exposes the `dev` extra
- `.github/workflows/backend-ci.yml` and `.github/workflows/release.yml` install `.[dev]`
- `pytest tests/test_dependency_management_consolidation.py tests/test_dependency_review_workflow.py tests/test_release_workflow.py tests/test_prod_deploy_scripts.py -q` ✅

### 6.3 Formal releases and tags [MEDIUM]

Status: [x] Done. A real tag-triggered GitHub release workflow is now in repo and test-covered.

Problem: No GitHub Releases / tags. \LOG.md\ is the changelog.

Implemented:
- `.github/workflows/release.yml` now runs on `push.tags: ["v*"]`
- backend release gate runs Alembic, `pytest -q`, Bandit, and `docker build -t ancap:release-check .`
- frontend release gate runs `npm test -- --run`, `npm run lint`, and `npm run build`
- final `draft-release` job waits on both gates and uses `softprops/action-gh-release@v1` with `draft: true` and `generate_release_notes: true`
- `tests/test_release_workflow.py` locks the release trigger, gate jobs, and draft-release behavior into CI coverage

Verification (2026-05-27):
- `pytest tests/test_release_workflow.py -q` ✅
- release workflow file present in repo at `.github/workflows/release.yml`

Policy: every merge to master touching \app/\ or \frontend-app/\ -> bump patch. Feature branches -> minor. Breaking changes -> major. Tag format: \vYYYY.MM.DD\ or \vMAJOR.MINOR.PATCH\.

### 6.4 Documentation health [LOW]

Status: [x] Done. The old frontend audit is now explicitly marked superseded, roadmap/audit support docs now carry `Last verified` headers, and `docs/STATUS_MATRIX.md` remains the compact status authority beneath `MASTER_ROADMAP.md`.

Tasks:
- Mark \docs/AUDIT-2026-04-29.md\ as superseded
- Add \> Last verified: YYYY-MM-DD\ header to all roadmap and audit docs
- Create \docs/STATUS_MATRIX.md\ -- single source of truth mapping every component to status

Verification (2026-05-28):
- `docs/AUDIT-2026-04-29.md` now declares itself superseded and records `Last verified: 2026-05-28`
- `PRODUCTION_ROADMAP.md`, `ROADMAP.md`, `ROADMAP-MONETIZATION.md`, and `docs/mobile/ROADMAP.md` now carry `Last verified: 2026-05-28`
- `docs/STATUS_MATRIX.md` remains aligned with the current roadmap truth, including the now-baseline-done dependency-consolidation slice

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



