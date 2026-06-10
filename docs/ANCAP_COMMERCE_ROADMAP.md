# ANCAP Commerce & Agent Roadmap (90 days)

> Source: Commerce + AI Agents strategic plan | Updated: 2026-06-10  
> Execution priority remains **`MASTER_ROADMAP.md`**; this document is the commerce track detail.

## Positioning

**ANCAP = AI-workflow commerce + crypto/stablecoin payments + proof receipts + marketplace + developer/MCP API**

## Shipped in this track (repo)

### ANCAP Pay (`/v1/pay`, `/v1/merchant`)
- Payment links, invoices, credits checkout, merchant dashboard, CSV export
- Webhook event: `merchant.payment.captured`

### Top-up & trust
- `/buy-acp`, `/wallet/top-up` → Stripe credits
- `/explorer`, `/status`, `/reserves` (stub)

### Workflow Store 2.0
- Bundles: `compliance-pack`, `growth-pro-pack`, `merchant-qr-pack`

### Claim codes
- `POST /v1/claim-codes/create`, `POST /v1/claim-codes/redeem`, UI `/claim`

### Developer / agents
- MCP server: `mcp-server/ancap_mcp_server.py`, docs `/mcp`
- Paid API hardening: `GET /paid-api/challenge`, `POST /paid-api/settle`, `POST /paid-api/consume`
- Payment scanner: `POST /payment-scanner/parse` (manual confirm required)

### Site map
`/pay`, `/invoices`, `/merchant`, `/claim`, `/mcp`, `/reserves`, `/workflow-store`, `/creators`, `/business`, `/compliance`

## Remaining scale items (61–90)

- AI Payment Scanner full UX (camera/OCR)
- Embedded wallet Simple/Advanced modes (partner eval: Privy/CDP/Circle)
- Business/Treasury approvals + batch payouts
- Full reserves dashboard + monthly transparency report
- Mobile wallet production release (MASTER_ROADMAP R5)

## Success metrics (90 days)

| Metric | Target |
|--------|--------|
| Payment links created | 50+ |
| Active merchants | 10+ |
| Stripe top-up E2E | Verified live |
| MCP tool invocations | 100+/week after launch |
| Claim codes redeemed | 200+ |

See also: `docs/COMPLIANCE_ONRAMP_MATRIX.md`, `ROADMAP-MONETIZATION.md`.
