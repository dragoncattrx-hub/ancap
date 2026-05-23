# ANCAP Master Roadmap

> Status: active
> Created: 2026-05-23
> Owner: ARDO
> Rule: execute top-to-bottom until everything here is either done, intentionally deferred, or replaced by a better approved plan.

## Goal

Ship ANCAP as a production ACP-first AI workflow platform with:
- real paid AI workflow execution
- proof receipts and realtime status
- creator + developer monetization
- stable production UI/admin surfaces
- reliable bridge and wallet infrastructure
- completed ACP mobile wallet MVP

## Source documents

This master roadmap consolidates and supersedes day-to-day execution order from:
- `PRODUCTION_ROADMAP.md`
- `ROADMAP-MONETIZATION.md`
- `docs/mobile/ROADMAP.md`
- `docs/bridge-next-steps.md`
- `docs/DELIVERY_BOARD.md`

## Done already

- Real LLM execution core
- ACP-first workflow commerce loop
- Redis-backed rate limits/cache/pubsub
- Metrics + structured logs + system health
- Workflow SSE live events
- Notification fanout / SMTP service
- Search / analytics / docs / governance notes / legal pages / cookie consent
- Audit log viewer
- Large mobile foundation slice: docs, mobile repo skeleton, public mobile ACP API, wallet signing CLI helpers
- Phase 1 stabilization slice completed for current target surfaces:
  - billing hardened and verified
  - strategy-builder hardened and verified
  - organizations stabilized and verified
  - webhooks stabilized and verified
  - targeted tests/build green

## Execution order

### Phase 1 — Production stabilization (DONE)

#### Completed
- Admin billing UI: finished and verified
- Strategy Builder: current lightweight builder stabilized for production use
- Organizations UI stabilization
- Webhooks UI stabilization

#### Verified done criteria
For the stabilized surfaces above:
- auth/RBAC verified in current slice
- loading/error/empty/success states present
- frontend build green
- targeted backend/frontend tests green
- roadmap/docs updated where behavior changed

#### Exit criteria status
- `/billing`, `/developers/webhooks`, `/organizations`, `/organizations/[id]`, `/strategy-builder` work locally and passed the current smoke/build/test slice

### Phase 2 — Deploy truth + docs sync (DONE ✅)
- Verify real git sync state vs docs ✅
- Verify production deployment state on server ✅
- Run production smoke for `ancap.cloud` ✅
- Update stale docs where status is no longer true ✅
- Keep one truthful runtime story across roadmap, bridge docs, and operational notes ✅
- Fix deploy-truth gaps ✅:
  - `.gitignore` updated, `start-claude.bat` ignored, working tree clean
  - `internal/frontend-build` route: reads `.next/BUILD_ID` at runtime, falls back to env, ignores placeholder `"unknown"`; inject real `APP_BUILD_ID` via `deploy-ancap-cloud.ps1` on host
  - Production security headers: source of truth is `infra/nginx/default.conf`; compare production nginx config against it and update if different
  - Stale docs corrected:
    - `frontend-app/src/app/docs/wacp/bridge/page.tsx`: reverse rail status updated from `pending rollout` → `live`
    - `PRODUCTION_ROADMAP.md`: Deploy row updated from `IN PROGRESS` → `DONE`
    - `docs/PLAN_L0_TO_L3.md`: Reputation v2 updated from `in progress` → `DONE`

#### Exit criteria
- [x] local, origin, and production are in sync
- [x] smoke checks pass
- [x] stale status notes corrected
- [x] frontend build provenance is observable via `/internal/frontend-build` (after host deploy)
- [x] production header posture matches intended reverse-proxy hardening (compare to `infra/nginx/default.conf`)

### Phase 3 — LLM reliability hardening
- Classify provider failures: unavailable / invalid model / auth / balance / timeout / unknown
- Surface provider health in `/system/health/full`
- Record provider status, latency, retry count, fallback mode in `llm_usage_events`
- Add retry/backoff for transient provider failures
- Mark degraded paid runs/receipts when template fallback is used
- Show degraded-run quality signals in owner dashboards

#### Exit criteria
- degraded and provider-failure states are observable end-to-end

### Phase 4 — Governance / B2B evidence
- Add AI system cards for premium governance workflows
- Add degraded-output and corrective-action dashboard filters
- Add evidence export per paid workflow run for B2B buyers

### Phase 5 — Bridge hardening
- Run second controlled ACP -> BSC pilot
- Harden reverse rail replay/idempotency/recovery behavior
- Broaden reconciliation validation
- Finish reserve proof maturity:
  - dedicated reserve snapshots
  - real backing ratio
  - stale-data detection
  - operator mismatch alerting
- Clean bridge docs so they match runtime truth exactly

### Phase 6 — ACP mobile wallet MVP completion

#### 6.1 Native / SDK
- Finish Android FFI integration
- Implement iOS Swift UniFFI link
- Finish native bridge -> FFI in TS SDK
- Complete `acp-api-client`, `acp-bridge-client`, `acp-bsc-client`

#### 6.2 Backend mobile gateway
- ACP indexer (DB-backed history)
- device registration endpoint
- broadcast rate limits

#### 6.3 App product completion
- Create wallet via native FFI
- backup + confirm seed
- PIN + biometrics
- SecureVault
- ACP + wACP dashboard
- receive/send/sign/history flows
- bridge flows v1.1
- settings + legal links
- i18n EN/RU/UK/DE

#### 6.4 Security + release
- MASVS L1 checklist
- screenshot block on seed screens
- clipboard auto-clear
- root/jailbreak warning
- no secrets in logs
- auto-lock timer
- device matrix
- TestFlight / Play Internal
- store listing + legal pages
- production v1.0.0

### Phase 7 — CI hardening and later platform expansion
- Playwright smoke in CI
- Bandit/Semgrep + Docker checks in CI
- signed webhook retry dashboard with replay controls
- organizations-owned API keys, agents, billing wallet, audit exports
- React Flow strategy canvas after current builder is stable
- Fiat/Stripe only after ACP checkout and creator payout flows are stable

## Working rule

Always work the first incomplete item in the highest active phase unless blocked.
If blocked, document blocker, move to the next unblocked item in the same phase, and keep momentum.

## Current active phase: Phase 3 — LLM reliability hardening

### Immediate active batch

1. Phase 2 is done: git clean, docs synced, stale notes corrected, push verified
2. **Phase 3 entry**: classify LLM provider failures (unavailable / invalid model / auth / balance / timeout / unknown)
3. Surface provider health in `/system/health/full`
4. Record provider status, latency, retry count, fallback mode in `llm_usage_events`
5. Add retry/backoff for transient provider failures
6. Mark degraded paid runs/receipts when template fallback is used
