# Compliance On-Ramp Matrix

> Status: draft for partner ramp go-live | Updated: 2026-06-10

ACP is a **utility / accounting asset** for workflow fees, API spend, merchant checkout, and platform credits. ANCAP is **not** a VASP; fiat and stablecoin on-ramps are provided by licensed partners.

## Asset messaging (MiCA-safe)

| Rule | Implementation |
|------|----------------|
| No profit promises | No price targets, APY, or guaranteed returns in product copy |
| Utility positioning | ACP credits settle paid execution; not marketed as an investment |
| Risk disclosure | `/compliance`, bridge docs, refund/dispute policies linked from checkout |

## On-ramp tiers

| Method | Provider class | KYC tier | Geo | Fee band | Status |
|--------|----------------|----------|-----|----------|--------|
| Card → credits | Stripe | Partner KYC | EU + supported Stripe regions | 2–5% | Live E2E verify `[~]` |
| USDC/USDT widget | MoonPay / Transak / Ramp | Partner KYC | Per partner matrix | 1–3% markup | Waitlist / compliance review |
| wACP bridge | On-chain + reserve dashboard | Wallet self-custody | Global (user responsibility) | Network gas | Live with trust stub `/reserves` |
| P2P / OTC | **Not offered** | — | — | — | Avoid |

## Geo & sanctions

- Block sanctioned jurisdictions per partner + Stripe rules
- Creator / merchant terms require truthful business description
- Admin can freeze payout requests pending review (existing payouts router)

## Before ramp go-live

1. Legal review of landing + `/buy-acp` partner copy
2. Publish reserve addresses on `/reserves` with contract verification links
3. Webhook audit trail for `merchant.payment.*` and top-up events
4. Incident contact on `/status`
