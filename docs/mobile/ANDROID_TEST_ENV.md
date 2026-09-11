# ACP Wallet — local Android test environment

> Updated: 2026-09-11
> Clears the previous hard blocker: “no test environment / no device access”.

## Ready now

| Item | Status |
|------|--------|
| Android SDK | `C:\Users\drago\AppData\Local\Android\Sdk` |
| AVD | `Pixel_10_Pro` |
| Start script | `ancap-mobile/scripts/start-android-test-env.ps1` |
| Native `.so` | already emitted via `build-android-native.ps1` |

```powershell
powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1
# hung / high-CPU qemu: soft restart
powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1 -Restart
# factory reset AVD data if still broken
powershell -NoProfile -File ancap-mobile/scripts/start-android-test-env.ps1 -WipeData
cd ancap-mobile/apps/acp-wallet-expo
npx expo run:android
```

## What is NOT a work-stop blocker anymore

- Missing local device / emulator access — **cleared** (AVD + script).
- “No test environment” — **cleared**.

## Still open (operator / release gates, do not freeze coding)

- Play Internal / TestFlight upload credentials and listing assets
- Physical-phone biometrics / MASVS on-device sign-off
- iOS packaging (macOS/Xcode, P1-7)

Theodore / progress bots: **do not** report device/test-env as a blocker. Report store/physical/iOS only as follow-ups.
