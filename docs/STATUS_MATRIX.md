# ANCAP Status Matrix

> Status: active summary | Updated: 2026-05-28
> Primary source of truth: `MASTER_ROADMAP.md`
> Purpose: remove confusion between roadmap/status documents and provide one compact view of what is done, what is partial, and what is next.

---

## 1. Reading order

When documents disagree, use this order:

1. **`MASTER_ROADMAP.md`** — only execution-priority source of truth
2. **`docs/STATUS_MATRIX.md`** — compact status summary and document-role index
3. **`PRODUCTION_ROADMAP.md`** — supporting product/deploy capability snapshot
4. **`docs/mobile/ROADMAP.md`** — detailed mobile task tracker
5. **`ROADMAP-MONETIZATION.md`** — monetization strategy context
6. **`ROADMAP.md`** — historical architecture context

Rule: older/supporting documents can explain context, but they must not override `MASTER_ROADMAP.md`.

---

## 2. Top-line truth

As of 2026-05-25, the project is **not fully release-complete end-to-end**.

The core platform is largely built, but the biggest remaining tails are:

1. **security / CI / prod-hardening**
2. **ACP mobile wallet completion to real device-ready release**
3. **monetization depth after the first ACP-first revenue loop**

Parallel trust/adoption track:
- **GitHub-first open-source transparency** — public-safe code/docs/protocol surfaces should become easier to audit and integrate, while private keys, bridge signer operations, hot-wallet logic, deploy secrets, and sensitive infra stay closed.

---

## 3. Document authority matrix

| Document | Role | Authority level | What it should be used for | What it should NOT be used for |
|---|---|---:|---|---|
| `MASTER_ROADMAP.md` | Master execution roadmap | Highest | Priority order, blockers, truth on what remains | Historical storytelling without current status |
| `docs/STATUS_MATRIX.md` | Unified summary | High | Quick orientation, document roles, cross-area status summary | Fine-grained task backlog |
| `PRODUCTION_ROADMAP.md` | Product/deploy snapshot | Medium | Capability snapshot, smoke/deploy context | Final project completion verdict |
| `docs/mobile/ROADMAP.md` | Mobile tracker | Medium | Detailed mobile task status | Cross-project source of truth |
| `ROADMAP-MONETIZATION.md` | Strategy note | Low-Medium | Monetization direction and priorities | Claiming monetization is still greenfield |
| `ROADMAP.md` | Historical architecture roadmap | Low | Architecture history and capability waves | Current delivery truth or release-readiness verdict |

---

## 4. Program status matrix

| Area | Status | Confidence | Primary truth source | Summary |
|---|---|---:|---|---|
| Core paid AI workflow platform | **Largely built** | High | `MASTER_ROADMAP.md`, `PRODUCTION_ROADMAP.md` | Paid workflows, LLM execution, receipts/proof, realtime status, org/dev/admin surfaces are substantially present. |
| Production UI/admin surfaces | **Largely built** | High | `PRODUCTION_ROADMAP.md` | Billing, organizations, webhooks, analytics, proof center, strategy builder baseline are present. |
| Proof / receipts / realtime status | **Largely built** | High | `PRODUCTION_ROADMAP.md` | Receipts/proof and run status infrastructure exist. |
| ACP checkout / first revenue loop | **Baseline done** | Medium-High | `MASTER_ROADMAP.md`, `ROADMAP-MONETIZATION.md` | First ACP-first monetization loop exists, but still needs deeper conversion and payout mechanics. |
| Security / CI / prod-hardening | **In progress / top priority** | High | `MASTER_ROADMAP.md` | This remains one of the three biggest remaining tails overall, but the production-secret baseline sub-slice is now closed on the current host/runtime and the Cloudflare-edge header mismatch is now closed too; the remaining work is exposed-key rotation / upstream access cleanup. |
| Mobile wallet | **In progress / major remaining area** | High | `MASTER_ROADMAP.md`, `docs/mobile/ROADMAP.md` | Wallet is far along but not release-ready; native build closure, device verification, and release work remain. |
| Monetization depth | **In progress / major remaining area** | High | `MASTER_ROADMAP.md`, `ROADMAP-MONETIZATION.md` | Focus has shifted from “launch monetization” to “deepen and de-risk monetization”. |
| Governance / trust / anti-sybil architecture | **Substantially delivered** | Medium | `ROADMAP.md` | Important capability waves were built, but this does not imply whole-project release completion. |
| Release hygiene / architecture cleanup | **Baseline done** | Medium | `MASTER_ROADMAP.md` | Deployment story cleanup, dependency consolidation, release workflow, and documentation-health cleanup are now baseline done; broader release closure still depends on the higher-priority top-line tails. |
| Test posture | **Good baseline, not fully closed** | Medium-High | `MASTER_ROADMAP.md`, `PRODUCTION_ROADMAP.md` | Broad test coverage exists and real GitHub CI/E2E verification is green; the main remaining validation gaps are mobile real-device/native runs plus external/manual checks like live Stripe end-to-end. |

---

## 5. Remaining work by major theme

### A. Security / CI / prod-hardening

**Status:** active top priority

**Already true:**
- repo-side leaked-key cleanup is done in tracked files, `scripts/check_secret_hygiene.py` now provides a repeatable tracked-files secret-pattern scan, the dedicated `Secret Hygiene` GitHub workflow plus tagged-release preflight both enforce it, and current repo checks find no live token-shaped matches outside roadmap remediation notes
- production secret guardrails are hardened in repo/config, `docs/PRODUCTION_SECRET_BASELINE.md` captures the operator provisioning/evidence checklist, and the current prod-like host runtime now passes them with real provisioned secrets outside the repo: `docker compose -f docker-compose.prod.yml config --quiet` succeeds, the required secret set is present without placeholder-like values, bundled-postgres parity holds, and `/api/v1/system/health` plus `/api/v1/system/ready` both return `200`
- backend CI soft-fail fixes are in place
- GitHub secret scanning, push protection, Dependabot security updates, and dependency review are enabled
- real GitHub runs are green for CodeQL, Backend CI, Frontend CI, and the scheduled `System Jobs Tick` workflow on `master`
- public diagnostics/ops endpoints are restricted, and the scheduled jobs path is already split onto `/v1/system/jobs/tick/async`
- auth cookie/storage/CORS hardening is live
- public Cloudflare-routed `ancap.cloud` / `api.ancap.cloud` header checks now match the canonical `DENY` + `nosniff` + `strict-origin-when-cross-origin` + explicit `Permissions-Policy` + HSTS set

**Still remaining:**
- revoke/rotate the exposed provider key externally and complete any upstream access cleanup (operator checklist now lives in `docs/SECRET_ROTATION_RUNBOOK.md`)

**Truth source:** `MASTER_ROADMAP.md`

### B. Mobile wallet

**Status:** active major remaining area

**Already true:**
- Rust FFI core exists
- TypeScript SDK packages exist
- mobile backend endpoints exist
- Expo app shell and most wallet UX are implemented
- PIN/biometrics and SecureVault are wired in app code
- i18n is done
- release-closure scaffolding now exists in `docs/mobile/DEVICE_MATRIX.md`, `docs/mobile/RELEASE_CHECKLIST.md`, and `docs/mobile/RELEASE_RUNBOOK.md`
- public legal page routes already exist for `/legal/terms`, `/legal/privacy`, and `/legal/cookies`
- Smart Pay first-scope backend groundwork exists for capabilities, deterministic parse, quote, and execute/status/recover
- Smart Pay placeholder execution lifecycle now maps recovered txs onto quoted route steps, emits explorer links, and can close placeholder sessions once all quoted txs are known
- Smart Pay typed client wiring and Expo beta flow already exist for parse → quote → execute → refresh/recover
- Smart Pay Expo beta now also keeps recent device-local session/receipt snapshots for resume/history/recovery baseline UX and can fetch backend receipt snapshots for the active payment
- Android native `.so` emission via `ancap-mobile/scripts/build-android-native.ps1` is now verified on the current Windows host, with `libacp_mobile_ffi.so` emitted for `arm64-v8a`, `armeabi-v7a`, and `x86_64` under `modules/expo-acp-core/android/src/main/jniLibs`

**Still remaining:**
- Android Expo dev-build/runtime verification using the emitted `.so` artifacts
- iOS native packaging on macOS/Xcode
- native create/send/sign verification in dev builds
- real device verification for PIN / biometrics / SecureVault
- remaining MASVS/device-release verification (repo baseline is closed; real-device/native validation still remains)
- actual device runs, TestFlight/Play Internal uploads, final listing assets/operator/legal completion, and the final v1.0.0 cut (the final runbook is now scaffolded, but the external execution work still remains)

**Truth source:** `MASTER_ROADMAP.md`, `docs/mobile/ROADMAP.md`

### C. Monetization depth

**Status:** active major remaining area

**Already true:**
- first ACP-first workflow monetization loop exists in baseline form
- creator/developer monetization surfaces exist in baseline form

**Still remaining:**
- Stripe / fiat adapter live end-to-end verification
- creator earnings dashboard improvements
- deeper API monetization reporting and spend controls
- referral commission auto-payout ✅ baseline done (ledger reward issuance + optional on-chain payout jobs + jobs-tick execution)
- marketplace search/filter/discovery depth ✅ baseline done
- refund / dispute / chargeback flows ✅ baseline done (refund request model/API, user run-detail submission/status, admin approve/reject review queue)

**Truth source:** `MASTER_ROADMAP.md`, `ROADMAP-MONETIZATION.md`

---

## 6. Current highest-priority queue

This is the practical reading of the current queue from `MASTER_ROADMAP.md`:

1. **Priority 0:** emergency exposed-key remediation tail
2. **Priority 1:** CI/CD honesty and security automation
3. **Priority 2:** domain model gaps and skipped tests
4. **Priority 3:** auth/cookie/CORS/security-header hardening follow-through (now baseline closed in repo/runtime/public headers)
5. **Priority 4:** monetization depth
6. **Priority 5:** mobile wallet completion
7. **Priority 6:** architecture/release hygiene

Note: although mobile and monetization are major tails, the immediate execution order still starts with security/CI/prod-hardening.

---

## 7. Fast truth by component

| Component | Status | Notes |
|---|---|---|
| Paid workflow execution | Done baseline | Core capability exists |
| ACP-first payments | Done baseline / needs depth | Works as base loop; needs lower-friction expansion |
| Proof center / receipts | Done baseline | Present and important trust layer |
| Organizations / teams | Done baseline | Delivered stabilization slice |
| Webhooks | Done baseline | Delivered stabilization slice |
| Strategy Builder | Done baseline | Lightweight builder exists; React Flow is later |
| Search / analytics | Done baseline | Exists, but marketplace depth remains |
| Mobile native signing flow | Partial | Native closure and verification remain |
| Mobile release readiness | Not done | Device/stores/security/release still open |
| CI hardening | Baseline done | Secret scanning/push protection, dependency review, CodeQL, Backend/Frontend CI, and scheduled async `System Jobs Tick` verification are confirmed on GitHub; the remaining adjacent security tail is external key rotation/access cleanup, not CI gate honesty. |
| Secret remediation | Partial | Cleanup is done in tracked repo files, `scripts/check_secret_hygiene.py` now provides a repeatable tracked-files secret-pattern scan, the dedicated `Secret Hygiene` workflow plus tagged-release preflight enforce it, public security headers are now aligned end-to-end, and no live token-shaped matches remain outside roadmap notes; `docs/SECRET_ROTATION_RUNBOOK.md` captures the operator rotation checklist, but upstream revoke/rotation and access cleanup still remain external/manual. |
| Monetization expansion | Partial | First loop exists; depth features remain |
| Release workflow / tagging / dep hygiene | Baseline done | Tag-driven release workflow is in repo, `v1.0.0` is present, and Python dependency management now has a single runtime input (`requirements.in`) plus generated lock / shared `.[dev]` CI install path; broader release closure still depends on the remaining top-line roadmap tails. |
| Public `ancap-docs` split | In progress / repo prep hardened | The public docs repo does not exist yet, but the seed bundle and repeatable export path are now prepared in-repo via `docs/ANCAP_DOCS_SPLIT.md` and `scripts/export_ancap_docs.py`; the export now ships a docs-focused root README, includes public-safe GitHub issue/PR templates, rewrites out-of-bundle links to the source monorepo, and validates the bundle for broken relative links before export, while Backend CI reruns the export/public-trust regression slice when those bundle inputs change and external org/repo creation is still pending. |

---

## 8. Anti-confusion rules

Use these rules when updating docs:

1. If a file claims the whole project is “release-ready”, verify it against `MASTER_ROADMAP.md` first.
2. If a capability exists but still lacks hardening, device validation, or release closure, prefer **baseline done** or **partial** over absolute **done**.
3. Mobile feature code being written does **not** equal mobile release readiness.
4. Monetization being live at baseline does **not** mean monetization depth is finished.
5. Architecture waves being delivered does **not** mean overall product execution is complete.

---

## 9. Suggested maintenance rule

When any roadmap/status file is edited:

- update `MASTER_ROADMAP.md` first if execution truth changed
- update this file if document roles or cross-area status changed
- keep supporting docs scoped to their purpose
- avoid reintroducing whole-project “all done” language unless the top three remaining tails are actually closed

---

## 10. One-sentence summary

**ANCAP is a largely built ACP-first workflow platform whose main remaining work is security/CI/prod hardening, mobile wallet release closure, and monetization depth — and `MASTER_ROADMAP.md` remains the final authority on execution truth.**
