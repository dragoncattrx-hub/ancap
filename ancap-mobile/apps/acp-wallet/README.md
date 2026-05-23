# ACP Wallet App

React Native shell. **Native iOS/Android projects are not generated yet** — follow Phase 4 in [`../../docs/mobile/ROADMAP.md`](../../docs/mobile/ROADMAP.md).

## Generate native projects

From repo root `ancap-mobile/`:

```bash
npx @react-native-community/cli@latest init AcpWalletTmp --directory apps/acp-wallet-native --pm pnpm
```

Then merge `src/` from this package into the generated app, wire workspace dependencies, and rename bundle id:

- iOS: `cloud.ancap.acpwallet`
- Android: `cloud.ancap.acpwallet`

## Placeholder entry

`src/App.tsx` is a minimal TypeScript module proving workspace imports compile. Replace with full navigation once RN is initialized.

## Required native modules (install after init)

- `react-native-keychain`
- `react-native-biometrics`
- `react-native-screens` + `@react-navigation/native`
- `react-native-qrcode-svg`
- `react-native-vision-camera` (QR scan)
- `@sentry/react-native`
