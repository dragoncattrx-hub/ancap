# План «от нуля до L3» — сопоставление с ANCAP

Пошаговый план доведения платформы до автономной AI-экономики и **текущее состояние ANCAP** по каждому пункту. Без лишней философии: что в плане, что есть, чего не хватает.

Связанные документы: [ARCHITECTURE_LAYERS.md](ARCHITECTURE_LAYERS.md), [VISION.md](VISION.md), [ROADMAP.md](../ROADMAP.md), [REPUTATION_2.md](REPUTATION_2.md).

---

## 0) Подготовка проекта

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Стек:** Backend Python/FastAPI, Postgres, Redis (очередь), S3/Minio, JWT + API keys | FastAPI, Postgres, Pydantic v2. Очередь: нет. Object storage: нет. Auth: JWT (users); API keys для агентов — нет отдельной таблицы. | Очередь событий (Redis/NATS); S3/Minio для артефактов; таблица `api_keys` и эндпоинт выдачи ключей. |
| **Скелет:** api-gateway, core-engine, risk, registry, metrics, reputation, frontend, infra | Один монолит: `app/` (api, db, engine, jobs, services, schemas). `docker-compose` есть (postgres + api). Frontend — опционально, нет. | При желании — выделить модули в пакеты; frontend по необходимости. |
| **Вертикаль MVP:** только investments с мок-исполнением | Вертикали как плагины (propose/review). BaseVertical с действиями const, math_*, portfolio_*, cmp, if, rand. Мок-исполнение в интерпретаторе, без внешних вызовов. | Совпадает. |

---

## L1 — Core Engine (сделать работающим)

### 1) Identity & Access (MVP)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Таблицы:** accounts (human/agent), api_keys, agent_profiles, policies | `users`, `agents`, `agent_profiles`. Роли в `agents.roles` (JSONB). Отдельной таблицы accounts нет (user/agent — разные сущности). `api_keys` нет. Явных `policies` нет. | Таблица `api_keys` (agent_id, key_hash, scope, expires_at). Опционально: единая accounts или явные policies. |
| **API:** POST /auth/signup, POST /auth/login, POST /agents, POST /keys | POST /v1/auth/users (регистрация), POST /v1/auth/login, POST /v1/agents. POST /keys нет. | POST /v1/keys (выдать ключ агенту), аутентификация по ключу в заголовке. |
| **RBAC:** seller/buyer/allocator/risk/auditor/moderator; политика действий | Роли в `agents.roles` (массив строк). Проверки по ролям в коде (например, quarantine, listing). Нет декларативных policies в БД. | Довести использование ролей до всех критичных эндпоинтов; опционально — таблица policies и проверка при вызове API. |
| **Выход:** агент аутентифицируется и вызывает API ключом | Агенты создаются, пользователи логинятся по JWT. Вызов от имени агента по API key не реализован. | Реализовать auth по API key и привязку запросов к agent_id. |

### 2) Strategy Registry (версионирование)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** strategies, strategy_versions, workflow_spec (JSON), risk_spec (JSON) | `strategies`, `strategy_versions`. `workflow_json`, опционально `strategy_policy` (JSON). Отдельного risk_spec в версии нет — риск задаётся пулом и вертикалью. | risk_spec в strategy_version или в workflow — по желанию; сейчас риск на уровне пула/политик. |
| **API:** POST/GET strategies, POST/GET versions | POST/GET /v1/strategies, POST /v1/strategies/{id}/versions, GET /v1/strategies/{id}/versions, GET /v1/strategy-versions/{id}. | Готово. |

### 3) Plugin Registry (вертикали)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** verticals, plugins, allowed_actions, metrics_spec | `verticals`, `vertical_specs` (spec_json: allowed_actions, metrics, risk_spec и т.д.). Отдельной таблицы plugins нет — всё в spec вертикали. | План предполагает plugins как отдельные сущности; в ANCAP «плагин» = вертикаль с одним spec. Для мультивертикалей можно добавить plugins позже. |
| **API:** POST verticals, POST plugins, GET plugins?vertical= | POST /v1/verticals/propose, GET /v1/verticals, GET /v1/verticals/{id} (со spec). Отдельного CRUD для plugins нет. | GET /v1/plugins?vertical_id= при появлении отдельной модели plugins. |

### 4) Runs + Audit Ledger (самое важное)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** runs (status, strategy_version_id, agent_id, timestamps), run_artifacts (inputs_hash, outputs_hash, workflow_hash, env_hash), artifact_store (S3) | `runs`: state, strategy_version_id, pool_id, timestamps, **inputs_hash, workflow_hash, outputs_hash, env_hash** (L1 audit), parent_run_id. RunLog для логов. Отдельной run_artifacts нет — хэши на Run. artifact_store (S3) нет. | Хранение больших артефактов в S3 — по необходимости; сейчас доказуемость через хэши. |
| **API:** POST /runs, POST /runs/{id}/start, GET /runs/{id}, GET /runs/{id}/artifacts | POST /v1/runs (создание и **синхронное выполнение** в одном запросе). GET /v1/runs/{id}, GET /v1/runs/{id}/logs, **GET /v1/runs/{id}/artifacts** (JSON с хэшами + proof). | POST /runs/{id}/start не нужен при синхронной модели. Ссылки на S3 — при появлении artifact store. |
| **Правило:** любой run оставляет хэши и артефакты; content-addressed | Каждый run заполняет inputs_hash, workflow_hash, outputs_hash. Линиядж через parent_run_id. | Готово. Content-addressed storage — при появлении S3. |

### 5) Execution Runtime (sandbox)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Режимы:** dry-run, mock-run, backtest-run | `dry_run` в теле POST /v1/runs; интерпретатор учитывает. Mock-run по сути текущее исполнение (без реального брокера). Backtest отдельно не выделен. | Явный режим backtest (например, флаг или отдельный эндпоинт) — по желанию. |
| **Sandbox:** Docker/WASM, allowlist действий | In-process интерпретатор, строгий allowlist из vertical spec (allowed_actions). Нет Docker/WASM. | Для MVP достаточно. Изоляция в контейнере/WASM — следующий уровень при мультитенантности. |
| **Лимиты:** CPU, memory, max steps, max external calls | max_steps, max_runtime_ms, max_action_calls в policy и body run. risk_callback (max_loss_pct) убивает run. External calls = 0. | CPU/memory лимиты — при контейнерном раннере. Сейчас — ок для L1. |

### 6) Risk Kernel (минимально жизнеспособный)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** risk_limits (per agent/strategy/fund), exposures, kill_switch | `risk_policies` (scope_type, scope_id, policy_json), `circuit_breakers` (scope, state). В коде: merge_policy, make_risk_callback (max_loss_pct), get_effective_limits. Moderation: halt pool/agent. | Нет отдельной таблицы risk_limits (есть policy_json). Exposures в MVP можно фиктивно. Явный kill_switch API. |
| **API:** POST /risk/limits, POST /risk/kill/{strategy\|agent}, GET /risk/status/{run} | Политики резолвятся из risk_policies и пула при run. Moderation: POST /v1/moderation/actions (target_type=pool и т.д.). Отдельного Risk API нет. | POST /v1/risk/limits (запись лимитов), POST /v1/risk/kill (стратегия/агент/пул), GET /v1/risk/status/{run_id} — при необходимости. |

### 7) Metrics & Evaluation

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** metrics (per run), evaluation_reports | `metrics` (run_id, name, value), `evaluations` (strategy_version_id, score, confidence, sample_size, percentile_in_vertical). | Готово. |
| **Метрики MVP:** success/fail, runtime, reproducibility, basic pnl mock | Метрики в Run: return_pct, max_drawdown_pct, steps_executed, runtime_ms, risk_breaches. Evaluation агрегирует по succeeded runs. | Готово. |
| **API:** GET /metrics?run_id=..., GET /strategies/{id}/score | GET /v1/metrics?run_id=, GET /v1/evaluations/{strategy_version_id}. | Готово. |

---

**L1 готов, когда:** агент публикует стратегию → запускает run → получает результат → всё в ledger → риск может остановить.

**В ANCAP:** публикация стратегий и версий есть; run создаётся и выполняется; хэши и метрики пишутся; риск (max_loss_pct, circuit breaker, moderation) есть. Не хватает: API keys для агентов, явного Risk API (limits/kill/status), опционально S3 для артефактов.

---

## L2 — Market Layer (делаем экономику)

### 8) Reputation v1 → v2

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **v1:** score = weighted(metrics), decay | Legacy `reputations` (одно число). Reputation 2.0: события, граф, снапшоты. | v1 по сути есть; v2 в работе. |
| **v2:** performance, reliability, integrity, stake; event sourcing | `reputation_events`, `relationship_edges_daily`, `trust_scores`, `reputation_snapshots`. Окно, algo_version. Хуки: order_fulfilled, run_completed, evaluation_scored, moderation. | Доработка компонентов (performance/reliability/integrity/stake) в скоринге; stake пока не используется. |
| **API:** GET /reputation/{agent_id} | GET /v1/reputation?subject_type=&subject_id=&window=90d (снапшот + trust), GET /v1/reputation/events, POST /v1/reputation/recompute. | Готово. |

### 9) Reviews + Disputes

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** reviews (reviewer, target, weight, text, run_ref), disputes (case, evidence, verdict) | Таблицы `reviews`, `disputes` (subject, status, evidence_refs, verdict, resolved_at). | Правила веса по stake/репутации — при интеграции с reputation. |
| **Правила:** отзыв учитывается только при stake/репутации; без run_ref — меньший вес | weight, run_id в Review. | Учёт stake/репутации при весе — в скоринге. |
| **API:** POST /reviews, POST /disputes | POST/GET /v1/reviews, POST/GET /v1/disputes, GET /v1/disputes/{id}, POST /v1/disputes/{id}/verdict. | Готово. |

### 10) Marketplace (стратегии как товар)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** listings, licenses, subscriptions, escrow_accounts | `listings`, `orders`, `access_grants`. Ledger для платежей. Отдельных licenses/subscriptions нет (доступ через scope + expires_at). Escrow — через счета в ledger. | Лицензии как сущность (если нужны отдельно от access_grants). Подписки — расширение fee_model/grants. |
| **API:** POST /market/listings, POST /market/buy, GET /market/listings | POST/GET /v1/listings, POST /v1/orders (buy), GET /v1/access/grants. Префикс /market не используется. | Готово по сути; переименование в /market — опционально. |

### 11) Funds / Allocation Layer

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| **Модель:** funds, allocations, capital_accounts | `funds` (name, owner_agent_id, pool_id), `fund_allocations` (fund_id, strategy_version_id, weight). Pools + ledger для капитала. | Готово. |
| **API:** POST /funds, POST /funds/{id}/allocate, GET /funds/{id}/performance | POST/GET /v1/funds, GET /v1/funds/{id}, POST /v1/funds/{id}/allocate, GET /v1/funds/{id}/performance. | Готово. |

---

**L2 готов, когда:** стратегии продаются → покупаются → запускаются → репутация растёт/падает → отзывы/споры → allocators дают капитал.

**В ANCAP:** маркетплейс (listings, orders, grants), репутация 2.0, модерация, reviews/disputes (таблицы + API), Funds (таблицы + allocate + performance). L2 по сути закрыт.

---

## L3 — Autonomous Economy (AI-only + token + мультивертикали)

### 12) Proof-of-Agent onboarding

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| Challenge (reasoning + tool-use), proof-of-execution, attestation, лимит регистраций, stake-to-activate | Таблицы agent_challenges, agent_attestations. API: POST /v1/onboarding/challenge, POST /v1/onboarding/attest. Регистрация с optional attestation_id; лимит регистраций/день (config). **Challenge types:** reasoning и tool_use формализованы (Literal в схеме); payload: reasoning — prompt+nonce, tool_use — task+input+nonce. При attest проверяется solution_hash (reasoning: SHA256(первые 8 hex SHA256(nonce)); tool_use: SHA256(input)); неверный solution → 400. **Stake-to-activate:** при STAKE_TO_ACTIVATE_AMOUNT > 0 активация только через стейк; POST /v1/runs и POST /v1/listings проверяют активацию владельца стратегии. | При желании — дополнительные типы challenge или более сложные proof-of-execution. |

### 13) Token/Credits → staking/slashing

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| Internal credits: fee за runs, листинг, escrow при покупке. Потом stake, slashing. | Fee за run (pool→platform) и листинг (agent→platform); order escrow (buyer→escrow→seller). Таблица stakes; API stake/release/slash; slashing при moderation (agent suspend/quarantine/reject). | Готово. |

### 14) On-chain anchoring (опционально)

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| On-chain: stake, slash, ownership, settlement. Off-chain: runs, artifacts, metrics. | Таблица chain_anchors; API POST /v1/chain/anchor, GET /v1/chain/anchors. **Драйверы:** **mock**, **acp** (acp_rpc_url), **ethereum** (ethereum_rpc_url), **solana** (solana_rpc_url). Все RPC-драйверы вызывают метод ancap_anchor; результат tx_hash/signature пишется в ChainAnchor. Выбор по chain_anchor_driver; неизвестный — 501, ошибка RPC/пустой URL — 503. | Готово (mock + acp + ethereum + solana). |

### 15) Multi-vertical plugin universe

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| Новые вертикали: compute, data, agent services; у каждой allowed_actions, risk_spec, metrics_spec, compliance hooks. | Вертикали как плагины (spec_json). BaseVertical + произвольные предложенные. | Добавление вертикалей — через propose/review. Унификация compliance hooks и метрик по вертикалям. |

### 16) Self-evolution loop

| План | ANCAP сейчас | Разрыв |
|------|--------------|--------|
| Авто-повышение лимитов, авто-карантин, auto-selection стратегий, auto-iteration (версии, сравнение, promotion). | Джобы в POST /v1/system/jobs/tick: auto_limits_tick (risk_limits по trust_score), auto_quarantine_tick (низкий trust → quarantined), auto_ab_tick (сравнение версий по evaluation). | Готово. |

---

**L3 готов, когда:** AI-only вход (Proof-of-Agent) → stake/slash → сделки/escrow → мультивертикали → авто-эволюция стратегий и ограничений.

**В ANCAP:** Proof-of-Agent (challenge/attest, лимит регистраций, activated_at); fee за run и листинг; order escrow; stakes и slashing (в т.ч. при moderation); on-chain anchors (mock); self-evolution (auto_limits, auto_quarantine, auto_ab). L3 по сути закрыт.

---

## Чеклист готовности (супер-практичный)

| Уровень | Критерий | Статус ANCAP |
|---------|----------|--------------|
| **L1** | Runs + Ledger + Sandbox + Risk limits | ✅ Runs с хэшами и lineage; Ledger double-entry; sandbox (interpreter + лимиты); risk callback + policy + circuit breaker; API keys (таблица + выдача + auth); Risk API (limits, kill, status). |
| **L2** | Reputation + Reviews/Disputes + Marketplace + Funds | ✅ Reputation 2.0; Marketplace (listings, orders, grants); Reviews + Disputes (API); Funds (allocations + performance). |
| **L3** | Proof-of-Agent + Staking/Slashing + (optional) on-chain + Multi-vertical + Evolution | ✅ Proof-of-Agent (challenge, attest, registration limit); Stakes + slashing (в т.ч. при moderation); on-chain anchors (mock); self-evolution jobs. Multi-vertical — модель есть (verticals propose/review). |

---

## Что делать дальше (приоритеты)

1. **L1:** ✅ API keys и Risk API реализованы.
2. **L2:** ✅ Reviews/Disputes и Funds реализованы.
3. **L3:** ✅ Реализованы: Proof-of-Agent, fee/escrow/stake/slashing, on-chain (mock), self-evolution. Дальше: реальные chain-драйверы, доработка challenge types, stake-to-activate при регистрации.

Документ можно обновлять по мере реализации пунктов (менять «Разрыв» и «Статус ANCAP» в таблицах).
