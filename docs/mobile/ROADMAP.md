# ANCAP ACP Wallet — Roadmap

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
| P1-6 | Link bindings in `expo-acp-core` Android | [~] | Kotlin + JNI; run `build-android-native.ps1` |
| P1-7 | iOS Swift UniFFI link | [ ] | stub throws NotImplemented |
| P1-7 | Golden-vector tests | [x] | `wallet_smoke.rs` |

---

## Phase 2 — TypeScript SDK

| ID | Task | Status | Package |
|----|------|--------|---------|
| P2-1 | `@ancap/acp-wallet-sdk` types + interface | [~] | `ancap-mobile/packages/acp-wallet-sdk` |
| P2-2 | `parseUnits` / `formatUnits` (8 decimals) | [x] | pure TS |
| P2-3 | Native bridge stub → FFI | [ ] | |
| P2-4 | `@ancap/acp-api-client` | [~] | wired to `/v1/mobile/*` |
| P2-5 | `@ancap/acp-bridge-client` | [~] | `/v1/bridge/*` |
| P2-6 | `@ancap/acp-bsc-client` | [~] | read-only wACP balance |

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
| P3-8 | ACP indexer (DB-backed history) | [ ] | replace full-chain scan |
| P3-9 | Push device registration | [ ] | `POST /v1/mobile/devices/register` |
| P3-10 | Rate limits on broadcast | [ ] | |

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
| P4-4 | Backup + confirm seed | [ ] | screenshot block |
| P4-5 | PIN + biometrics | [ ] | |
| P4-6 | SecureVault (Keychain / Keystore) | [ ] | |
| P4-7 | Dashboard (ACP + wACP) | [ ] | |
| P4-8 | Receive + QR | [ ] | |
| P4-9 | Send + preview + sign | [ ] | needs P1 FFI |
| P4-10 | Transaction history | [ ] | |
| P4-11 | Bridge flows | [~] | status tab + docs links; intents in v1.1 |
| P4-12 | Settings + legal links | [ ] | |
| P4-13 | i18n EN/RU/UK/DE | [ ] | |

---

## Phase 5 — Security hardening

| ID | Task | Status |
|----|------|--------|
| P5-1 | OWASP MASVS L1 checklist | [ ] |
| P5-2 | Screenshot block on seed screens | [ ] |
| P5-3 | Clipboard auto-clear | [ ] |
| P5-4 | Root/jailbreak warning | [ ] |
| P5-5 | No secrets in Sentry/logs | [ ] |
| P5-6 | App auto-lock timer | [ ] |

---

## Phase 6 — QA & release

| ID | Task | Status |
|----|------|--------|
| P6-1 | Unit tests (SDK decimals, API client) | [~] |
| P6-2 | API integration tests | [x] | `tests/api/test_mobile_acp.py` |
| P6-3 | Device matrix (iOS + Android) | [ ] |
| P6-4 | TestFlight + Play Internal | [ ] |
| P6-5 | App Store / Play listing + legal pages | [ ] |
| P6-6 | Production v1.0.0 | [ ] |

---

## Post-MVP (v1.1+)

- Address book, multi-wallet, dark mode
- Push notifications (FCM)
- WalletConnect
- Full reverse bridge in-app (when rail is public-live)
- Merchant QR, staking, governance

---

## Timeline (estimate)

| Phase | Duration |
|-------|----------|
| P0 (setup) | **done** |
| P1 Rust FFI | 2–3 weeks |
| P2 TS SDK | 1 week (parallel with P1 tail) |
| P3 Backend remainder | 1 week |
| P4 RN MVP | 4–5 weeks |
| P5 Security | 1 week |
| P6 Release | 1–2 weeks |
| **Total to v1.0** | **~8–12 weeks** (2 devs) |

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

## Weekly checkpoints

1. **Week 1:** P1 POC — RN calls `create_wallet` on simulator
2. **Week 2:** P4 onboarding screens + vault
3. **Week 3:** Send/receive on testnet
4. **Week 4:** wACP balance + bridge status UI
5. **Week 5–6:** Security + TestFlight
6. **Week 7–8:** Store submission

_Update this file when closing tasks (change `[ ]` → `[x]`)._
