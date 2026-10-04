# Starlink Installation — Jobcenter presentation pack

Public URLs (after deploy):

| Surface | URL |
| --- | --- |
| Product (DE-first) | https://ancap.cloud/starlink-install |
| Legal notice | https://ancap.cloud/legal/starlink-install |
| ACP / USDT ramp | https://ancap.cloud/buy-acp |
| Workflow checkout (standard) | https://ancap.cloud/ai/run/starlink-standard |
| Intake alias | https://ancap.cloud/ai/run/starlink-install-intake |

## What to show Jobcenter

1. Open `/starlink-install` — region chips **NRW / Deutschland / EU**, EUR price list, live ACP/wACP quote.
2. Open `/legal/starlink-install` — honest framing: not Starlink Inc., not Telekom, not AVGS guarantee.
3. Optional: create a real ACP checkout on `starlink-standard` and keep the run receipt / proof center link.

## API smoke

```bash
curl -sS https://api.ancap.cloud/v1/starlink-install/catalog | head
curl -sS -X POST https://api.ancap.cloud/v1/starlink-install/quote \
  -H 'content-type: application/json' \
  -d '{"service_id":"starlink-standard","region":"de-nrw","payment_currency":"ACP"}'
```

## Honesty checklist

- [x] `official_reseller: false`
- [x] `jobcenter_guarantee: false`
- [x] Legal DE/EN/RU/UK copy states AVGS is agency-only
- [x] USDT is ramp via `/buy-acp`, not a fake parallel chain checkout
