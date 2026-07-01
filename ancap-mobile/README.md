# ANCAP ACP Wallet (Mobile)

Official **non-custodial** mobile wallet for ACP and wACP.

- **Roadmap & specs:** [`../docs/mobile/ROADMAP.md`](../docs/mobile/ROADMAP.md)
- **Device verification matrix:** [`../docs/mobile/DEVICE_MATRIX.md`](../docs/mobile/DEVICE_MATRIX.md)
- **Device verification evidence template:** [`../docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md`](../docs/mobile/DEVICE_VERIFICATION_EVIDENCE_TEMPLATE.md)
- **Device evidence packet generator:** `python ../scripts/generate_mobile_device_verification_packet.py`
- **Release readiness checklist:** [`../docs/mobile/RELEASE_CHECKLIST.md`](../docs/mobile/RELEASE_CHECKLIST.md)
- **Release evidence packet template:** [`../docs/mobile/RELEASE_EVIDENCE_PACKET_TEMPLATE.md`](../docs/mobile/RELEASE_EVIDENCE_PACKET_TEMPLATE.md)
- **Release evidence packet generator:** `python ../scripts/generate_mobile_release_evidence_packet.py`
- **v1.0.0 release runbook:** [`../docs/mobile/RELEASE_RUNBOOK.md`](../docs/mobile/RELEASE_RUNBOOK.md)
- **Backend API:** `GET /v1/mobile/config`, `/v1/acp/*` in ANCAP Core (`app/api/routers/mobile_acp.py`)

## Structure

```
ancap-mobile/
├── apps/acp-wallet-expo/     # Expo app (UI)
├── packages/acp-wallet-sdk/  # Wallet crypto orchestration (→ Rust FFI)
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
# Optional dev/test-only bearer header for authenticated mobile history / resume flows.
# Do NOT ship production secrets through EXPO_PUBLIC_* env vars.
EXPO_PUBLIC_ANCAP_API_AUTH_HEADER=Bearer your-dev-token
```

Without `EXPO_PUBLIC_ANCAP_API_AUTH_HEADER`, the Expo Smart Pay screen still supports anonymous parse/quote/execute plus device-local `sessionToken` resume, but authenticated backend payment-history/resume stays unavailable in that build.

**Import wallet (dev):** run `walletd new` from `ACP-crypto`, paste address + mnemonic + `keystore_json` into Import screen.

### Android Studio (native dev build)

Expo Go does **not** load custom Rust. Use a development build.

```powershell
# One-shot setup: npm install, local.properties, Gradle check
.\ancap-mobile\scripts\prepare-android-studio.ps1

# Optional: compile Rust FFI (.so) before opening Studio
.\ancap-mobile\scripts\prepare-android-studio.ps1 -BuildNative
```

Then in **Android Studio**:

1. **Open** `ancap-mobile/apps/acp-wallet-expo/android` (not the ANCAP repo root).
2. **Sync** Gradle (File → Sync Project with Gradle Files).
3. **Run** the `app` configuration on an emulator or device.

If sync fails with “Cannot run program node”, re-run the prepare script — it writes `node.dir` into `local.properties`.

```powershell
# 1) Build .so libraries (when wallet crypto is needed)
.\ancap-mobile\scripts\build-android-native.ps1

# 2) Ensure Gradle sees Java on Windows hosts
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'

# 3) Dev client + run on device/emulator
cd ancap-mobile
npm install
cd apps/acp-wallet-expo
npx expo run:android
```

If you want a host-side sanity check before launching Expo, `apps/acp-wallet-expo/android` should now pass:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd ancap-mobile\apps\acp-wallet-expo\android
.\gradlew.bat :app:assembleDebug
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

Create `apps/acp-wallet-expo/.env`:

```dotenv
EXPO_PUBLIC_ANCAP_API_BASE=https://api.ancap.cloud/v1
# Optional dev/test-only bearer header for authenticated mobile history / resume flows.
# Do NOT ship production secrets through EXPO_PUBLIC_* env vars.
# EXPO_PUBLIC_ANCAP_API_AUTH_HEADER=Bearer your-dev-token
```

For local API:

```dotenv
EXPO_PUBLIC_ANCAP_API_BASE=http://127.0.0.1:8000/v1
```

## Development order

1. `@ancap/acp-api-client` against `/v1/mobile/config`
2. Rust FFI (`ACP-crypto/acp-mobile-ffi`) — see roadmap Phase 1
3. `@ancap/acp-wallet-sdk` wired to FFI
4. RN onboarding + vault
5. Send/receive + bridge UI
