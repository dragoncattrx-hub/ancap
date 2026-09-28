# Safe launch checklist (2026-09-28)

Operator dry-run before treating ancap.cloud as “final launch”.

## Auth / API

- [ ] `docker-compose.prod.yml` has `CORS_ORIGINS` including `https://ancap.cloud` and `https://www.ancap.cloud`
- [ ] Browser login from `ancap.cloud` → `api.ancap.cloud` sets `ancap_token` with `HttpOnly`, `Secure`, `SameSite=Lax`, `Domain=.ancap.cloud`
- [ ] Network failure shows friendly API-unreachable copy (not raw `Failed to fetch`)
- [ ] `pytest tests/test_auth.py tests/test_cors_dev_stack.py -q` passes

## Free ACP / market honesty

- [ ] `GET /v1/market/free-distribution` reports cap / distributed / open
- [ ] Faucet rejects amount above `FAUCET_MAX_AMOUNT_ACP` (default 10)
- [ ] When distributed ≥ 1_000_000 ACP or `FREE_ACP_DISTRIBUTION_ENABLED=false`, welcome/faucet/referral signup stop
- [ ] `/buy-acp` and `/markets` copy distinguish desk quote vs wACP DEX spot vs promo credit

## Anti-sybil

- [ ] Second registration from same device/IP within window does not receive welcome grant
- [ ] Faucet for quarantined users returns `held`
- [ ] `faucet_abuse_check_tick` flags granted claims for review

## Theodore / security

- [ ] `scripts/theodore-earn-promo.ps1` runs visibly; no `-WindowStyle Hidden`
- [ ] Script refuses wallet/signer env vars
- [ ] `python scripts/check_secret_hygiene.py` clean for pending push
- [ ] Skim `docs/AUDIT_CHECKLIST.md` + `docs/CISCO_SECURITY_APPENDIX.md`

## wACP / listings

- [ ] `python scripts/check_wacp_reserve_before_mint.py` passes before any mint/LP
- [ ] Mint only to treasury/multisig after human confirm (no agent auto-mint)
- [ ] `/docs/wacp/metamask` and `/tokenlist.json` show canonical address only
- [ ] CoinGecko submission (if any) uses **wACP**, never ticker ACP

## Legal / transparency

- [ ] Terms §3 residency draft reviewed by licensed counsel before relying on it
- [ ] Operator entity placeholders filled when Cyprus/other Ltd is incorporated
- [ ] Public GitHub stays public-safe; secrets stay private (`OPEN_SOURCE_GITHUB_TRANSPARENCY.md`)

## New verticals (MVP)

- [ ] `/server-bounty` + `/v1/robot-ops/server-install-bounties` pending until operator verify
- [ ] Robot telemetry ingest requires active owner consent
- [ ] `/delivery` jobs are separate from strategy `/marketplace`

## Content

- [ ] No “time machine / time lighter” claims in hero; if used, keep as footer joke only
