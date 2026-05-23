# ANCAP Production Roadmap

> Status: active | Updated: 2026-05-23

## Summary

ANCAP moves from a broad AI-native capital allocation platform into a production product where users, crypto teams, creators, and AI agents buy, create, and sell paid AI-workflows for ACP. The product priority is clear: real LLM execution, ACP-first monetization, proof receipts, realtime statuses, creator publishing, developer/API monetization, and B2B operational controls.

Fixed decisions:

- Primary LLM: Teneta/Claude-compatible Anthropic API.
- Payments: ACP-first. Stripe/fiat stays a later adapter after ACP checkout is stable.
- Roadmap style: production roadmap, not a "build everything" backlog.
- Fallback policy: template output is allowed only as explicitly degraded fallback, never as a hidden premium LLM result.

## Current Status

| Phase | Component | Status |
| --- | --- | --- |
| P0 | Auth rate limiting | DONE |
| P0 | Paid API idempotency/export/totals | DONE |
| P0 | Revenue margin/referral totals | DONE |
| P0 | Admin billing UI | PARTIAL |
| P1 | LLM abstraction and `llm_usage_events` | DONE |
| P1 | Real LLM in paid workflow execution | DONE |
| P2 | Redis-backed rate limits/cache/pubsub | DONE |
| P2 | `/system/health/full` and `/metrics` | DONE |
| P2 | Structured JSON logging | DONE |
| P3 | Workflow run SSE live status | DONE |
| P3 | Notification fanout and SMTP email service | DONE |
| P4 | ACP checkout, creator listing flow, revenue dashboard | DONE |
| P4 | Paid API spend caps, idempotency, CSV export | DONE |
| P5 | PostgreSQL FTS search and analytics dashboard | DONE |
| P5 | Product docs/help center | DONE |
| P6 | Strategy Builder MVP | PARTIAL: lightweight builder exists; React Flow canvas remains later |
| P6 | Social profiles/follows | PARTIAL: backend and profile pages exist; feed polish remains |
| P6 | Theme toggle and PWA shell | DONE |
| P7 | Audit log viewer | DONE |
| P7 | Organizations/teams | PARTIAL: backend complete, frontend UI in stabilization |
| P7 | Webhooks | PARTIAL: dispatcher complete, frontend UI in stabilization |
| Deploy | GitHub and production sync | PENDING: local `master` is ahead of `origin/master` |

## Immediate Finish Plan

1. Stabilize the open Phase 7 UI changes:
   - Fix `/strategy-builder` production build by wrapping `useSearchParams()` in a Suspense boundary.
   - Keep `apiFetch` exported for Webhooks and Organizations pages.
   - Keep navigation entries for Webhooks, Organizations, and Builder.
   - Verify Webhooks UI supports endpoint creation, delivery history, and test delivery.
   - Verify Organizations UI supports org list, org detail, members, roles, and billing wallet.

2. Commit and publish:
   - Run frontend lint/build and backend targeted tests.
   - Commit the remaining Phase 7 UI/build fixes as one clean commit.
   - Push local commits to GitHub so `origin/master` matches local `HEAD`.

3. Deploy:
   - Pull the pushed code on `/opt/ancap-migration/current`.
   - Verify production env without printing secrets.
   - Run `alembic upgrade head`.
   - Rebuild/restart API, frontend, Redis, ACP node, and nginx stack.
   - Smoke test `ancap.cloud` routes and API health endpoints.

## LLM Provider Reliability

Claude Code logs from 2026-05-23 show repeated `503 service_unavailable` from the Claude/Teneta-compatible upstream. Older logs also show insufficient balance and invalid model failures. Production should expose these as separate operator signals.

Required follow-up:

- Classify LLM failures as provider unavailable, invalid model, auth/key issue, balance issue, timeout, and unknown.
- Surface provider status in `/system/health/full` without leaking keys.
- Record provider status, latency, retry count, and fallback mode in `llm_usage_events`.
- Use retry/backoff for transient `503` and timeout errors.
- Mark proof receipts as degraded when template fallback is used after a paid workflow.
- Track degraded paid runs in revenue/quality dashboards for owner review.

## Public APIs And Interfaces

Available or in progress:

- `GET /system/health/full`
- `GET /metrics`
- `GET /workflow-store/runs/{id}/events`
- `GET /search`
- `GET/POST /webhooks`
- `GET /webhooks/{id}/deliveries`
- `POST /webhooks/{id}/test`
- `GET/POST /organizations`
- `GET/PATCH /organizations/{id}`
- `GET/POST /organizations/{id}/members`
- `GET /admin/audit-log`

Frontend routes to keep production-ready:

- `/ai/workflows`
- `/billing`
- `/developers`
- `/developers/webhooks`
- `/organizations`
- `/organizations/[id]`
- `/strategy-builder`
- `/dashboard/analytics`
- `/proof-center`

## Test Plan

Local quality gates:

- `npm run lint`
- `npm run build`
- `python -m pytest tests/api/test_workflow_store.py tests/api/test_paid_api.py tests/test_metrics.py -q`
- Full `pytest -q` before final release when time allows.

Production smoke:

- `https://ancap.cloud/`
- `https://ancap.cloud/ai/workflows`
- `https://ancap.cloud/billing`
- `https://ancap.cloud/developers`
- `https://ancap.cloud/developers/webhooks`
- `https://ancap.cloud/organizations`
- `https://ancap.cloud/strategy-builder`
- `https://ancap.cloud/proof-center`
- `/api/v1/system/health`
- `/api/v1/system/health/full`
- `/api/v1/metrics`

## Later Expansion

- Replace the lightweight Strategy Builder with a React Flow canvas once the current builder and version API are stable.
- Add Playwright smoke to CI for buyer, creator, developer, webhooks, organizations, and receipt flows.
- Add Bandit/Semgrep and Docker build checks to CI.
- Add Organizations-owned API keys, agents, billing wallet, and audit exports.
- Add signed webhook retry dashboard with replay controls.
- Consider fiat/Stripe only after ACP checkout, receipts, and creator payouts are stable.
