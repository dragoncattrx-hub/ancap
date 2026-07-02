# Security Closure Evidence — 2026-07-01 Hardening Wave

> Status: operator evidence packet | Updated: 2026-07-02
> Purpose: verifiable closure record for the 2026-07-01 security + deploy hardening wave.
> Related: `docs/SECRET_ROTATION_RUNBOOK.md`, `MASTER_ROADMAP.md` § Hardening + deploy wave

## Scope

This packet documents repo-side and server-side security closure completed during the 2026-07-01 hardening deploy. It does **not** store secret values.

## Server credentials rotated (evidence only)

| Item | Status | Evidence location | Notes |
|---|---|---|---|
| Root password | Rotated | Server `Sicret/server-credentials-2026-07-01.txt` (chmod 600, git-ignored) | Not stored in repo |
| HestiaCP admin password | Rotated | Same Sicret file | Not stored in repo |
| `admin@ancap.cloud` mailbox | Rotated | Same Sicret file | SPF/DKIM/DMARC verified present in DNS |
| Production `.env` secrets | Verified present | Deploy script preflight on server | `CRON_SECRET`, `SECRET_KEY`, `DATABASE_URL`, etc. |

## GitHub Actions secrets configured

| Secret | Status | Purpose |
|---|---|---|
| `ANCAP_DEPLOY_HOST` | Set | Auto-deploy SSH target |
| `ANCAP_DEPLOY_USER` | Set | Deploy user (`ancapadmin`) |
| `ANCAP_DEPLOY_SSH_KEY` | Set | Dedicated ed25519 deploy key |
| `ANCAP_SYSTEM_JOBS_TICK_URL` | Set | `https://ancap.cloud/api/v1/system/jobs/tick/async` |
| `ANCAP_CRON_SECRET` | Set | Matches server `CRON_SECRET` |

Verification: `gh api repos/{owner}/{repo}/actions/secrets --jq .total_count` returns `5`.

## Backend security fixes shipped (commit `d86b007`+)

- `/v1/system/jobs/tick*` fail-closed without `CRON_SECRET` outside development
- `POST /acp/tx/broadcast` requires auth or registered device token
- `walletd` deterministic fallback raises in production
- `POST /chain/anchor` requires user or API key
- Debug platform-admin bypass removed
- `/internal/ops/ledger-invariant-status` requires platform admin

## Production deploy verification

| Check | Result | When |
|---|---|---|
| Build ID at `/internal/frontend-build` | `5e13b3f` matches `origin/master` | 2026-07-02 |
| `/api/v1/system/health` | `200 ok` | 2026-07-02 |
| `/api/v1/system/ready` | `200 ready` | 2026-07-02 |
| Alembic migration `c4d5e6f7a8b9` | Applied (Smart Pay records) | 2026-07-01 deploy |
| `acp1.ancap.cloud/rpc` | Fixed (nginx → compose proxy `:8080`) | 2026-07-01 |
| Auto-deploy workflow | Green (17m55s, timeout raised to 45m) | 2026-07-01 |

## Repo-side secret hygiene

Run locally or in CI:

```bash
python scripts/check_secret_hygiene.py
python scripts/generate_secret_hygiene_evidence.py --recent-history 20
pytest tests/test_secret_hygiene.py tests/test_release_security_workflows.py -q
```

Expected: all pass; artifacts under `tmp/secret-hygiene-*.json` and `tmp/secret-rotation-evidence.md`.

## External upstream cleanup (operator checklist)

Mark each when confirmed outside the repo:

- [ ] Any previously exposed LLM/provider API keys revoked at upstream dashboard
- [ ] Stripe webhook signing secret rotated if exposure window included webhook secret
- [ ] Cloudflare API token scoped/re-rotated if ever pasted in chat
- [ ] GitHub PATs/deploy tokens with excessive scope revoked
- [ ] Provider-side access audit completed for rotated credentials

## Closure verdict

| Layer | Verdict |
|---|---|
| Repo code hardening | **Closed** for 2026-07-01 wave |
| Server credential rotation | **Closed** (evidence on server Sicret only) |
| GitHub CI/CD secrets | **Closed** |
| Production deploy | **Closed** (build `5e13b3f` live) |
| External upstream revoke/audit | **Open** — operator must tick checklist above |

When all external upstream items are checked, update `docs/STATUS_MATRIX.md` § Security to remove "exposed provider key" remaining blocker.
