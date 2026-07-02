# ACP Wallet — Release Evidence Packet (v1.0.0-rc1)

> Status: repo-verified release candidate evidence | Updated: 2026-07-02
> Roadmap link: `docs/mobile/ROADMAP.md` → P6-4, P6-6
> Companion docs: `docs/mobile/RELEASE_CHECKLIST.md`, `docs/mobile/RELEASE_RUNBOOK.md`, `docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md`

## Release identity

- Target version: `1.0.0-rc1`
- Target commit SHA: `pending commit on master after 2026-07-02 plan closure`
- Tag / release branch: `v1.0.0-rc1` (planned)
- Operator: ANCAP repo automation + operator follow-up
- Date: 2026-07-02
- Release scope summary: Repo-verified Android native artifacts, Smart Pay beta (parse/quote/execute/recover + route plan), PIN/biometrics/SecureVault wiring, i18n, legal routes. Real device/store uploads remain operator-open.

## App identifiers and build numbers

- App name: `ANCAP ACP Wallet`
- iOS bundle ID: `cloud.ancap.acpwallet`
- Android package: `cloud.ancap.acpwallet`
- URL scheme: `acpwallet`
- App version: `1.0.0-rc1` (planned)
- Android versionCode / build number: pending store upload
- iOS build number: pending TestFlight upload

## Native artifact inputs

- Android `.so` artifact source/path: `ancap-mobile/modules/expo-acp-core/android/src/main/jniLibs/**/libacp_mobile_ffi.so`
- Android release candidate artifact path: debug APK assembles on Windows host (`apps/acp-wallet-expo/android`)
- iOS packaged artifact / xcframework path: `ancap-mobile/scripts/build-ios-native.ps1` (macOS/Xcode required)
- iOS release candidate artifact path: **pending macOS build**
- Signing/profile notes: operator-managed; not stored in repo

## Repo-verified evidence (closed)

| Check | Result | Evidence |
|---|---|---|
| Android FFI `.so` emission | pass | `P1-6 [x]` in `docs/mobile/ROADMAP.md`; `build-android-native.ps1` |
| Expo Android debug assemble | pass | Roadmap P4-3/P4-11 notes; Windows host verification |
| Smart Pay API contract tests | pass | `pytest tests/api/test_mobile_acp.py -q` (parse/quote/execute/recover/OCR/routePlan) |
| Mobile SDK typed client build | pass | `npm run build` in `ancap-mobile/packages/acp-api-client` |
| PIN/biometrics/SecureVault wiring | pass (code) | Expo app code + `docs/mobile/SECURITY_MODEL.md` baseline |
| i18n EN/RU/UK/DE | pass | Roadmap P4-15 `[x]` |
| Legal routes | pass | `/legal/terms`, `/legal/privacy`, `/legal/cookies` |
| GitHub CI (backend/frontend/mobile-sdk) | pass | master green after 2026-07-01 hardening wave |

## Device verification evidence

- Primary device evidence file: **pending** (`docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md`)
- Device matrix summary:
  - Android emulator: **pending**
  - Android physical primary phone: **pending**
  - Android secondary OEM phone: **pending**
  - iOS simulator: **pending** (blocked on P1-7 macOS packaging)
  - iOS physical iPhone: **pending**
- Native create/send/sign/broadcast verdict: **pending real runtime**
- PIN / biometrics / SecureVault verdict: **pending real hardware**
- Remaining device blockers: real Android Expo runtime, iOS native packaging, MASVS L1 on-device verification

## Internal distribution evidence

### Play Console Internal testing

- Upload status: **pending**
- Blocking issues: device verification + signed release artifact

### TestFlight

- Upload status: **pending**
- Blocking issues: macOS/iOS native build (P1-7)

## Closure verdict

| Gate | Verdict |
|---|---|
| Repo release scaffolding + native Android artifacts | **Closed** |
| Smart Pay beta contract (incl. OCR + route plan) | **Closed in repo** |
| Real device verification | **Open** |
| Store uploads (P6-4) | **Open** |
| Production v1.0.0 cut (P6-6) | **Open** — rc1 evidence packet filled for repo slice only |

Do **not** mark P6-4/P6-6 `[x]` until device + store evidence is attached.
