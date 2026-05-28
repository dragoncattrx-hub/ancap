# ACP Wallet — Device Verification Matrix

> Status: release-closure scaffold added on 2026-05-28
> Roadmap link: `docs/mobile/ROADMAP.md` → P6-3
> Purpose: turn the remaining mobile/device work into an executable matrix instead of a vague TODO list.

Current truth:

- The wallet repo already has the Expo app shell, API clients, security baseline, i18n, and most wallet UX.
- The remaining gap is **not** feature ideation; it is **native-build and real-device verification**.
- These runs have **not** been executed yet from this repo state.

## Current blockers before full matrix execution

1. **Android native build artifact** — `ancap-mobile/scripts/build-android-native.ps1` still requires an installed Android NDK on the build host.
2. **iOS native packaging** — `ancap-mobile/scripts/build-ios-native.ps1` still requires macOS + Xcode for real packaging/verification.
3. **Native signing path** — create/send/sign closure depends on the Android/iOS native artifacts above being built and wired in a dev client.

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
| Android | Emulator (API 34+) | Android 14+ | Expo dev client | Pending `.so` build | import, receive, activity, Smart Pay beta, lock timer | [ ] | Run after NDK-backed native build succeeds |
| Android | Physical phone (Pixel-class) | Android 14+ | Expo dev client | Pending `.so` build | create, import, PIN, biometrics, send/sign/broadcast, background/resume | [ ] | Required for biometrics + secure storage truth |
| Android | Secondary OEM phone | Android 13+ | Expo dev client | Pending `.so` build | same as primary phone + manufacturer-specific storage behavior | [ ] | Catch OEM keystore quirks |
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

- device model + OS version
- app build identifier / commit reference
- whether the run used native Android `.so` artifacts or iOS packaged artifacts
- pass/fail by scenario
- screenshot or short note for any failure
- whether the issue is a repo bug, host-tooling blocker, or store/distribution blocker

## Failure handling rule

If a matrix row fails because of repo code, fix the repo before continuing. If it fails only because of missing host prerequisites (Android NDK, macOS/Xcode, signing accounts, physical hardware), keep the roadmap item at `[~]` and document the blocker plainly.
