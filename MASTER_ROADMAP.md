# ANCAP Master Roadmap

> Status: active | Major revision: 2026-05-25
> Created: 2026-05-23 | Last updated: 2026-05-25
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

## Source documents this roadmap supersedes

- \PRODUCTION_ROADMAP.md\ -- merged into this document
- \ROADMAP-MONETIZATION.md\ -- merged into this document
- \docs/mobile/ROADMAP.md\ -- merged into Priority 5 section
- \docs/bridge-next-steps.md\ -- merged into Priority 4 section
- \docs/DELIVERY_BOARD.md\ -- archived
- \docs/openclaw-kiro-snippet.json5\ -- **DELETE. Do not use as reference. Contains leaked secret.**

---

## Priority 0 -- EMERGENCY (fix before next deploy)

### 0.1 Leaked API key remediation [CRITICAL]

Status: [~] Repo-side cleanup is now tighter and no longer includes token-shaped example strings in tracked docs. Provider-side revocation/rotation and GitHub settings changes still require credentialed manual follow-through.

File: `docs/openclaw-kiro-snippet.json5` previously contained a plaintext API key (redacted here; treat as compromised).

Verification (2026-05-25):
- `docs/openclaw-kiro-snippet.json5` is absent from the repo
- `docs/openclaw-kiro-config.md` now documents env-only key handling, avoids direct key embedding, and uses a neutral placeholder instead of a token-shaped example
- repo scan found no other live leaked-token patterns; the only remaining `sk-aw-...` matches are this roadmap's own remediation notes / grep example

Action (in order):
1. Revoke the key at the provider (kiro.cheap / Kiro API dashboard)
2. Generate a new key and store only in CI secrets / env management
3. Delete \docs/openclaw-kiro-snippet.json5\ or replace with template using env vars
4. Review \docs/openclaw-kiro-config.md\ -- do not document direct key-in-config patterns
5. Search entire repo for any other leaked secrets:
   \\\ash
   grep -rn "sk-aw-\|sk-prod-\|sk_live_\|ghp_\|ghs_\|gho_" . \
     --include="*.py" --include="*.json*" --include="*.yml" \
     --include="*.yaml" --include="*.ts" --include="*.tsx" 2>/dev/null
   \\\
6. Enable GitHub secret scanning: Settings > Code security and analysis > Secret scanning > On + Push protection > On

Reference: GitHub Docs -- any exposed secret = assume compromised, revoke immediately.

### 0.2 Insecure dev defaults in production configs [CRITICAL]

Status: [~] Repo-side hardening is in place and test-covered; production deployment still needs real secrets supplied in env/CI.

Files: \docker-compose.prod.yml\, \pp/config.py\

Verification (2026-05-25):
- `docker-compose.prod.yml` now requires `DATABASE_URL`, `POSTGRES_PASSWORD`, `SECRET_KEY`, `CURSOR_SECRET`, and `CRON_SECRET` without production fallbacks; compose `${VAR:?message}` guards make `docker compose config/up` fail immediately when any required secret is unset
- `app/config.py` fails fast in `environment=production` when `SECRET_KEY`, `CURSOR_SECRET`, or `CRON_SECRET` are missing/placeholder-like, rejects blank `DATABASE_URL` or the insecure `postgres:postgres` default, rejects placeholder/default DB passwords hidden inside `DATABASE_URL`, and now also rejects mismatches between `DATABASE_URL` and `POSTGRES_PASSWORD` when the bundled compose `postgres` service is targeted
- `scripts/deploy-ancap-cloud.ps1`, `scripts/deploy-ancap-cloud.sh`, and `scripts/rebuild-prod.ps1` now load repo-root `.env`, assert those required production secrets are present (including `POSTGRES_PASSWORD` for the bundled compose postgres service), reject placeholder-like `SECRET_KEY` / `CURSOR_SECRET` / `CRON_SECRET` values before compose startup, reject the insecure default `DATABASE_URL`, reject placeholder/default DB passwords embedded in `DATABASE_URL`, reject `DATABASE_URL` / `POSTGRES_PASSWORD` drift for the bundled compose postgres service, avoid shadowing compose interpolation with the bridge-only env file, and the bash helper now parses repo-root `.env` directly so CRLF-authored env files do not break preflight on Linux/WSL
- `tests/test_prod_deploy_scripts.py` now goes beyond string-presence assertions and actually exercises the deploy/rebuild helpers against staged minimal repos, confirming that PowerShell deploy/rebuild and bash deploy can bootstrap required production secrets from a repo-root `.env` without relying on pre-exported shell state, including the CRLF-authored `.env` case for the bash helper
- deploy-facing docs now consistently call out those required secrets before production compose startup, including `README.md`, `PRODUCTION_ROADMAP.md`, `.github/RELEASE_PROCESS.md`, and the bridge pilot env example note, and they now explicitly note that `DATABASE_URL` must include the same real DB password as `POSTGRES_PASSWORD` when targeting the bundled compose postgres service
- `pytest tests/test_config_admin_ids.py tests/test_system.py tests/test_prod_deploy_scripts.py -q` passes with coverage for the production secret guard, deploy-script preflight rejection of placeholder-like app secrets and insecure/default DB settings, repo-root `.env` bootstrap behavior, `DATABASE_URL` / `POSTGRES_PASSWORD` mismatch rejection, and cron-secret-gated jobs endpoints

Fix:
- \secret_key\ must not have a fallback default in production-configured files -- must be a required env var with no insecure fallback
- \cursor_secret\ dev fallback must not exist in any file that could be docker-compose-prodd
- production \DATABASE_URL\ must not silently keep the insecure local `postgres:postgres` default
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

Status: [~] Repo file exists and covers pip, frontend npm, mobile npm, and GitHub Actions; GitHub-side toggles still need to be enabled in repository settings.

File to add: \.github/dependabot.yml\

\\\yaml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 10
  - package-ecosystem: "npm"
    directory: "/frontend-app"
    schedule: { interval: "weekly" }
  - package-ecosystem: "npm"
    directory: "/ancap-mobile"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
\\\

Also enable in GitHub Settings:
- Dependency review
- Secret scanning (push protection on)
- Code scanning > Add workflow > CodeQL (Python + JavaScript/TypeScript + GitHub Actions)

### 1.3 Add CodeQL scanning [HIGH]

Status: [~] Workflow exists and now covers Python, JavaScript/TypeScript, and GitHub Actions on PR/push plus the weekly 06:00 UTC schedule; GitHub-side code-scanning enablement still needs repository settings access.

File to add: \.github/workflows/codeql.yml\

Languages: python, javascript, typescript, github-actions
Queries: security-and-quality
Schedule: weekly (Mondays 06:00 UTC)

### 1.4 Playwright E2E in CI [HIGH]

Status: [~] Workflow job exists and is now wired to boot backend services, build/start the frontend, and run Playwright against a real local UI/API pairing in CI. Still needs a live GitHub run to confirm timing/stability.

Status: Playwright browsers are installed in frontend CI but tests are never run.

Current blocker: No backend service + postgres in the same job.

Fix: Add an \e2e-tests\ job to \rontend-ci.yml\ that:
1. Starts services via \docker-compose up -d\ (api + postgres + redis)
2. Waits for health: \until curl -sf http://localhost:8080/api/v1/system/health; do sleep 5; done\
3. Runs \
px playwright test\ against \http://localhost:8080\
4. Reports results

Files needed: \playwright.config.ts\ already exists, E2E specs already exist in \rontend-app/e2e/\

Exit criteria: E2E tests run on every PR touching \rontend-app/\ or \pp/\.

### 1.5 RESTRICT ops/diagnostics endpoints [HIGH]

Status: [~] Repo-side tier split and platform-admin protection are now implemented/test-covered. Proxy exposure is already broad `/api` passthrough in `infra/nginx/default.conf`, so no extra proxy rule was required in-repo; live latency/production verification still remains.

Files: \pp/api/routers/system.py\, nginx/proxy config

Problem:
- \GET /system/health/full\ does external LLM probe on every request
- \GET /system/economy-health\ pings ACP RPC, returns operational details
- \GET /system/diagnostics\ exposes \cp_rpc_url\, driver info
- All of the above are unauthenticated

Fix: Split into three tiers:
- **Tier 1 -- liveness**: \GET /system/health\ (DB + Redis only, no external I/O, < 50ms)
- **Tier 2 -- readiness**: \GET /system/ready\ (local checks, no external HTTP)
- **Tier 3 -- deep diagnostics** (internal only, platform-admin auth required):
  - \GET /internal/ops/deep-health\
  - \GET /internal/ops/diagnostics\
  - LLM probe: run async in background, cache result 60s
  - ACP RPC probe: run async in background, cache result 30s

Exit criteria: Public endpoints return < 200ms without external I/O.

### 1.6 Separate jobs_tick from HTTP [HIGH]

Status: [~] Async enqueue endpoint now returns `202 Accepted`, uses an isolated DB session in the background task, persists queued/retry/dead-letter state in `system_job_runs`, has targeted retry/dead-letter test coverage, and a scheduled GitHub Actions workflow now calls the async route every 5 minutes. Live GitHub/deployment verification still remains.

File: \pp/api/routers/system.py\

Problem: \POST /system/jobs/tick\ runs 20+ sequential jobs (edges_daily, agent relationships, auto limits, circuit breaker, reputation, referrals, notifications, leaderboards, activity feed, governance checks, graph enforcement, staking rewards, ledger invariant check, bridge reconciliation, mobile indexer) -- all in one HTTP request. This is a mini-orchestrator in a request handler.

Fix: Hybrid approach:
- \POST /system/jobs/tick/async\ -- enqueues job, returns \202 Accepted\ immediately (background task via FastAPI BackgroundTasks or Redis queue)
- \POST /system/jobs/tick\ -- kept for manual emergency ops triggers only
- Add GitHub Actions scheduled workflow (runs every 5 min) that calls \/system/jobs/tick/async\
- Jobs run with retry and dead-letter queue

Exit criteria: \POST /system/jobs/tick\ returns in < 1s. Heavy jobs run asynchronously.

---

## Priority 2 -- Domain model and skipped tests

### 2.1 Pool ownership model [HIGH]

Status: [~] Core repo/model work is now in place and test-covered. `Pool.owner_agent_id` and its migration already exist; pool create/read APIs now expose the field, and `POST /v1/ledger/allocate` now follows the intended rule: owner-enforced when set, backward-compatible when unset.

Files: `app/db/models.py` (Pool class), `alembic/versions/911774c4bec4_add_owner_agent_id_to_pools.py`, `app/api/routers/pools.py`, `app/api/routers/ledger.py`, `tests/test_ledger.py`, `tests/test_pools.py`

Verification (2026-05-25):
- `Pool.owner_agent_id` already exists in `app/db/models.py`
- migration `911774c4bec4_add_owner_agent_id_to_pools.py` already adds the column in-repo
- pool create/get/list responses now include `owner_agent_id`
- creating a pool can now optionally validate and persist `owner_agent_id`
- `POST /v1/ledger/allocate` now:
  - requires caller ownership when `pool.owner_agent_id` is set
  - allows authenticated backward-compatible allocation when it is unset
- targeted pool + ledger tests pass, including owner-enforced and unowned-backward-compat cases

Remaining follow-through:
- if strict product policy later decides all pools must become owned, add a backfill/cleanup plan for legacy null-owner pools before tightening the backward-compat path
- README/API docs now mention `owner_agent_id`; re-check any external/public docs later if that surface expands

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

Status: [~] Repo-side browser auth flow now prefers HttpOnly `ancap_token` cookies instead of JS-readable token storage. Frontend bootstrap now resolves auth from `/users/me`, shared API requests send `X-Requested-With`, and the previously remaining client-side direct authenticated `fetch("/api/...")` mutation/read surfaces were moved onto shared API helpers. Remaining follow-through is live browser/runtime verification against deployed/staging surfaces.

Files: `frontend-app/src/components/AuthProvider.tsx`, `frontend-app/src/lib/api.ts`, `app/api/deps.py`, `app/api/routers/auth.py`, `frontend-app/e2e/*.spec.ts`

Verification (2026-05-25):
- `AuthProvider` no longer depends on `auth.getToken()` to decide signed-in bootstrap; it restores cached user display data only and then resolves real auth from `/users/me`
- frontend shared API client now always sends `X-Requested-With: XMLHttpRequest`
- `frontend-app/src/lib/api.ts` now centralizes raw authenticated fetch helpers (`apiFetchRaw` / shared headers), and the admin overview, funds create, vertical propose, profile loads, agent follow/unfollow, logout, and workflow revenue CSV export flows now all use that shared path instead of bespoke client-side fetch calls
- cookie-authenticated unsafe requests now fail closed in `app/api/deps.py` unless `X-Requested-With` is present, while explicit Bearer-token clients remain allowed
- auth cookie set/clear paths now use `SameSite=strict`
- Playwright UI auth seeders now stage `ancap_token` as a cookie and only keep `ancap_user` in localStorage for UI display bootstrap
- `pytest tests/test_auth.py tests/test_system.py tests/api/test_system_economy_health.py -q` passes
- `npm run build` in `frontend-app` passes

Exit criteria: No Bearer tokens stored in localStorage for auth. CSRF protection active.

### 3.2 SameSite cookie + CORS hardening [MEDIUM]

Status: [~] Repo-side auth cookie policy is now `SameSite=strict`, security headers already align to `DENY`/HSTS in app + nginx, CORS is explicit rather than wildcard methods/headers, and the remaining browser-side direct authenticated `fetch("/api/...")` surfaces in the frontend app were collapsed onto shared helpers that always attach the explicit same-origin header. Remaining follow-through is live preflight/runtime verification on deployed/staging surfaces.

Files: `app/main.py`, `app/api/routers/auth.py`, `infra/nginx/default.conf`

Verification (2026-05-25):
- auth cookie set/clear paths now use `SameSite=strict`
- `app.main` CORS middleware now keeps explicit `allow_origins` and explicit allowed methods/headers (`Authorization`, `Content-Type`, `Idempotency-Key`, `X-API-Key`, `X-Bridge-Operator-Secret`, `X-Cron-Secret`, `X-Requested-With`, `X-Request-Id`)
- `app.main` already injects `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`
- `infra/nginx/default.conf` already matches `DENY` + HSTS across public locations

Remaining follow-through:
- run live browser preflight verification against deployed/staging auth/browser surfaces to confirm the shared-header path behaves correctly end-to-end
- if any route needs an additional custom header in browsers, add it deliberately to the explicit CORS allowlist instead of returning to wildcards

### 3.3 Production security header alignment [LOW]

Files: \infra/nginx/default.conf\, production nginx config

Current (from PRODUCTION_ROADMAP.md):
- Production: \X-Frame-Options: SAMEORIGIN\ (should be \DENY\)
- Production: duplicated \Permissions-Policy\ / \Strict-Transport-Security\
- Source of truth: \infra/nginx/default.conf\

Fix: Compare and sync production nginx config with \infra/nginx/default.conf\.

---

## Priority 4 -- Monetization depth

### 4.1 Stripe / fiat payment gateway [HIGH]

ACP checkout is stable. New users must acquire ACP on exchange -- huge friction.

New endpoints:
- \POST /v1/payments/stripe/intent\ -- create PaymentIntent, return client_secret
- \POST /v1/webhooks/stripe\ -- Stripe webhook handler (idempotent)
- \GET /v1/payments/methods\ -- list saved payment methods
- \DELETE /v1/payments/methods/{id}\ -- remove payment method

Model changes:
- \User\ -> add \stripe_customer_id\ (nullable)
- \PaymentIntent\ -> add \stripe_payment_intent_id\ (nullable)
- New \StripeEvent\ model for idempotent webhook deduplication

Existing \payment_intents\ contract preserved: Stripe is an adapter, not a replacement.

Exit criteria: User can buy ACP credits via Stripe without leaving the platform.

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
  0.1  Revoke leaked key + delete/clean docs/openclaw-kiro-snippet.json5
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
