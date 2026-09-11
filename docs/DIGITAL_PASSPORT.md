# Digital Passport — Soulbound BSC Identity

> Status: MVP (mock minter + BSC contract + API + mobile tab) | Phase 5.5 / 6

## Overview

ANCAP **Digital Passport** is a non-transferable (soulbound) on-chain attestation on BSC, backed by org member verification and optional Biohax NFC uid_hash binding. No PII is stored on-chain — only claim hashes and metadata URIs.

Distinct from:

- **Authenticity tab** — numismatic banknote/coin checks (mobile prototype)
- **Ownership certificates** — off-chain title/IP register with transfer codes

## Architecture

```text
Mobile NFC enroll (local hash)
    → POST /organizations/{org_id}/identity/nfc/register
Admin verify member
    → POST .../members/{user_id}/verify
Issue passport (mock or BSC minter)
    → POST .../members/{user_id}/passport  OR  /passports/organizations/{org_id}/issue
ChainAnchor mirror (ACP L3)
    → payload_type=digital_passport
```

## Smart contract

- Package: [`contracts/digital-passport/`](../contracts/digital-passport/)
- Contract: `DigitalPassport.sol` — mint / revoke / burn; transfers revert
- Tests: `forge test`
- Deploy: `forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast`

## Backend

| Env | Purpose |
|-----|---------|
| `DIGITAL_PASSPORT_DRIVER` | `mock` (default) or `bsc` |
| `DIGITAL_PASSPORT_CONTRACT` | Deployed contract address |
| `DIGITAL_PASSPORT_MINTER_PRIVATE_KEY` | Minter EOA (or reuse bridge key in dev) |
| `DIGITAL_PASSPORT_BSC_RPC_URL` | Optional override; falls back to `BRIDGE_BSC_RPC_URL` |
| `PASSPORT_DOCS_MASTER_KEY` | Optional dedicated key for education-doc encryption; else HKDF from `SECRET_KEY` |

API:

- `GET /v1/passports/me`
- `GET /v1/passports/{id}`
- `GET /v1/passports/{id}/metadata` (public tokenURI payload)
- `GET /v1/passports/education/cipher` (public cipher metadata)
- `GET|POST /v1/passports/{id}/education-docs` (encrypted education vault)
- `GET|DELETE /v1/passports/{id}/education-docs/{doc_id}`
- `POST /v1/passports/organizations/{org_id}/issue`
- `POST /v1/organizations/{org_id}/identity/members/{user_id}/passport`
- `POST /v1/passports/{id}/revoke`

### Education documents (encrypted at rest)

Off-chain vault for diplomas / certificates / transcripts / degrees / licenses attached to an active passport.

- Cipher: **ChaCha20-Poly1305** with **HKDF-SHA256** (`cipher_id=chacha20poly1305-hkdf-sha256-v2`)
- Distinct from wallet AES-GCM and mail-account AES-GCM
- Plaintext fields never leave the API unencrypted in DB; list endpoints return hints + content hash only
- Web UI: `/passport`

Revoke is triggered automatically when member status → `suspended` or `revoked`.

## Mobile wallet

Tab: **Passport** in `acp-wallet-expo`.

Env:

- `EXPO_PUBLIC_ORG_ID` — organization UUID for NFC sync + passport request
- `EXPO_PUBLIC_ANCAP_API_AUTH_HEADER` — Bearer token for authenticated passport APIs

NFC enroll in Settings calls `syncNfcCredentialToBackend()` when org + auth are configured.

## NFC policy enforcement

When `require_nfc_for_admins` is enabled on org policy:

- Admin verify / status / policy update routes require active NFC credential
- Org API key deletion requires NFC for admin actors

See [`docs/mobile/BIOHAX_NFC.md`](mobile/BIOHAX_NFC.md).

## Related

- Migrations: `066_digital_passport`, `072_passport_education_docs`
- Models: `DigitalPassport`, `DigitalPassportEducationDoc` in `app/db/models.py`
- Crypto: `app/services/passport_crypto.py`
- Service: `app/services/digital_passport.py`, `app/services/passport_education.py`
- Router: `app/api/routers/digital_passport.py`
