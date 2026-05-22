# ANCAP Production Roadmap

> Status: active | Date: 2026-05-22

## Summary
Цель: довести ANCAP от "богатой платформенной инфраструктуры" до production-продукта, где пользователи и AI-агенты покупают, создают и продают платные AI-workflow за ACP, получают реальные LLM-результаты, proof receipts, realtime-статусы и понятные revenue/usage метрики.

**Решения зафиксированы:**
- Primary LLM: Teneta/Claude-compatible Anthropic API
- Payments: ACP-first; Stripe/fiat — отдельный адаптер после устойчивого ACP checkout
- Roadmap style: production roadmap, не "делать всё подряд"

---

## Status Tracker (as of 2026-05-22)

| Phase | Component | Status |
|-------|-----------|--------|
| P0 | Auth rate limiting | ✅ DONE |
| P0 | Paid API idempotency | ✅ DONE |
| P0 | Revenue margin totals | ✅ DONE |
| P0 | Admin billing UI | 🟡 PARTIAL (admin/overview exists, no dedicated billing page) |
| P1 | LLM abstraction (3 providers) | ✅ DONE |
| P1 | llm_usage_events table | ✅ DONE |
| P1 | Real LLM in workflow execution | ✅ DONE |
| P2 | Redis in docker-compose | ✅ DONE |
| P2 | Rate limits in Redis | ✅ DONE |
| P2 | /system/health/full | ✅ DONE |
| P2 | /metrics endpoint | ✅ DONE |
| P2 | Structured JSON logging | ❌ MISSING |
| P3 | WebSocket/SSE for workflow_runs | 🟡 PARTIAL (SSE only, no WebSocket) |
| P3 | Redis pub/sub | ❌ MISSING |
| P3 | Email service with SMTP | ✅ DONE |
| P3 | Notification fanout | 🟡 PARTIAL (model exists, tick is stub) |
| P4 | ACP checkout flow | ✅ DONE |
| P4 | Creator listing flow | ✅ DONE |
| P4 | Revenue dashboard | ✅ DONE |
| P4 | Paid API spend caps | ✅ DONE |
| P4 | Idempotency | ✅ DONE |
| P4 | CSV export | ❌ MISSING |
| P5 | PostgreSQL FTS | ❌ MISSING |
| P5 | Analytics dashboard | ❌ MISSING |
| P5 | /docs help center | ✅ DONE |
| P6 | React Flow strategy builder | ❌ MISSING |
| P6 | Chart components | 🟡 PARTIAL (referenced, not comprehensive) |
| P6 | Social layer (profiles, follows) | 🟡 PARTIAL (models exist, no profile pages) |
| P6 | Light theme toggle | ❌ MISSING |
| P6 | PWA manifest | ❌ MISSING |
| P7 | Audit log viewer | ❌ MISSING |
| P7 | Organizations/teams | ❌ MISSING |
| P7 | Webhooks | ❌ MISSING |

---

## Current Work Items

### Phase 0 — Stabilize Current Work ⏳ IN PROGRESS
**Acceptance:** git status чистый; CI покрывает новые API поля.

### Phase 2 — Structured JSON Logging ⏳ TODO
Добавить `structlog` для JSON-логирования: request id, user id, agent id, run id, provider, payment intent id.

### Phase 3 Partial — Redis pub/sub + Notification Fanout ⏳ TODO
- Redis pub/sub для realtime events
- Реализовать `notifications_fanout_tick.py` (email + in-app из NotificationEvent)

### Phase 4 — CSV Export ⏳ TODO
`GET /workflow-store/admin/revenue/export` с CSV форматом.

### Phase 5 — PostgreSQL FTS + Analytics ⏳ TODO
- GIN indexes + `to_tsvector/to_tsquery` для workflows/listings/agents/strategies
- Analytics dashboard page с charts

### Phase 6 — UX ⏳ TODO
- React Flow visual strategy builder
- Social profiles/follows UI
- Light theme toggle
- PWA manifest + icons

### Phase 7 — B2B ⏳ TODO
- Audit log viewer UI
- Organization model + router (orgs/teams/users, roles)
- Webhook model + delivery infrastructure

---

## Phase 1 — Real AI Execution Core ✅ DONE

### Phase 2 — Rate Limits, Redis, Observability

- Перевести rate limit state из in-memory в Redis; использовать один сервис для auth, paid API, workflow execution и LLM spend limits
- Добавить Redis в dev/prod compose для rate limit, cache, pub/sub и realtime events
- Добавить `/system/health/full`: DB, Redis, ACP RPC, LLM provider, mail config, bridge status
- Добавить `/metrics` Prometheus-compatible endpoint: HTTP latency/status, paid runs, payment statuses, LLM calls/errors, API usage, Redis health
- Структурировать логи JSON: request id, user id, agent id, run id, provider, payment intent id

**Acceptance:** production можно диагностировать без SSH-ручного чтения логов; 429 responses имеют Retry-After.

---

## Phase 3 — Realtime Runs + Notifications

- WebSocket/SSE канал для `workflow_runs/{id}`: quoted, payment_required, paid, queued, running, completed, failed, receipt_ready
- Backend события публиковать через Redis pub/sub; frontend добавить `useRunEvents` hook и live status на run/payment/receipt страницах
- Подключить email service к существующим SMTP config: registration, password reset, payment confirmed, workflow completed, receipt ready
- Notification center оставить как in-app source of truth; email/Telegram alerts сделать fanout из тех же событий

**Acceptance:** пользователь видит live status без refresh и получает уведомление после завершения paid run.

---

## Phase 4 — ACP Monetization + Creator Economy

- Довести ACP checkout до "без ручного ощущения": invoice, wallet/reference, polling, confirmed state, receipt/proof link
- Расширить creator flow: AI-agent/human creator может собрать workflow offer, задать ACP price, input schema, output items, proof policy и опубликовать listing
- Revenue dashboards: gross captured, reserved, refunds, referral commissions, estimated LLM/provider cost, estimated margin by SKU
- Paid API: spend caps, usage CSV export, idempotency, machine-readable 402/x402-compatible payment terms
- Stripe/fiat: добавить только PaymentProvider interface и `STRIPE_ENABLED=false` scaffold

**Acceptance:** новый пользователь за 2 клика понимает что купить; creator понимает как разместить paid workflow; owner видит маржу по SKU.

---

## Phase 5 — Discovery, Analytics, Docs

- Полнотекстовый поиск сначала на PostgreSQL FTS; Meilisearch/Typesense отложить до роста объема данных
- Search scope: workflows, listings, agents, strategies, sample reports, docs; фильтры: category, price, rating/reputation, tags
- Analytics dashboard: workflow revenue, paid conversion, active agents, API usage, referral funnel, ACP balances, run completion
- Docs/Help Center: `/docs` как продуктовая документация, `/api/docs` оставить Swagger; добавить guides для buyers, creators, agents, ACP wallet, paid API

**Acceptance:** пользователь может найти workflow/listing, понять API и увидеть понятные графики роста/выручки.

---

## Phase 6 — UX, Strategy Builder, Social, PWA

- Strategy builder MVP: React Flow visual editor поверх текущего JSON workflow spec, validation before publish, sample run preview
- Charts: shared chart components for equity curve, PnL, drawdown, governance votes, reputation
- Social layer: улучшить уже существующие follows/feed/leaderboards публичными профилями, creator pages и activity cards
- Theme/PWA: light theme toggle через CSS variables + localStorage/user preference; manifest, mobile icons, installable PWA shell

**Acceptance:** создание стратегии/workflow не требует ручного JSON; mobile UX не ломает wallet, dashboard, workflow checkout.

---

## Phase 7 — B2B/Ops Layer

- Audit log viewer объединяет governance audit, bridge audit, ledger events, workflow payments, API usage; фильтры по actor/type/date/status и CSV export
- Organizations: orgs/teams/users, роли owner/admin/member/viewer, org-owned agents, org billing wallet, org API keys
- Webhooks: subscribe to run.completed, payment.captured, receipt.ready, api.usage.created; signed delivery, retries, dashboard
- CI/CD: расширить backend CI на все API tests, добавить Playwright smoke, Bandit/Semgrep, Docker build check

**Acceptance:** B2B-команда может управлять доступом, аудитом и интеграциями без ручного администрирования.

---

## Phase 8 — Later / High-Cost Expansion

- Mobile app на Expo делать только после стабильного PWA и подтвержденного retention
- LayerZero/Wormhole рассматривать только после production hardening текущего ACP/wACP bridge
- Advanced mutation/evolution/governance auto-apply включать только за feature flags и после audit log + monitoring
- AI Council переводить на real LLM после общего LLM service, с отдельными moderation prompts и safety logs

---

## Public APIs

**New API groups:**
- `GET /system/health/full` — full health check ✅
- `GET /metrics` — Prometheus-compatible metrics ✅
- `GET /workflow-store/runs/{id}/events` via SSE ✅
- `GET /search` — PostgreSQL FTS ⏳ TODO
- `POST/GET /webhooks` ⏳ TODO
- `GET /admin/audit-log` ⏳ TODO
- `POST/GET /organizations` ⏳ TODO

**Existing APIs extended:**
- paid API usage includes totals/export/idempotency ✅ partial (totals + idempotency done, export ⏳)
- workflow revenue includes gross, reserved, refunds, provider cost, estimated margin, referral commission ✅
- workflow receipts include LLM usage metadata and proof fields ✅

**Frontend additions:**
- live run status ✅ (SSE)
- creator publishing flow ✅
- analytics dashboard ⏳ TODO
- help center ✅ (partial)
- search UI ⏳ TODO
- strategy builder ⏳ TODO
- audit viewer ⏳ TODO
- org settings ⏳ TODO

---

## Test Plan

**Backend:**
- LLM provider success/failure/timeout/fallback, redacted logs, usage event creation ✅
- Redis rate limit: per IP, per user, per agent, per API key, LLM spend limit ✅
- Workflow execution: quote → ACP payment → LLM run → completed → receipt/proof ✅
- Paid API: insufficient balance, spend cap, idempotency, CSV export ⏳ (CSV missing)
- Webhooks: signature, retry, duplicate delivery handling ⏳ TODO
- Organizations: role access matrix and org-owned resources ⏳ TODO

**Frontend:**
- Playwright golden paths for home → workflow purchase → payment state → receipt
- Creator dashboard → draft workflow → publish listing
- Search, analytics, notifications, mobile PWA smoke

**Infra:**
- Docker compose with Postgres + Redis + API + frontend + ACP node ✅
- CI runs migrations, backend tests, frontend build, Playwright smoke
- Production smoke: /, /ai/workflows, /billing, /developers, /proof-center, /api/v1/system/health, /api/v1/system/health/full

---

## Assumptions

- ACP remains the primary accounting and pricing currency: 1 ACP = 1 platform accounting unit
- Teneta/Claude-compatible endpoint is production default; OpenAI/Ollama are secondary providers
- Existing simulation stays available only as fallback/dev mode, not as the default paid workflow result
- Stripe is not a blocker for production launch; ACP checkout, paid API, bundles, creator listings, referrals and proof receipts are the main monetization engine
- Phase 0 stabilized 2026-05-22