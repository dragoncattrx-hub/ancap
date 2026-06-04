# ACP Wallet — Device Verification Matrix

> Status: release-closure scaffold added on 2026-05-28
> Roadmap link: `docs/mobile/ROADMAP.md` → P6-3
> Companion template: `docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md`
> Purpose: turn the remaining mobile/device work into an executable matrix instead of a vague TODO list.

Current truth:

- The wallet repo already has the Expo app shell, API clients, security baseline, i18n, and most wallet UX.
- The remaining gap is **not** feature ideation; it is **native-build and real-device verification**.
- These runs have **not** been executed yet from this repo state.

## Current blockers before full matrix execution

1. **Android runtime verification** — `ancap-mobile/scripts/build-android-native.ps1` now succeeds on the current Windows host and emits `libacp_mobile_ffi.so` artifacts for `arm64-v8a`, `armeabi-v7a`, and `x86_64`, but Expo dev-client verification on emulator + physical Android devices is still pending.
2. **iOS native packaging** — `ancap-mobile/scripts/build-ios-native.ps1` still requires macOS + Xcode for real packaging/verification.
3. **Native signing path** — create/send/sign closure still depends on dev-client/runtime verification of the emitted Android artifacts plus the iOS native artifacts above.

## Required test surfaces

| Surface | Why it matters |
|---|---|
| Import existing wallet | Current non-native baseline path; must stay stable |
| Create wallet via native FFI | Confirms local key generation path for release |
| Receive / QR / clipboard clear | Confirms basic wallet UX + security control |
| PIN unlock + biometric unlock | Closes P4-8 and feeds P5-1 |
| SecureVault migration | Confirms secrets move into biometric-gated storage |
| Send / preview / local sign / broadcast | Core non-custodial release path |
| Activity / history / balance refresh | Verifies public mobile ACP API + UI state |
| Smart Pay beta restore / review | Confirms current beta flow does not regress |
| Background / resume / auto-lock | Confirms mobile session safety |

## Execution matrix

| Platform | Device / class | OS target | Build type | Native core status | Required scenarios | Status | Notes |
|---|---|---|---|---|---|---|---|
| Android | Emulator (API 34+) | Android 14+ | Expo dev client | `.so` artifacts emitted on current Windows host; runtime verification pending | import, receive, activity, Smart Pay beta, lock timer | [ ] | Use current `jniLibs` output and verify the dev client boots cleanly |
| Android | Physical phone (Pixel-class) | Android 14+ | Expo dev client | `.so` artifacts emitted on current Windows host; runtime verification pending | create, import, PIN, biometrics, send/sign/broadcast, background/resume | [ ] | Required for biometrics + secure storage truth |
| Android | Secondary OEM phone | Android 13+ | Expo dev client | `.so` artifacts emitted on current Windows host; runtime verification pending | same as primary phone + manufacturer-specific storage behavior | [ ] | Catch OEM keystore quirks |
| iOS | Simulator | iOS 17+ | Expo dev client | Pending macOS/Xcode packaging | import, receive, activity, layout sanity | [ ] | Useful for UI/regression, not enough for biometrics truth |
| iOS | Physical iPhone | iOS 17+ | Expo dev client / release candidate | Pending macOS/Xcode packaging | create, import, Face ID / Touch ID, secure vault migration, send/sign/broadcast, background/resume | [ ] | Required for final P4-8 / P4-9 / P5-1 closure |
| iOS | Physical iPad (optional) | iPadOS 17+ | Expo dev client | Pending macOS/Xcode packaging | onboarding, tabs, receive, settings/legal layout | [ ] | Nice-to-have tablet sanity, not a v1 blocker unless tablet support is claimed |

## Minimum pass criteria for P6-3

P6-3 should move to `[x]` only when all required non-optional rows above have:

- successful install and launch
- stable wallet import
- successful create/send/sign path on real hardware where native signing applies
- PIN / biometrics / secure-vault migration verified on physical devices
- evidence captured for each platform (screenshots, build identifiers, notes, and any known deviations)

## Evidence to capture per run

Use `docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md` as the copy-ready format for each verification round so results do not end up scattered across chat logs or ad-hoc notes.

To bootstrap a dated working copy without hand-editing the template header each time, run:
- `python scripts/generate_mobile_device_verification_packet.py`
- optional Windows launcher-only equivalent: `py -3 scripts/generate_mobile_device_verification_packet.py`
- optional custom output example: `python scripts/generate_mobile_device_verification_packet.py --date-label 2026-06-02 --operator ARDO --backend-api-target "http://127.0.0.1:8001/v1"`

The generator writes a dated markdown packet (default: `docs/mobile/device-evidence-YYYY-MM-DD.md`) from the checked-in template, pre-fills round metadata fields you provide on the command line, appends bootstrap metadata with app/repo provenance, and refreshes the stable alias `docs/mobile/device-evidence-latest.md` by default so the newest verification packet has a fixed handoff path. Pass `--no-write-latest-alias` if you intentionally want a dated packet without touching that stable alias.

- device model + OS version
- app build identifier / commit reference
- whether the run used native Android `.so` artifacts or iOS packaged artifacts
- pass/fail by scenario
- screenshot or short note for any failure
- whether the issue is a repo bug, host-tooling blocker, or store/distribution blocker

## Failure handling rule

If a matrix row fails because of repo code, fix the repo before continuing. If it fails only because of missing host prerequisites (Android NDK, macOS/Xcode, signing accounts, physical hardware), keep the roadmap item at `[~]` and document the blocker plainly.
