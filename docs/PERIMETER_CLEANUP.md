# Perimeter cleanup desk (Abrams Suite-B vault)

ACP-paid field service: **уборка периметра от всех видов загрязнений**.

## Cipher

| Field | Value |
|-------|--------|
| `cipher_id` | `aes256-gcm-hkdf-sha384-abrams-suiteb-v1` |
| Algorithm | **AES-256-GCM** |
| KDF | **HKDF-SHA384** |
| Inspiration | Public **Suite B / CNSA** algorithms used alongside Abrams-class **Type 1** radio stacks |

**Not** classified Type 1 keying material — only open AES-256-GCM in a dedicated key namespace (`PERIMETER_CLEANUP_MASTER_KEY` or derived from `SECRET_KEY`).

Distinct from passport ChaCha20-Poly1305 and DNA/RNA bank AES vaults (different salt/info).

## API (`/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/perimeter-cleanup/cipher` | public |
| GET | `/perimeter-cleanup/catalog` | public |
| GET | `/perimeter-cleanup/jobs` | user |
| POST | `/perimeter-cleanup/jobs` | user |
| GET | `/perimeter-cleanup/jobs/{id}` | user (decrypt) |

## UI

- `/perimeter` — catalog + encrypted job brief form
- Insurance product `perimeter_cleanup` on `/insurance`

## Compliance

Licensed operators and local environmental permits required. Radiological SKU is survey/protocol notes only — not waste custody. ANCAP stores encrypted briefs; it does not run unlicensed hazmat itself.

## Migration

`074_perimeter_cleanup` → table `perimeter_cleanup_jobs`

## Config

- `FF_PERIMETER_CLEANUP` (default true)
- `PERIMETER_CLEANUP_MASTER_KEY` (optional dedicated master)
