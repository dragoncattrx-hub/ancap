# WebID KYC and future card issuing path

> Status: P0 shipped (docs + waitlist + fail-closed status) | Updated: 2026-10-05  
> Partner site: [webid-solutions.com](https://webid-solutions.com/en/)

## Honest split

| Layer | Who | What it does |
|-------|-----|----------------|
| KYC / KYB | WebID (or equivalent) | Verify person / company (VideoID, CorporateID, ePassID, …) |
| Card issuing | Licensed BaaS / EMI | BIN, plastic/virtual cards, settlement |
| Apple Pay | Issuer + card network | Tokenize issued cards into Apple Wallet |

**WebID does not issue physical cards and does not enable Apple Pay by itself.**  
ANCAP soulbound `/passport` and org NFC are **not** regulated identity verification.

ANCAP remains **not a VASP** until counsel and a licensed card issuer change that posture. See [COMPLIANCE_ONRAMP_MATRIX.md](./COMPLIANCE_ONRAMP_MATRIX.md).

## Phases

### P0 — now (repo)

- Public waitlist: `/cards` → `POST /v1/commerce/ramp-waitlist` with `interest=physical_card_apple_pay`
- Fail-closed: `GET /v1/commerce/webid/status` → `configured=false`, `issues_cards=false`
- Env placeholders only (`WEBID_ENABLED=false`, empty credentials)

### P1 — after WebID commercial account

- Wire sandbox credentials (`WEBID_API_BASE`, `WEBID_CLIENT_ID`, `WEBID_CLIENT_SECRET`)
- Start / complete KYC session for gated surfaces; webhook ack
- CorporateID path if Gewerbe / UBO KYB is required

### P2 — licensed card path (counsel gate)

- Contract a European EMI / BaaS (not WebID) for plastic + Apple Pay tokenization
- Revisit “not a VASP” messaging before any “get your ANCAP card” CTA
- Link ACP spend only after issuer settlement rules are clear

## Operator checklist (outside repo)

1. Contact WebID business sales (Crypto/Web3 + CorporateID if company KYB)
2. Shortlist card issuer / BaaS separately
3. Counsel review before claiming card issuance or Apple Pay on product surfaces

## Public surfaces

| Surface | Role |
|---------|------|
| `/cards` | Waitlist + honesty copy |
| `GET /v1/commerce/webid/status` | Partner slot status (no secrets) |
| `/compliance` | Link to card waitlist |
| `/buy-acp` | Quiet link to `/cards` |
