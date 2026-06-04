# ACP Wallet — Device Verification Evidence Template

> Status: fillable template | Added: 2026-05-30
> Roadmap link: `docs/mobile/ROADMAP.md` → P6-3
> Companion matrix: `docs/mobile/DEVICE_MATRIX.md`
> Purpose: give the remaining device/runtime verification work a copy-ready evidence format instead of leaving results in ad-hoc notes.

Important truth:

- This file is a **template**, not evidence.
- Do **not** mark `P6-3` done until a filled copy contains real device runs from the current repo state.
- When a row fails, classify the blocker plainly as **repo bug**, **host/tooling blocker**, **distribution blocker**, or **hardware/access blocker**.

## How to use

1. Copy this template to a dated working file for the current verification round.
2. Keep one section per actual device/emulator run.
3. Attach screenshot paths, build identifiers, and short failure notes instead of vague summaries.
4. If a run proves a roadmap item is still blocked externally, say that explicitly instead of soft-marking it done.

Suggested copy names:

- `docs/mobile/device-evidence-YYYY-MM-DD.md`
- `docs/mobile/device-evidence-android-rc1.md`
- `docs/mobile/device-evidence-ios-rc1.md`

## Verification round metadata

- Date:
- Operator:
- Commit SHA:
- App version:
- Android build number:
- iOS build number:
- Backend/API target:
- Auth/config notes:
- Native artifact source:
  - Android `.so` artifacts:
  - iOS packaged artifacts / xcframework:

## Device / run entries

### Run 1

- Platform:
- Device / emulator:
- OS version:
- Build type: Expo dev client / release candidate / other
- Native core status:
- Install / launch result:
- Notes:

| Scenario | Result (`pass` / `fail` / `blocked` / `n/a`) | Evidence / screenshot / log path | Notes |
|---|---|---|---|
| Import existing wallet |  |  |  |
| Create wallet via native FFI |  |  |  |
| Receive / QR / clipboard clear |  |  |  |
| PIN unlock + biometric unlock |  |  |  |
| SecureVault migration |  |  |  |
| Send / preview / local sign / broadcast |  |  |  |
| Activity / history / balance refresh |  |  |  |
| Smart Pay beta restore / review |  |  |  |
| Background / resume / auto-lock |  |  |  |

Failure classification:
- Repo bug:
- Host/tooling blocker:
- Distribution blocker:
- Hardware/access blocker:

### Run 2

- Platform:
- Device / emulator:
- OS version:
- Build type: Expo dev client / release candidate / other
- Native core status:
- Install / launch result:
- Notes:

| Scenario | Result (`pass` / `fail` / `blocked` / `n/a`) | Evidence / screenshot / log path | Notes |
|---|---|---|---|
| Import existing wallet |  |  |  |
| Create wallet via native FFI |  |  |  |
| Receive / QR / clipboard clear |  |  |  |
| PIN unlock + biometric unlock |  |  |  |
| SecureVault migration |  |  |  |
| Send / preview / local sign / broadcast |  |  |  |
| Activity / history / balance refresh |  |  |  |
| Smart Pay beta restore / review |  |  |  |
| Background / resume / auto-lock |  |  |  |

Failure classification:
- Repo bug:
- Host/tooling blocker:
- Distribution blocker:
- Hardware/access blocker:

## Matrix coverage summary

| Matrix row | Covered by run(s) | Current verdict | Remaining blocker / follow-up |
|---|---|---|---|
| Android emulator (API 34+) |  |  |  |
| Android physical primary phone |  |  |  |
| Android secondary OEM phone |  |  |  |
| iOS simulator |  |  |  |
| iOS physical iPhone |  |  |  |
| iOS physical iPad (optional) |  |  |  |

## Release-closure impact

- P4-8 PIN + biometrics:
- P4-9 SecureVault:
- P4-11 Send + preview + sign:
- P5-1 MASVS L1 closure:
- P6-3 Device matrix:
- P6-4 TestFlight + Play Internal readiness:
- P6-6 Production v1.0.0 gate:

## Sign-off summary

- What was proven:
- What is still blocked:
- Next required action:
- Safe roadmap status after this run:
