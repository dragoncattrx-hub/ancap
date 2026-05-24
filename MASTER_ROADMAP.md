# ANCAP Master Roadmap

> Status: active | Major revision: 2026-05-24
> Created: 2026-05-23 | Last updated: 2026-05-24
> Owner: ARDO
> Rule: execute top-to-bottom by priority. Everything must be either DONE, in progress, intentionally deferred, or replaced by a better approved plan.

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

File: \docs/openclaw-kiro-snippet.json5\ contains plaintext API key \sk-aw-4900ab96f0a2f10e1996e4f3bc80709c\

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

Files: \docker-compose.prod.yml\, \pp/config.py\

Fix:
- \secret_key\ must not have a fallback default in production-configured files -- must be a required env var with no insecure fallback
- \cursor_secret\ dev fallback must not exist in any file that could be docker-compose-prodd
- Add startup guard: if \ENV == "production"\ and a required secret is missing -- fail fast

---

## Priority 1 -- CI/CD honesty and security automation

### 1.1 Fix backend CI soft-fails [HIGH]

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

File to add: \.github/workflows/codeql.yml\

Languages: python, javascript, typescript, github-actions
Queries: security-and-quality
Schedule: weekly (Mondays 06:00 UTC)

### 1.4 Playwright E2E in CI [HIGH]

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

Files: \pp/db/models.py\ (Pool class), \	ests/test_ledger.py\, \services/participation_gates.py\

Current state:
- \Pool\ model has NO \owner_agent_id\ column
- \	est_allocate\ is skipped with explicit reason: "Pool model has no \owner_agent_id\ column"
- \POST /v1/ledger/allocate\ was failing; partially worked around (returns 403 "Pool has no owner")

Fix:
\\\python
# Migration 055: add owner_agent_id to pools
# Pool model:
owner_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id"), nullable=True, index=True)

# Update allocate endpoint:
# - If pool has owner_agent_id: require caller to own it
# - If pool has no owner_agent_id: allow any authenticated caller (backward compat)
# Remove workaround in services/participation_gates.py

# After migration:
# - Remove skip from test_allocate
# - Run the test
# - Confirm it passes
\\\

Command: \lembic revision --autogenerate -m "add owner_agent_id to pools"\

Exit criteria: \	est_allocate\ unskipped and passing.

### 2.2 Fix economy_health async/sync bug [MEDIUM]

File: \pp/api/routers/system.py\

Problem: \economy_health()\ is \sync def\ but calls \httpx.post()\ (synchronous) inside the event loop.

Fix: Replace sync httpx with async httpx.AsyncClient.

### 2.3 Unskip ledger invariant test [MEDIUM]

File: \	ests/api/test_growth_layer.py\

Current skip: \	est_jobs_tick_sets_ledger_halt_blocks_faucet\ tries to break invariant via one-sided deposit (no longer triggers violation).

Fix: Rework test to use a malformed transfer. Then unskip.

### 2.4 Resolve test_unit.py bcrypt skip [LOW]

File: \	ests/test_unit.py:61\

Issue: \pytest.skip("bcrypt backend not available")\ -- missing system dependency in CI.

Fix: Ensure \crypt\ C library installed in CI environment. Remove skip.

---

## Priority 3 -- Security hardening

### 3.1 Auth token: localStorage to HttpOnly cookies [MEDIUM]

Files: \rontend-app/src/components/AuthProvider.tsx\

Problem: OWASP and GitHub security guidance explicitly recommend against storing session identifiers in localStorage. Any XSS can exfiltrate them. For a financial platform (wallets, bridge, payments) this is not theoretical.

Fix:
\\\	ypescript
// Backend: set cookie on login
Set-Cookie: session_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/

// Frontend: read from cookie, NOT localStorage
// Use js-cookie or document.cookie parsing

// CSRF protection: SameSite=Strict + X-Requested-With header check in FastAPI
\\\

Migration: dual-write period (both methods work), then remove localStorage.

Exit criteria: No Bearer tokens stored in localStorage for auth. CSRF protection active.

### 3.2 SameSite cookie + CORS hardening [MEDIUM]

File: \pp/main.py\ or auth router

Actions:
- All auth cookies: \SameSite=Strict\ or \SameSite=Lax\
- CORS: explicit \llow_origins\, no wildcard in production
- Audit \X-Content-Type-Options\, \Permissions-Policy\ on all routes

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

\eferral_reward\ ledger event triggers on first-paid-workflow, but no withdrawal exists.

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

\eferral_reward\ trigger exists but commission is never paid out.

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

---

## Priority 6 -- Architecture and release hygiene

### 6.1 Deployment story cleanup [MEDIUM]

Problem: Two conflicting deployment paths:
1. Docker/Containerized: \rontend-app/Dockerfile\ + \docker-compose.prod.yml\ (confirmed working)
2. Cloudflare Workers: \wrangler.jsonc\ + static framework (appears abandoned)

PR #1 added Cloudflare Workers config but actual production uses containerized approach.

Fix: Either delete \wrangler.jsonc\ and cloudflare/ dir, OR fully migrate to Cloudflare Workers. Do not keep both.

### 6.2 Dependency management consolidation [MEDIUM]

Problem: \equirements.txt\ (exact pins) and \pyproject.toml\ (range pins) coexist.

Fix:
- \equirements.txt\ -> source of truth for runtime deps
- \pyproject.toml\ -> source of truth for dev deps + build config
- Add pip-compile workflow: when \equirements.in\ changes -> regenerate \equirements.txt\ with locked hashes
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
