# MASVS L1 — ACP Wallet Expo (Phase 6)

Checklist for OWASP MASVS Level 1 alignment. Status as of digital-passport / Phase 6 batch.

| ID | Control | Status | Notes |
|----|---------|--------|-------|
| M1 | App only requests needed permissions | Done | NFC, biometrics declared in `app.config.js` |
| M2 | No sensitive data in logs | Done | `safeErrorMessage` strips secrets in UI errors |
| M3 | Keyboard cache disabled on PIN fields | Partial | PIN uses `TextInput`; verify `secureTextEntry` on all secret fields |
| M4 | Sensitive data in secure storage | Done | `expo-secure-store` + biometric-gated vault (`lib/vault.ts`) |
| M5 | Root/jailbreak awareness | Partial | Document risk; no explicit jailbreak block in MVP |
| M6 | Session timeout | Done | 5 min auto-lock in `app/_layout.tsx` |
| M7 | Biometric/PIN gate | Done | `lib/lock.ts`, unlock screen |
| M8 | NFC as presence factor only | Done | UID hashed locally; PIN required (`BIOHAX_NFC.md`) |
| M9 | No hardcoded API secrets | Done | `EXPO_PUBLIC_*` auth header is dev-only; prod uses device token |
| M10 | TLS for API | Done | HTTPS default `api.ancap.cloud` |
| M11 | Certificate pinning | Not in MVP | Future native build |
| M12 | Backup/export user-controlled | Done | Mnemonic shown once at create/import |

## Gaps to close (P2)

- Explicit jailbreak/root detection hook before vault unlock
- Certificate pinning when native FFI ships
- Pen-test pass before store submission
