# ACP Wallet — Release Evidence Packet Template

> Status: fillable template | Added: 2026-05-30
> Roadmap link: `docs/mobile/ROADMAP.md` → P6-4, P6-6
> Companion docs: `docs/mobile/RELEASE_CHECKLIST.md`, `docs/mobile/RELEASE_RUNBOOK.md`, `docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md`
> Purpose: turn the final mobile release gate into a fillable evidence packet instead of a loose checklist.

Important truth:

- This file is a **template**, not a completed release packet.
- Do **not** mark `P6-4` or `P6-6` done until a filled copy contains real build/upload/device evidence.
- If any section is still placeholder-only, the release gate remains open.

## How to use

1. Copy this template to a versioned file for the current release candidate.
2. Link the real device-evidence file(s), build artifacts, tester notes, and release notes draft.
3. Keep failed or blocked items visible; do not delete them to make the packet look green.

Suggested copy names:

- `docs/mobile/release-evidence-v1.0.0-rc1.md`
- `docs/mobile/release-evidence-v1.0.0-final.md`

## Release identity

- Target version:
- Target commit SHA:
- Tag / release branch:
- Operator:
- Date:
- Release scope summary:

## App identifiers and build numbers

- App name: `ANCAP ACP Wallet`
- iOS bundle ID: `cloud.ancap.acpwallet`
- Android package: `cloud.ancap.acpwallet`
- URL scheme: `acpwallet`
- App version:
- Android versionCode / build number:
- iOS build number:

## Native artifact inputs

- Android `.so` artifact source/path:
- Android release candidate artifact path:
- iOS packaged artifact / xcframework path:
- iOS release candidate artifact path:
- Any signing/profile notes:

## Device verification evidence

- Primary device evidence file:
- Additional device evidence file(s):
- Device matrix summary:
  - Android emulator:
  - Android physical primary phone:
  - Android secondary OEM phone:
  - iOS simulator:
  - iOS physical iPhone:
  - iOS physical iPad (optional):
- Native create/send/sign/broadcast verdict:
- PIN / biometrics / SecureVault verdict:
- Remaining device blockers:

## Internal distribution evidence

### Play Console Internal testing

- Upload status:
- Artifact / build identifier:
- Tester group / audience:
- Tester notes path:
- Blocking issues:

### TestFlight

- Upload status:
- Build identifier:
- Tester group / audience:
- Tester notes path:
- Blocking issues:

## Listing / legal / operator pack

- Terms page verification:
- Privacy page verification:
- Cookies page verification:
- Support contact confirmed:
- Risk disclosures reviewed:
- Store screenshots / preview media path:
- Short description / long description copy path:
- Privacy questionnaire status:
- Export/compliance review status:

## Release notes

- Release notes artifact path:
- Mobile wallet section completed: yes / no
- Known limitations recorded:
- Smart Pay beta wording verified:

## Rollback plan

- Previous known-good Android build:
- Previous known-good iOS build:
- Previous known-good commit/tag:
- Rollback owner:
- Rollback decision log location:
- Hotfix path if rollout fails:

## Final go / no-go checklist

| Gate | Result (`pass` / `fail` / `blocked`) | Evidence |
|---|---|---|
| Android native build path verified |  |  |
| iOS native packaging verified |  |  |
| Device matrix complete on required non-optional rows |  |  |
| Native create/send/sign/broadcast verified |  |  |
| PIN / biometrics / SecureVault verified |  |  |
| Play Internal upload completed |  |  |
| TestFlight upload completed |  |  |
| Listing/legal pack finalized |  |  |
| Release notes prepared |  |  |
| Rollback plan recorded |  |  |

## Sign-off

- Final verdict: go / no-go
- Blocking reason if no-go:
- Next action:
- Approved by:
