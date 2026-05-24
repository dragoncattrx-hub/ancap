# ACP Wallet — Security Model

Baseline: [OWASP MASVS](https://mas.owasp.org/MASVS/) Level 1.

## Trust boundaries

| Zone | Trust |
|------|--------|
| Secure Enclave / Keystore | High — encryption keys non-exportable |
| App process (unlocked) | Medium — user present |
| ANCAP API | Read-only + broadcast relay; **never** holds seed |
| ACP / BSC RPC | Untrusted network — TLS only |

## Never leave the device

- BIP39 mnemonic / seed phrase
- Private keys (decrypted)
- PIN (only verifier hash stored locally)
- Biometric templates

## Vault design

Current MVP implementation:

1. Cache address in device-only secure storage (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
2. Store mnemonic + `keystore_json` in device-only secure storage by default.
3. When the user enables biometric unlock, migrate mnemonic + `keystore_json` into biometric-gated secure storage (`requireAuthentication: true`) so reading signing secrets requires device authentication.
4. If device biometrics change and the secure item is invalidated, require wallet re-import from the backup phrase / keystore.

Current libraries: `expo-secure-store`, `expo-local-authentication`.

Future hardening target:
- move from direct secret storage to DEK-wrapped ciphertext + nonce in app sandbox, with the DEK protected by iOS Keychain / Android Keystore.

## App controls

| Control | MVP |
|---------|-----|
| PIN (6 digit) | Required |
| Biometric unlock | Optional after PIN |
| Auto-lock | 1 / 5 / 15 min |
| Screenshot block | Seed + confirm tx screens |
| Clipboard clear | Address 60s; block seed copy |
| Jailbreak/root warning | On launch |
| Transaction preview | Required before sign |

## Logging & analytics

- No mnemonic, PIN, private key, or full `rawTx` in logs.
- Sentry: scrub breadcrumbs; disable PII.
- Crash reports: no vault contents.

## API security

- TLS 1.2+ only; certificate pinning optional v1.1.
- Broadcast endpoint: rate limit, max tx size, reject malformed hex.
- No server-side signing for mobile users.

## Bridge UX security

Show custodial rail disclaimer (from `bridge-spec-v1.md`):

> wACP bridge is an operator-backed clearing rail, not a trustless bridge. Reserve and pause risk apply.

## Incident response

- Support: `support@ancap.cloud` (configure in env).
- Compromised device: user must rotate to new seed (export not supported in MVP — document recovery from backup only).
