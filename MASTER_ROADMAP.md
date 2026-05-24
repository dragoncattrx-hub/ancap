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

### Phase 3 — LLM reliability hardening (DONE ✅)
- Classify provider failures: unavailable / invalid_model / auth_error / balance_error / timeout / unknown ✅ (app/services/llm.py: `_classify_failure`)
- Surface provider health in `/system/health/full` ✅ (probe_status, probe_error in llm check)
- Record provider status, latency, retry count, fallback mode in `llm_usage_events` ✅ (migration 050, model updated)
- Add retry/backoff for transient provider failures ✅ (`_call_with_retry` with exponential backoff, max_retries=2)
- Mark degraded paid runs/receipts when template fallback is used ✅ (degraded_run=true, degraded_reason in result)
- Show degraded-run quality signals in owner dashboards ✅ (llm_usage in result includes all signals)

#### Exit criteria
- [x] degraded and provider-failure states are observable end-to-end

#### Changes
- `alembic/versions/050_llm_reliability.py` — new migration (provider_status, failure_reason, retry_count + indexes)
- `app/db/models.py` — LlmUsageEvent model extended with new fields + indexes
- `app/services/llm.py` — complete rewrite: failure taxonomy, retry with backoff, degraded_run marking
- `app/api/routers/system.py` — LLM probe in health/full endpoint

### Phase 4 — Governance / B2B evidence (DONE ✅)
- Add AI system cards for premium governance workflows ✅ (`ai_system_card` in WorkflowTemplatePublic, populated for ai-iso-governance-readiness-pack)
- Add degraded-output and corrective-action dashboard filters ✅ (`degraded_run`, `degraded_reason` in WorkflowRunPublic, `?degraded=true|false` filter on `GET /workflow-store/runs`)
- Add evidence export per paid workflow run for B2B buyers ✅ (`GET /workflow-store/runs/{run_id}/evidence-export` — full JSON evidence bundle with hashes, LLM signals, proof)

#### Changes
- `app/schemas/workflow_store.py` — WorkflowTemplatePublic.ai_system_card, WorkflowRunPublic.degraded_run/degraded_reason
- `app/api/routers/workflow_store.py` — degraded filter, evidence-export endpoint
- `app/services/workflow_execution.py` — ai_system_card metadata for governance pack

### Phase 5 — Bridge hardening (CODE DONE ✅, operational checklist remaining)
Phase 5 code is complete. Operational items remaining (not code):
- Run second controlled ACP → BSC pilot for repeatability
- Reverse rail replay/idempotency/recovery hardening
- See `docs/bridge-next-steps.md` and `docs/bridge-operator-runbook.md`

Operator endpoints shipped:
- `GET /api/v1/bridge/admin/snapshots?limit=24` — recent reserve health snapshots
- `GET /api/v1/bridge/admin/alerts` — stale-snapshot + reconciliation-mismatch checks
- `BridgeReserveSnapshot` model + migration 052
- `check_stale_snapshots()` (30-min threshold) + `check_reconciliation_mismatch_alert()`
- Migration 052 `bridge_reserve_snapshots` required on next deploy

### Phase 6 — ACP mobile wallet MVP completion (IN PROGRESS)

#### 6.1 Native / SDK
- Finish Android FFI integration [~] (module wiring done; native `.so` build still blocked on missing Android NDK on this host)
- Implement iOS Swift UniFFI link [~] (Expo iOS podspec now stages generated Swift/modulemap artifacts and vendored `acp_mobile_ffiFFI.xcframework`; `ancap-mobile/scripts/build-ios-native.ps1` added for macOS packaging, but runtime build verification still needs a macOS/iOS run)
- Finish native bridge -> FFI in TS SDK [~] (`createWallet`, `signTransfer`, `estimateFeeDefault`, `addressFromKeystore`, native validate exported; full device/runtime verification still pending)
- Complete `acp-api-client`, `acp-bridge-client`, `acp-bsc-client` [x] (all three packages now build cleanly and their current test suites pass: 12 API client tests, 9 bridge client tests, 13 BSC client tests)

#### 6.2 Backend mobile gateway
- ACP indexer (DB-backed history) [DONE: migration 051, MobileAcpTx + MobileAddressIndexerState models, `mobile_acp_indexer_tick` job, wired to `/v1/system/jobs/tick`]
- device registration endpoint [DONE: `POST /v1/mobile/devices/register`, `POST /v1/mobile/devices/unregister`, `GET /v1/mobile/devices`]
- broadcast rate limits [DONE: 10 req/min per IP, configurable, `POST /acp/tx/broadcast`]

#### 6.3 App product completion
- Create wallet via native FFI [ ] (needs Android build)
- backup + confirm seed [x]
- PIN + biometrics [~] (Expo app now has PIN lock, dedicated unlock screen, explicit biometric prompt via `expo-local-authentication`, and 5-minute auto-lock; still needs real device verification)
- SecureVault [~] (device-only SecureStore wired; biometric unlock now migrates mnemonic + keystore into biometric-gated secure storage; real device verification still pending)
- ACP + wACP dashboard [x] (wACP via BSC RPC)
- receive/send/sign/history flows [x for receive/history; send needs native FFI]
- bridge flows v1.1 [~]
- settings + legal links [x] (Terms, privacy, bridge docs, reserve, support)
- i18n EN/RU/UK/DE [ ]

#### 6.4 Security + release
- MASVS L1 checklist [ ]
- screenshot block on seed screens [x] (expo-screen-capture on seed visibility screen)
- clipboard auto-clear [x] (30s after copy)
- root/jailbreak warning [x] (dev-build warning in settings)
- no secrets in logs [ ]
- auto-lock timer [x] (5-min inactivity lock)
- device matrix [ ]
- TestFlight / Play Internal [ ]
- store listing + legal pages [ ]
- production v1.0.0 [ ]

### Phase 7 — CI hardening and later platform expansion (PARTIAL ✅)
- Bandit SAST + Docker build check in CI ✅ (`.github/workflows/backend-ci.yml`, `requirements.txt`)
- Playwright browser install in frontend CI ✅ (browser binary ready for later smoke job)
- Mobile SDK unit tests in CI ✅ (`test-mobile-sdk` job in frontend CI, 40 tests across 4 packages)
- Playwright smoke in CI [P2 — needs separate job with backend service + postgres]
- signed webhook retry dashboard with replay controls [DONE: `GET /webhooks/{id}/deliveries/{id}`, `POST /webhooks/{id}/deliveries/{id}/replay`, owner-scoped]
- organizations-owned API keys, agents, billing wallet, audit exports [DONE: org-owned API keys — POST/GET/DELETE /organizations/{id}/api-keys, admin+ create/delete, member+ list; org-scoped audit log + CSV export]
- React Flow strategy canvas after current builder is stable [ ]
- Fiat/Stripe only after ACP checkout and creator payout flows are stable [ ]

## Working rule

Always work the first incomplete item in the highest active phase unless blocked.
If blocked, document blocker, move to the next unblocked item in the same phase, and keep momentum.

## Current active phase: Phase 6 — Mobile wallet (in progress)

### Remaining code items (no native FFI dependency)

Phase 6 app:
- [~] PIN + biometrics (expo-local-authentication; wired in app, but still needs real device verification)
- [~] SecureVault wiring (device-only SecureStore wired; biometric unlock now migrates mnemonic + keystore into biometric-gated secure storage; real device verification still pending)
- [ ] i18n EN/RU/UK/DE (i18next)
- [ ] MASVS L1 checklist

Phase 6 release:
- [ ] Device matrix (iOS + Android)
- [ ] TestFlight + Play Internal
- [ ] Store listing + legal pages
- [ ] production v1.0.0

Phase 7 CI:
- [ ] Playwright smoke in CI (separate job, needs backend service)
- [ ] React Flow strategy canvas (after builder API stable)

### Blocked (needs Android native build)

- Create wallet via native FFI → run `build-android-native.ps1`
- Send + sign via native FFI → needs P1 FFI done first
