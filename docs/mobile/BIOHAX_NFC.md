# Biohax NFC — Organization Identity & Wallet Unlock

> Status: scaffolding (backend API + mobile deps/i18n) | Phase 5.5

## Overview

ANCAP integrates **Biohax NFC implants** (and compatible NTAG devices) as an optional **presence factor** alongside the existing **PIN + biometrics** wallet unlock stack. Raw NFC UIDs never leave the device; only **SHA-256 hashes** are registered with the backend.

This document covers MVP scope, hardware assumptions, org employee verification, and future hooks into settlement and cybersecurity workflows.

## MVP scope

| Layer | MVP behavior |
|-------|----------------|
| Device | Read NFC UID via `react-native-nfc-manager`; hash locally (e.g. `expo-crypto` SHA-256); compare to enrolled hash in secure storage |
| Unlock | **UID hash presence + PIN** required when NFC unlock is enabled (biometrics remain optional second factor for vault secrets) |
| Backend | User registers `uid_hash` via org-scoped identity API; org admins verify members and optionally bind `employee_code` + `nfc_uid_hash` |
| Policy | Per-org flags: `require_nfc_for_admins`, `require_nfc_for_payments` (enforcement wiring is follow-up) |

**Not in MVP:** challenge–response on implant, DESFire secure element apps, server-side UID storage, or contactless payment authorization without PIN.

## Hardware — Biohax NTAG implants

Current target implants expose a static **NTAG** UID readable at short range (typically 4–7 bytes). The wallet:

1. Reads UID bytes from NFC tag/implant.
2. Computes `uid_hash = SHA-256(uid_bytes)` (hex, lowercase).
3. Registers hash via `POST /v1/organizations/{org_id}/identity/nfc/register`.
4. On unlock, re-reads tag and compares hash to enrolled credential(s).

**Security note:** NTAG UIDs are cloneable in principle; treat NFC as **presence/convenience**, not sole authentication. PIN (and biometrics for vault) remain mandatory for high-value actions.

## Future — DESFire / secure element

Roadmap phase (post-MVP):

- **MIFARE DESFire EV2/EV3** implants with on-chip keys and mutual auth.
- Backend stores only credential metadata + public key fingerprints, not static UIDs.
- Org policy can require DESFire-backed credentials for admin/payment gates.

## Organization employee verification

Backend models (`OrganizationMember` extensions):

- `employee_code` — org-assigned identifier (HR/payroll correlation).
- `verification_status` — `pending` | `verified` | `suspended` | `revoked`.
- `nfc_uid_hash` — optional bound implant hash at verification time.
- `verified_at` / `verified_by_user_id` — audit trail.

Admin flows (under `/v1/organizations/{org_id}/identity/...`):

- **Verify member** — `POST .../members/{user_id}/verify` (optional `employee_code`, `nfc_uid_hash`).
- **Update status** — `PATCH .../members/{user_id}/status`.
- **List verifications** — `GET .../members/verification`.
- **NFC policy** — `GET/PUT .../policy`.

Use cases:

- Crypto teams / creators gate org API keys or treasury actions on verified staff.
- Enterprise pilots tie implant enrollment to HR onboarding.

## API summary

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | `/organizations/{org_id}/identity/nfc/register` | member+ | Register hashed UID |
| GET | `/organizations/{org_id}/identity/nfc` | member+ | List own credentials |
| DELETE | `/organizations/{org_id}/identity/nfc/{credential_id}` | member+ | Revoke credential |
| POST | `/organizations/{org_id}/identity/members/{user_id}/verify` | admin+ | Verify employee |
| PATCH | `/organizations/{org_id}/identity/members/{user_id}/status` | admin+ | Set verification status |
| GET | `/organizations/{org_id}/identity/members/verification` | admin+ | List member verification state |
| GET/PUT | `/organizations/{org_id}/identity/policy` | viewer+ / admin+ | Org NFC policy |

Migration: `057_org_nfc_identity` (revises `e8f9a0b1c2d3`).

## Settlement ecosystem hooks (future)

- Verified org members as **authorized signers** on settlement intents / bridge operator actions.
- Webhook events: `org.member.verified`, `org.member.revoked`, `nfc.credential.revoked`.
- Audit log correlation: `DecisionLog` entries referencing `employee_code` + credential id.

## Cybersecurity ecosystem hooks (future)

- **Zero-trust admin**: org policy `require_nfc_for_admins` gates platform-admin-adjacent org routes.
- **Incident response**: suspend/revoke member verification propagates to API key spend caps and device tokens.
- **Threat model**: UID cloning → rate limits + PIN + optional step-up for payments; DESFire migration path documented above.

## Mobile implementation notes

- Dependency: `react-native-nfc-manager` (^3.16.0).
- Permissions: Android `NFC`; iOS `NFCReaderUsageDescription` in Expo config.
- i18n keys under `unlock.*` and `settings.*` (EN/RU/UK/DE) in `ancap-mobile/apps/acp-wallet-expo/lib/i18n.ts`.
- See also: `docs/mobile/SECURITY_MODEL.md`, `docs/mobile/ROADMAP.md` Phase 5.5.

## Related code

- Models: `app/db/models.py` — `MemberVerificationStatusEnum`, `UserNfcCredential`, `OrganizationNfcPolicy`
- Schemas: `app/schemas/org_identity.py`
- Router: `app/api/routers/org_identity.py`
