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
| PIN (4-8 digits) | Stored as salted SHA-256 verifier in device-only secure storage; raw PIN is no longer persisted |
| Biometric unlock | Optional after PIN |
| Auto-lock | 5 min inactivity timer currently wired in Expo app |
| Screenshot block | Seed phrase screen is protected; confirm-tx hardening still depends on native signing flow closure |
| Clipboard clear | Receive address auto-clears after 30s; seed copy remains blocked by UX |
| Jailbreak/root warning | Dev-build warning in settings; stronger native/root attestation still later |
| Transaction preview | Required before sign |

## NFC unlock (Biohax / NTAG — Phase 5.5)

Optional **presence factor** for wallet unlock when the user enrolls a Biohax-compatible NFC implant or tag:

- **On-device only:** raw NFC UID bytes are read via `react-native-nfc-manager` and hashed locally (SHA-256); only the **hash** is stored in secure storage and sent to ANCAP (`UserNfcCredential.uid_hash`).
- **Unlock stack:** enrolled UID hash match **plus PIN** (biometrics unchanged for vault secret access).
- **Limitations:** NTAG static UIDs are cloneable; NFC is not a sole auth factor. High-value sends still require PIN/preview.
- **Org binding:** admins may bind `nfc_uid_hash` to `OrganizationMember` during employee verification; org policy flags (`require_nfc_for_admins`, `require_nfc_for_payments`) scaffold future enforcement.

See `docs/mobile/BIOHAX_NFC.md` for hardware notes, API summary, and DESFire roadmap.

## MASVS L1 baseline closure (current repo truth)

The repo now covers the main MASVS-L1-applicable controls that are unblockable without final native/device release work:

- **Credential storage:** wallet address, mnemonic, keystore, PIN verifier, language preference, and Smart Pay session/history state use platform secure storage (`expo-secure-store`) with device-only accessibility for persisted secrets.
- **PIN handling:** the local app lock now stores only a salted SHA-256 verifier (`acp-wallet-pin:v1:<pin>` digest) instead of persisting raw digits, and successful unlock transparently migrates older plaintext PIN entries.
- **Biometric gating:** enabling biometrics still requires platform auth and moves wallet secrets into `requireAuthentication: true` secure-storage entries; invalidated biometric-protected entries force wallet re-import from backup.
- **Secret exposure reduction:** wallet UI/native error strings are sanitized before display/log forwarding so mnemonic / keystore / rawTx / bearer token shaped values are redacted.
- **Sensitive-screen handling:** screenshot blocking is active on the seed phrase generation view, receive-address clipboard copies auto-clear after 30 seconds, and the app auto-locks after 5 minutes of inactivity.
- **Trust boundary disclosure:** the bridge rail remains explicitly described as operator-backed/custodial-risk in user-facing docs.

What still remains before claiming full release closure:

- real device verification for PIN / biometric unlock / secure vault migration paths
- native create/send/sign path verification once Android/iOS FFI artifacts are built
- stronger production-grade root/jailbreak/device-integrity checks beyond the current dev-warning baseline
- store/release validation work (device matrix, TestFlight, Play Internal)

## Logging & analytics

- No mnemonic, PIN, private key, or full `rawTx` in logs.
- Expo wallet UI/error surfaces must pass thrown messages through a shared sanitizer before rendering or forwarding them, so mnemonic / `keystore_json` / `rawTx` / bearer-token shaped values are redacted even when upstream/native errors are noisy.
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
