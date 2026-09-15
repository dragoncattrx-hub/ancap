# i18n Wave C — completed + Wave D backlog

## Status (2026-09-15)

### Done in this deploy

| Wave | Scope | Locale modules |
|------|--------|----------------|
| A | humanitarian, entertainment venues, sameAsEn leftovers | `humanitarian.ts`, `entertainment.ts` |
| B | wallet/acp, ai/runs, WorkflowRunPanel, OTC, dashboard | `runPanel.ts`, `otcIntake.ts`, `dashboardHub.ts` |
| C | cryo, literary, nexus, quantum-sim, saliva-rx, perimeter | `waveC.ts`, `deskCommon.ts`, `perimeter.ts` |
| C+ | governance, growth, feed, explorer | `platformPages.ts` |
| Nav/home | tmp-en-leftovers closed for RU/UK/DE/zh-Hant | `translations.ts` patches |

**Audit:** `cd frontend-app && npx tsx scripts/i18n-audit.ts` — 0 missing keys per locale.

**Smoke (RU):** `/`, `/humanitarian`, `/entertainment`, `/aeterna`, `/cryo`, `/literary`, `/nexus`, `/perimeter`, `/governance`, `/explorer`.

---

## Wave D — remaining batches (next PRs)

Pages still without `useLanguage` (~90). Batch by vertical; pattern: locale module → wire page → audit.

### D1 — Commerce / monetization (high traffic)

- `pricing/page.tsx` + `PricingView.tsx`
- `marketplace/page.tsx` (partial — check leftovers)
- `billing/page.tsx`, `wallet/credits/page.tsx`
- `dashboard/seller/*`, `sample-reports/[slug]`
- `buy-acp`, `pay/*`, `invoices`, `orders`

### D2 — AI / builder

- `ai/runs/page.tsx`, `ai/run/[template]`, `ai/bundles/[bundle]`
- `ai-console`, `ai-council`, `strategy-builder`, `strategy-compiler`
- `runs/*`, `workflow-store`

### D3 — Org / admin / ops

- `organizations/*`, `contracts/*`, `admin/*`
- `operations-noc`, `treasury/*`, `compliance/*`
- `developers/usage`, `developers/webhooks`

### D4 — Docs / legal shells

- Legal pages use `LegalViews` + `legal.ts` — wire page metadata only
- `docs/wacp/*`, `docs/sacp/*`, `docs/mobile/security`
- `whitepaper/*`

### D5 — Long tail

- `access`, `claim/*`, `bridge/page`, `explorer/tx/*`, `explorer/address/*`
- `dna-bank`, `passport`, `mail/connect`, `staking`, `bounties`, `evolution`
- Profile/listings/public agent pages

---

## Quality rules

1. EN source in domain `frontend-app/src/locales/*.ts`; merge in `translations.ts`.
2. Five langs: `en | ru | uk | de | zh-Hant`.
3. Brands stay: ANCAP, ACP, Proof Center (product name), Jack Daniel's, CE/FDA.
4. No RU+EN hospitality mixes in user-facing copy.
5. API/catalog text from backend stays as returned; only UI chrome gets `t()`.
6. Do **not** run `i18n-apply-fixes.ts` (destroys modular imports).

---

## Tooling

```bash
cd frontend-app
npx tsx scripts/i18n-audit.ts          # key parity
npx tsx scripts/i18n-page-keys.ts      # page key catalog (reference)
# hardcoded audit: tmp-i18n-hardcoded-audit.json (regenerate when needed)
```

After each wave: spot-check RU + DE on 3–5 URLs, push `master`, watch Deploy ancap.cloud + Frontend CI.
