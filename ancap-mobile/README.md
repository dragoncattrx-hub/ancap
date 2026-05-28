# ANCAP ACP Wallet (Mobile)

Official **non-custodial** mobile wallet for ACP and wACP.

- **Roadmap & specs:** [`../docs/mobile/ROADMAP.md`](../docs/mobile/ROADMAP.md)
- **Device verification matrix:** [`../docs/mobile/DEVICE_MATRIX.md`](../docs/mobile/DEVICE_MATRIX.md)
- **Release readiness checklist:** [`../docs/mobile/RELEASE_CHECKLIST.md`](../docs/mobile/RELEASE_CHECKLIST.md)
- **v1.0.0 release runbook:** [`../docs/mobile/RELEASE_RUNBOOK.md`](../docs/mobile/RELEASE_RUNBOOK.md)
- **Backend API:** `GET /v1/mobile/config`, `/v1/acp/*` in ANCAP Core (`app/api/routers/mobile_acp.py`)

## Structure

```
ancap-mobile/
├── apps/acp-wallet/          # React Native app (UI)
├── packages/acp-wallet-sdk/ # Wallet crypto orchestration (→ Rust FFI)
├── packages/acp-api-client/  # ANCAP mobile gateway HTTP client
├── packages/acp-bridge-client/
└── packages/acp-bsc-client/
```

## Prerequisites

- Node.js 20+
- npm 10+ (workspaces)
- For native builds: Xcode (iOS), Android Studio (Android)
- Rust toolchain (for `ACP-crypto/acp-mobile-ffi` — Phase 1)

## Quick start

```bash
cd ancap-mobile
npm install
npm run typecheck
npm test
```

### Expo app (iOS / Android)

```bash
cd ancap-mobile
npm install
npm run app:expo
```

Then press `a` (Android) or `i` (iOS simulator). Set API URL:

```bash
# apps/acp-wallet-expo/.env
EXPO_PUBLIC_ANCAP_API_BASE=http://127.0.0.1:8000/v1
```

**Import wallet (dev):** run `walletd new` from `ACP-crypto`, paste address + mnemonic + `keystore_json` into Import screen.

### Native core (Android dev build)

Expo Go does **not** load custom Rust. Use a development build:

```powershell
# 1) Build .so libraries
.\ancap-mobile\scripts\build-android-native.ps1

# 2) Dev client + run on device/emulator
cd ancap-mobile
npm install
cd apps/acp-wallet-expo
npx expo run:android
```

### Native core (iOS dev build)

Run this on **macOS** with Xcode + Rust installed:

```powershell
# 1) Stage Swift UniFFI bindings + acp_mobile_ffiFFI.xcframework
.\ancap-mobile\scripts\build-ios-native.ps1

# 2) Dev client + run on simulator/device
cd ancap-mobile\apps\acp-wallet-expo
npx expo run:ios
```

The iOS script copies generated Swift files into `modules/expo-acp-core/ios/generated/`
and packages the Rust static libraries into `modules/expo-acp-core/ios/native/acp_mobile_ffiFFI.xcframework`.

Native code: `ACP-crypto/acp-mobile-ffi` + `modules/expo-acp-core`.

## Environment

Create `apps/acp-wallet/.env`:

```
ANCAP_API_BASE_URL=https://api.ancap.cloud/v1
```

For local API:

```
ANCAP_API_BASE_URL=http://127.0.0.1:8000/v1
```

## Development order

1. `@ancap/acp-api-client` against `/v1/mobile/config`
2. Rust FFI (`ACP-crypto/acp-mobile-ffi`) — see roadmap Phase 1
3. `@ancap/acp-wallet-sdk` wired to FFI
4. RN onboarding + vault
5. Send/receive + bridge UI
