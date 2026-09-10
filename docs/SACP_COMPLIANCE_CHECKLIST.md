# sACP compliance checklist (S4)

Status: **process gate** — required before public mint / retail distribution.  
Does **not** replace counsel review.

## Positioning (locked)

| Claim | Allowed? |
|-------|----------|
| Soft USD *target* for commerce pricing | Yes |
| Guaranteed 1:1 USD redemption / e-money | **No** until licensed |
| Identical to wACP (ACP wrap) | **No** |
| Partner USDC/USDT substitute without disclosure | **No** |

Public copy must stay aligned with `docs/STABLECOIN_SACP_SPEC.md` and `/docs/sacp/risks`.

## Pre-public mint checklist

- [ ] Written memo: product = utility commerce settlement token, not deposit/e-money (jurisdiction-specific)
- [ ] MiCA / local VASP / EMI screening for EU and launch markets
- [ ] Terms + risk disclosure live on `/docs/sacp/risks` and linked from mint UX
- [ ] Reserve address, contract, gateway published; fake-contract warnings
- [ ] Operator runbook: pause, caps, snapshot cadence, incident contacts
- [ ] `GET /v1/sacp/reserve-proof` shows live snapshots (not stub zeros) for ≥7 days
- [ ] Sanctions / allowlist policy for mint recipients (reuse bridge operator controls where applicable)
- [ ] Marketing review: no “bank-backed”, “guaranteed peg”, “USD stablecoin FDIC” language
- [ ] Feature flag path: `SACP_PAUSED=true` / `FF_SACP=false` verified in staging

## Launch recommendation

Keep `mint_available` gated on configured contracts **and** this checklist sign-off. Until then, intents may exist for integration testing; public marketing should say **foundation / beta**.
