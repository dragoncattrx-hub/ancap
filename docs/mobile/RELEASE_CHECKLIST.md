# ACP Wallet — Release Readiness Checklist

> Status: release-closure scaffold added on 2026-05-28
> Roadmap link: `docs/mobile/ROADMAP.md` → P6-4, P6-5, P6-6
> Scope: internal-distribution prep, listing/legal pack, and honest v1.0.0 release gates.

This file is intentionally practical: it records what the repo already has, what can be prepared inside the repo, and what still requires external execution.

## Repo-ready inputs already present

- Expo app config exists in `ancap-mobile/apps/acp-wallet-expo/app.json`.
- Current mobile app identifiers are already set:
  - iOS bundle ID: `cloud.ancap.acpwallet`
  - Android package: `cloud.ancap.acpwallet`
  - app version: `1.0.0`
- Mobile product/spec/security docs already exist in `docs/mobile/`.
- Public legal web pages already exist in the frontend codebase:
  - `/legal/terms`
  - `/legal/privacy`
  - `/legal/cookies`

## P6-4 — TestFlight + Play Internal

### Entry conditions

- [ ] Android native `.so` artifacts built via `ancap-mobile/scripts/build-android-native.ps1`
- [ ] iOS native artifacts packaged via `ancap-mobile/scripts/build-ios-native.ps1`
- [ ] Device matrix execution started from `docs/mobile/DEVICE_MATRIX.md`
- [ ] Native create/send/sign path verified in dev builds

### Internal-distribution checklist

- [ ] Produce Android release-candidate build for internal testing
- [ ] Produce iOS release-candidate build for internal testing
- [ ] Upload Android build to Play Console Internal testing
- [ ] Upload iOS build to TestFlight
- [ ] Record build numbers, artifact names, and tester notes
- [ ] Triage and fix any blocking crash, signing, storage, or biometric regressions

### Honest status rule

P6-4 can be treated as `[~]` once the checklist and build path are prepared in-repo, but it must stay `[~]` until at least one real TestFlight upload and one real Play Internal upload have been completed.

## P6-5 — Store listing + legal pages

### Already true

- [x] Legal routes exist for Terms, Privacy, and Cookies in the web app.
- [x] Mobile wallet PRD / spec / security docs exist for release support material.
- [x] Finance/non-custodial positioning is already defined in `docs/mobile/ACP_WALLET_PRD.md`.

### Final listing/legal pack still required

- [ ] Final operator legal entity details inserted into legal pages/templates where still placeholder text remains
- [ ] Final support contact and escalation path confirmed for production
- [ ] App icon / screenshots / preview media prepared for iPhone and Android phone form factors
- [ ] Short description, long description, keywords, category copy, and risk disclosures finalized
- [ ] Store privacy questionnaire answered from the real deployed telemetry/logging posture
- [ ] Export/compliance declarations reviewed against final release scope and jurisdictions

### Reference copy baseline

- Category: **Finance**
- Positioning: **non-custodial ACP wallet**
- Core claims allowed: store, receive, send, local signing, bridge visibility, Smart Pay beta only if clearly labeled beta
- Claims not allowed: exchange, investment promises, autonomous sending, or shipped AI payment execution beyond current truth

## P6-6 — Production v1.0.0 release gate

Do **not** mark P6-6 done until all of the following are true:

- [ ] Android native build path verified on a host with Android NDK
- [ ] iOS native packaging verified on macOS/Xcode
- [ ] Device matrix complete on required physical devices
- [ ] PIN / biometrics / SecureVault migration verified on real devices
- [ ] Native create/send/sign/broadcast path verified end-to-end
- [ ] TestFlight and Play Internal runs completed and blocking issues resolved
- [ ] Listing/legal pack finalized with real operator/support details
- [ ] Release notes / versioning / rollback plan prepared

## Current blockers snapshot

As of 2026-05-28, the main blockers are still external-execution gates, not missing repo planning:

1. Android NDK-backed native build host
2. macOS/Xcode iOS packaging host
3. physical device verification time
4. final store-submission assets and operator/legal completion
