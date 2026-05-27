# ANCAP ACP Wallet — Roadmap

> Status: supporting mobile roadmap | Updated: 2026-05-25
> Source of truth for cross-project execution priority: `MASTER_ROADMAP.md`
> Current reality: the mobile wallet is far along, but it is **not** release-ready yet. The main remaining work is native build closure (Android NDK / iOS macOS-Xcode packaging), real device verification, security checklist completion, and store/release work.
> Fast status index: `docs/STATUS_MATRIX.md`

Official **non-custodial** mobile wallet for ACP (native) and wACP (BSC).
One codebase: **React Native + TypeScript** → iOS + Android builds.

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 0 — Program setup

| ID | Task | Status | Owner |
|----|------|--------|-------|
| P0-1 | `docs/mobile/ROADMAP.md` (this file) | [x] | — |
| P0-2 | `docs/mobile/ACP_WALLET_PRD.md` | [x] | — |
| P0-3 | `docs/mobile/WALLET_SPEC.md` | [x] | — |
| P0-4 | `docs/mobile/API_MOBILE.md` | [x] | — |
| P0-5 | `docs/mobile/SECURITY_MODEL.md` | [x] | — |
| P0-6 | `docs/mobile/BRIDGE_MOBILE_SPEC.md` | [x] | — |
| P0-7 | `ancap-mobile/` monorepo skeleton | [x] | — |
| P0-8 | Backend `GET /api/v1/mobile/config` + public ACP read API | [x] | — |

---

## Phase 1 — ACP crypto core (Rust FFI)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P1-1 | Crate `acp-mobile-ffi` wrapping `acp-crypto` | [x] | `ACP-crypto/acp-mobile-ffi/` |
| P1-2 | `create_wallet` / `import` / `validate_address` | [x] | keystore_json required for stable address |
| P1-3 | `acp_sign_transfer` (local sign, no broadcast) | [x] | uses keystore_json |
| P1-4 | walletd `sign-transfer` + `submit` | [x] | CLI for dev / bridge testing |
| P1-5 | Kotlin/Swift bindgen (`scripts/uniffi-generate.ps1`) | [x] | `acp-mobile-ffi/bindings/` |
| P1-6 | Link bindings in `expo-acp-core` Android | [~] | Kotlin + JNI wired; `build-android-native.ps1` now auto-detects SDK/NDK, but this host still needs an installed Android NDK to emit `.so` libs |
| P1-7 | iOS Swift UniFFI link | [~] | Expo iOS podspec now stages generated Swift/modulemap artifacts and can vend `acp_mobile_ffiFFI.xcframework`; `ancap-mobile/scripts/build-ios-native.ps1` added for macOS packaging, but runtime build verification still needs a macOS/iOS run |
| P1-7 | Golden-vector tests | [x] | `wallet_smoke.rs` |

---

## Phase 2 — TypeScript SDK

| ID | Task | Status | Package |
|----|------|--------|---------|
| P2-1 | `@ancap/acp-wallet-sdk` types + interface | [x] | `ancap-mobile/packages/acp-wallet-sdk` |
| P2-2 | `parseUnits` / `formatUnits` (8 decimals) | [x] | pure TS |
| P2-3 | Native bridge stub → FFI | [~] | `createWallet`, `signTransfer`, `estimateFeeDefault`, `addressFromKeystore`, native validate exports wired in SDK; full native app verification still pending |
| P2-4 | `@ancap/acp-api-client` | [x] | config, network status, balance/history/detail, device registration/listing, broadcast + fee flows; build clean, 12 tests passing |
| P2-5 | `@ancap/acp-bridge-client` | [x] | status, reserve proof, redeem quote, and authenticated intent create/list helpers; build clean, 9 tests passing |
| P2-6 | `@ancap/acp-bsc-client` | [x] | read-only wACP balance helpers; build clean, 13 tests passing |

---

## Phase 3 — Backend (mobile gateway)

| ID | Task | Status | Endpoint |
|----|------|--------|----------|
| P3-1 | Mobile config | [x] | `GET /v1/mobile/config` |
| P3-2 | Public balance | [x] | `GET /v1/acp/address/{address}/balance` |
| P3-3 | Public tx history | [x] | `GET /v1/acp/address/{address}/transactions` |
| P3-4 | Public tx detail | [x] | `GET /v1/acp/transactions/{txid}` |
| P3-5 | Fee estimate | [x] | `POST /v1/acp/tx/estimate-fee` |
| P3-6 | Broadcast signed tx | [x] | `POST /v1/acp/tx/broadcast` |
| P3-7 | Network status | [x] | `GET /v1/acp/network/status` |
| P3-8 | ACP indexer (DB-backed history) | [x] | `mobile_acp_indexer_tick` + `MobileAcpTx` model |
| P3-9 | Push device registration | [x] | `POST /v1/mobile/devices/register` + `unregister` + `GET` |
| P3-10 | Rate limits on broadcast | [x] | 10 req/min per IP |

---

## Phase 4 — React Native app

| ID | Task | Status | Screen |
|----|------|--------|--------|
| P4-1 | Expo app (`apps/acp-wallet-expo`) | [x] | expo-router |
| P4-2 | Navigation (onboarding + home) | [x] | |
| P4-3 | Welcome / Create / Import | [~] | Import OK; Create needs native FFI link |
| P4-4 | Tabs: Wallet / Activity / Send / Settings | [x] | |
| P4-5 | Receive + QR | [x] | |
| P4-6 | Send UI + broadcast API | [x] | sign needs native module |
| P4-7 | Backup + confirm seed | [x] | backup prompt before save; native FFI still needed for real generation |
| P4-8 | PIN + biometrics | [~] | PIN lock + biometric unlock preference wired in Expo app; still needs real device verification |
| P4-9 | SecureVault (Keychain / Keystore) | [~] | device-only SecureStore wired; enabling biometrics now migrates mnemonic + keystore into biometric-gated secure storage and adds iOS Face ID permission config; real device verification still pending |
| P4-10 | Dashboard (ACP + wACP) | [x] | wACP via BSC RPC (fetchWacpBalanceWei); ACP via ACP API |
| P4-11 | Send + preview + sign | [ ] | needs P1 FFI |
| P4-12 | Transaction history | [x] | |
| P4-13 | Bridge flows | [~] | status tab now uses real bridge client for live status, reserve proof, redeem quote, and market links; authenticated intents still v1.1 |
| P4-14 | Settings + legal links | [x] | Terms, privacy, bridge docs, reserve proof, support |
| P4-15 | i18n EN/RU/UK/DE | [x] | `react-i18next` wired in Expo app with persisted language selection and translated core wallet flows/screens |

---

## Phase 5 — Security hardening

| ID | Task | Status |
|----|------|--------|
| P5-1 | OWASP MASVS L1 checklist | [ ] |
| P5-2 | Screenshot block on seed screens | [x] | expo-screen-capture, active on seed visibility screen |
| P5-3 | Clipboard auto-clear | [x] | 30s auto-clear after copy |
| P5-4 | Root/jailbreak warning | [x] | dev-build warning on settings screen |
| P5-5 | No secrets in Sentry/logs | [x] | wallet error surfaces now route thrown messages through a shared secret-redacting helper; mnemonic/keystore/rawTx/bearer-token shaped values are scrubbed before UI/log propagation |
| P5-6 | App auto-lock timer | [x] | 5-min inactivity auto-lock |

---

## Phase 6 — QA & release

| ID | Task | Status |
|----|------|--------|
| P6-1 | Unit tests (SDK decimals, API client) | [x] | `vitest` across the mobile packages; latest consolidated snapshot: 56 tests across 5 packages |
| P6-2 | API integration tests | [x] | `tests/api/test_mobile_acp.py` |
| P6-3 | Device matrix (iOS + Android) | [ ] |
| P6-4 | TestFlight + Play Internal | [ ] |
| P6-5 | App Store / Play listing + legal pages | [ ] |
| P6-6 | Production v1.0.0 | [ ] |

---

## Smart QR Pay / AI Payment Scanner / Claim Codes track (v1.1 / v2)

> Status: execution started, but not shipped. Source plan/specs: `SMART_QR_AUTO_SWAP_PLAN.md`, `SMART_QR_PAYMENT_INTENT_SCHEMA.md`, `SMART_QR_API_SPEC.md`, `SMART_QR_SECURITY.md`

| ID | Task | Status | Notes |
|----|------|--------|-------|
| SQ-1 | Capability discovery | [x] | `GET /v1/mobile/smart-pay/capabilities` |
| SQ-2 | Deterministic parse | [x] | `POST /v1/mobile/smart-pay/parse` for ACP, raw EVM, EIP-681 first scope |
| SQ-3 | Quote engine groundwork | [~] | first backend `POST /v1/mobile/smart-pay/quote` slice in progress |
| SQ-4 | Execution session groundwork | [~] | execute/status/recover endpoints in progress |
| SQ-5 | Mobile SDK/client wiring | [~] | `@ancap/acp-api-client` now has typed Smart Pay capabilities/parse/quote/execute/status/recover methods; Expo app integration started |
| SQ-6 | Expo scan/import/pay UX | [~] | Smart Pay beta screen now supports paste, gallery QR import, camera QR scan, explicit confirmation before execute, and persisted draft/session restore in-device; polished UX/history still pending |
| SQ-7 | Real route execution integration | [ ] | bridge/swap/transfer orchestration beyond placeholder routes |
| SQ-8 | AI fallback classifier | [ ] | only after deterministic path is stable |
| SQ-9 | Receipt/history/recovery UX | [ ] | payment session resume + receipt screens |
| SQ-10 | AI Payment Scanner MVP | [ ] | camera/photo upload, QR recognition, OCR for invoices/receipts/payment screens, and payment-intent preview with manual correction |
| SQ-11 | Smart Payment Flow expansion | [ ] | auto asset matching, smart swap before payment, multi-chain routing, duplicate payment detection, merchant mode |
| SQ-12 | ANCAP Claim Codes / Crypto Voucher MVP | [ ] | lock balance, generate redeemable claim code, redeem from wallet/site, expiry/cancel/refund, ACP fees |
| SQ-13 | Secure escrow + claim verification layer | [ ] | hash-based code storage, status lifecycle, rate limits, anti-fraud, optional PIN/password |
| SQ-14 | Merchant / growth distribution layer | [ ] | gift codes, promo claim codes, airdrop claim links, QR vouchers for Telegram/X/web |

Scanner target formula:
- `Photo / QR -> AI Decode -> Payment Intent -> Smart Swap -> Pay`

Claim-code target formula:
- `Lock crypto -> Generate claim code -> Share code -> Redeem -> Receive crypto`

Claim-code storage model target:
- `claim_code` = public code shown to user
- `secret_hash` = only stored hash of redeem secret
- `locked_balance` = reserved amount
- `status` = `active | redeemed | expired | cancelled | locked`

Scope truth:
- this is a **post-v1.0** flagship track, not release-closure work
- first supported scope stays narrow: **ACP + BSC/EVM** only
- deterministic parser first, AI second
- AI/OCR may prepare a payment, but must never auto-send without explicit user confirmation
- final user confirmation remains mandatory
- claim-code storage must be hash-based and abuse-resistant, not plain-text voucher storage

## Post-MVP (v1.1+)

- Address book, multi-wallet, dark mode
- Push notifications (FCM)
- WalletConnect
- Full reverse bridge in-app (when rail is public-live)
- Merchant QR, staking, governance

---

## Timeline note

The original 8–12 week estimate is no longer the right way to read this document. The project is now in the late-stage completion zone, where the remaining duration depends mostly on host/tooling blockers and release verification:

- Android NDK installation and `.so` emission
- macOS/Xcode packaging for iOS native artifacts
- real device verification of create/send/lock/unlock/biometric flows
- MASVS/security checklist closure
- TestFlight / Play Internal / store listing work

Treat this roadmap as a task tracker, not as a reliable remaining-weeks estimate.

---

## Repository map

```
ANCAP/                          # this repo
  docs/mobile/                  # specs + roadmap
  app/api/routers/mobile_acp.py # mobile gateway API
  ACP-crypto/                   # Rust chain + wallet (source of truth)

ancap-mobile/                   # mobile monorepo (sibling or submodule)
  apps/acp-wallet/              # React Native app
  packages/acp-wallet-sdk/
  packages/acp-api-client/
  packages/acp-bridge-client/
  packages/acp-bsc-client/
```

---

## Critical difference: web vs mobile

| | Web `/wallet/acp` | Mobile ACP Wallet |
|--|-------------------|-------------------|
| Keys | Server (encrypted) | **Device only** |
| Signing | `walletd` on backend | **Local FFI** |
| API | `/v1/wallet/acp/*` (auth) | `/v1/mobile/*`, `/v1/acp/*` (public read + broadcast) |

---

## Current next gates

1. Install Android NDK and rerun `ancap-mobile/scripts/build-android-native.ps1`
2. Run `ancap-mobile/scripts/build-ios-native.ps1` on macOS/Xcode
3. Verify create/send/sign, PIN, biometrics, and SecureVault flows on real devices
4. Close MASVS L1 and "no secrets in Sentry/logs"
5. Run TestFlight + Play Internal validation
6. Prepare listing/legal/release artifacts and cut v1.0.0
7. In parallel for post-v1.0 Smart Pay: finish backend quote + execution session groundwork, then wire mobile SDK/client

_Update this file when closing tasks (change `[ ]` → `[x]`)._
