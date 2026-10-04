# MoonPay Commerce (Helio) — ANCAP adapter

Dashboard: [moonpay.hel.io/developer](https://moonpay.hel.io/developer)  
Docs: [docs.hel.io](https://docs.hel.io/)

## Env (host / GitHub secrets — never commit)

| Variable | Purpose |
|----------|---------|
| `HELIO_PUBLIC_KEY` | Public API key (`apiKey` / `publicKey` query) |
| `HELIO_SECRET_KEY` | Secret Bearer token |
| `HELIO_PAYLINK_ID` | Checkout Pay Link id (widget) |
| `HELIO_WEBHOOK_SHARED_TOKEN` | HMAC sharedToken from pay-link webhook create |
| `HELIO_NETWORK` | `main` (production) or `test` (devnet) |
| `HELIO_PRIMARY_PAYMENT_METHOD` | `fiat` (default) or `crypto` |
| `HELIO_DEFAULT_AMOUNT` | Dynamic paylink amount string (e.g. `10`) |
| `HELIO_CURRENCY_HINT` | Display only (settlement is Pay Link currency) |

## Runtime

- Public status: `GET /v1/commerce/helio/status` (no secrets)
- Webhook: `POST /v1/commerce/helio/webhook` — verifies `X-Signature` HMAC-SHA256 of raw body
- UI: `/buy-acp` embeds `@heliofi/checkout-react` when status.configured

## Honesty

Checkout settles at MoonPay Commerce / Helio. ACP ledger credit after a successful payment is still operator/desk confirmed from the webhook log until auto-credit is wired. ANCAP is not a VASP; geo/KYC stays with the licensed partner.
