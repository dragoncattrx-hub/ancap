# Instantly.ai + ANCAP Mail API

Upstream Instantly: [API v2](https://api.instantly.ai/api/v2) · [docs](https://developer.instantly.ai/)  
ANCAP base: `https://api.ancap.cloud/v1`

Auth for Instantly upstream: `Authorization: Bearer <INSTANTLY_API_KEY>`  
Auth for ANCAP user routes: session cookie (`ancap_token`) or `Authorization: Bearer <JWT>` + `X-Requested-With: XMLHttpRequest` for cookie POSTs.

## Enable on ancap.cloud

1. Instantly → **Settings → Integrations → API Keys** → create **V2** key with `accounts:*` scopes.
2. Store the key (shown once):

```bash
gh secret set INSTANTLY_API_KEY --body "YOUR_V2_KEY"
```

3. Redeploy full stack (`deploy-ancap-cloud.yml` mode=`full`). Deploy syncs the secret into host `.env` and sets `INSTANTLY_ENABLED=true`.

Or on the server `.env`:

```bash
INSTANTLY_ENABLED=true
INSTANTLY_API_KEY=...
INSTANTLY_API_BASE=https://api.instantly.ai/api/v2
```

## ANCAP endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/mail/accounts/defaults` | public | IMAP/SMTP defaults + Instantly flags |
| GET | `/mail/instantly/status` | public | Instantly enabled/configured |
| GET | `/mail/instantly/accounts?limit=20` | user | Proxy → Instantly `GET /accounts` |
| POST | `/mail/instantly/accounts` | user | Proxy → Instantly `POST /accounts` (Custom IMAP/SMTP, `provider_code=1`) |
| POST | `/mail/accounts/test` | user | Test IMAP/SMTP without save |
| GET | `/mail/accounts/me` | user | Connected single account (ANCAP DB) |
| POST | `/mail/accounts` | user | Save single account; optional `push_to_instantly` |
| DELETE | `/mail/accounts/me` | user | Remove ANCAP-stored account |

OpenAPI UI: `https://api.ancap.cloud/docs`

## Examples

### Status (public)

```bash
curl -sS https://api.ancap.cloud/v1/mail/instantly/status
```

### Create Custom IMAP/SMTP in Instantly via ANCAP

```bash
curl -sS -X POST https://api.ancap.cloud/v1/mail/instantly/accounts \
  -H "Authorization: Bearer $ANCAP_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "support@ancap.cloud",
    "first_name": "ANCAP",
    "last_name": "Support",
    "imap_username": "support@ancap.cloud",
    "imap_password": "...",
    "imap_host": "mail.ancap.cloud",
    "imap_port": 993,
    "smtp_username": "support@ancap.cloud",
    "smtp_password": "...",
    "smtp_host": "mail.ancap.cloud",
    "smtp_port": 587
  }'
```

### Direct Instantly (same payload)

```bash
curl -sS -X POST https://api.instantly.ai/api/v2/accounts \
  -H "Authorization: Bearer $INSTANTLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ ... same body + "provider_code": 1 ... }'
```

`provider_code` values: `1` Custom IMAP/SMTP · `2` Google · `3` Microsoft.

## UI

https://ancap.cloud/mail/connect — wizard with **Also register in Instantly.ai**.
