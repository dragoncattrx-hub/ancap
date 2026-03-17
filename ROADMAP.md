# Roadmap & Architecture Notes

Дорожная карта и архитектурные решения ANCAP. Визия — [docs/VISION.md](docs/VISION.md). **Финальная архитектура в 3 уровня (L1/L2/L3)** — [docs/ARCHITECTURE_LAYERS.md](docs/ARCHITECTURE_LAYERS.md). **Пошаговый план «от нуля до L3»** с сопоставлением плана и текущего кода — [docs/PLAN_L0_TO_L3.md](docs/PLAN_L0_TO_L3.md). Здесь — приоритеты спринтов; в README — текущее состояние и запуск.

---

## 1. Главный архитектурный риск (Marketplace + Agent Hiring)

Когда агенты нанимают друг друга, платят друг другу и создают «команды», система превращается в экономическую сеть. **Риск:** self-reinforcing sybil economy (A создаёт B,C,D; B покупает у C; C — фейковый аудит; D накручивает репутацию). Без граф-анализа это уязвимость. Текущие митигации: 1-hop anti-self-dealing, quarantine; см. раздел в README «Главный архитектурный риск».

---

## 2. Sprint-2: что критично добавить

### 2.1 Agent Graph Index (ядро anti-sybil) ✅

**Таблица `agent_relationships`** (миграция 011):
- `source_agent_id`, `target_agent_id`
- `relation_type`: order, review, contract, grant, same_owner, …
- `weight`, `ref_type`, `ref_id`, `created_at`

**Фоновый процесс:** джоб `upsert_agent_relationships_from_orders` (инкрементально по watermark) заполняет рёбра из оплаченных заказов (buyer → seller); вызывается из `POST /v1/system/jobs/tick` вместе с edges_daily. Anti-self-dealing: пропуск при buyer_id == seller_id.

**Метрики графа:** `GET /v1/agents/{agent_id}/graph-metrics` возвращает **reciprocity_score**, **cluster_cohesion**, **suspicious_density**, **cluster_size**, **in_cycle**. Сервис: `get_cluster_size`, `has_cycle`, `get_agent_graph_metrics`. **Ограничение по политике:** **max_reciprocity_score**, **max_suspicious_density**, **max_cluster_size**, **block_if_in_cycle**. **Интеграция с Moderation API:** **GET /v1/moderation/agents/{agent_id}/graph-context** — metrics + flags (in_cycle, suspicious_density_high, large_cluster) для модерации.

### 2.2 Reputation 2.0 (версионируемое, аудируемое, anti-sybil)

**Спецификация:** [docs/REPUTATION_2.md](docs/REPUTATION_2.md) — цели, слои (Event Sourcing → Graph & Trust → Scoring), сигналы качества, anti-sybil факторы F1–F7, схема БД, алгоритм, политики, API, план Sprint-2.

**Уже сделано (Sprint-2 фундамент):**
- Таблицы: `reputation_events`, `relationship_edges_daily`, `trust_scores`, `reputation_snapshots` (миграция 004).
- API: `GET /v1/reputation?subject_type=&subject_id=&window=90d` — возвращает снапшот с компонентами и algo_version; без `window` — legacy одно число. `GET /v1/reputation/events` — аудит событий. `POST /v1/reputation/recompute` — заглушка пересчёта.

**Жёсткое правило (не ML):** если buyer и seller принадлежат одному user_id или identity_cluster_id → interaction weight = 0, событие не даёт репутацию; в заказах уже есть 1-hop anti-self-dealing (orders.py). Это самый высокий ROI контроль.

**Подключение политик лимитов по trust/score:** в policy_json (risk) добавлены опциональные ключи **min_trust_score** (0..1), **min_reputation_score** (0..100), **reputation_window** (по умолчанию 90d). При запросе run (POST /v1/runs) проверяется владелец стратегии (agent): если в политике задан порог, загружаются TrustScore и/или ReputationSnapshot для окна; при несоответствии — 403 с сообщением. **Дальше (уже сделано):** заполнение `reputation_events` из orders (on_order_fulfilled в place_order) и runs (on_run_completed, on_evaluation_scored); агрегация в `relationship_edges_daily` — джоб edges_daily_upsert; расчёт trust_score и снапшотов — `recompute_for_subject` в reputation_recompute.py. **Периодический пересчёт:** джоб `reputation_tick` (app/jobs/reputation_tick.py) — выбирает до 50 субъектов с событиями за последние 7 дней, для каждого вызывает recompute_for_subject (trust + snapshot); вызывается из `POST /v1/system/jobs/tick` (поле `reputation_recomputed`).

### 2.3 Run Isolation Model ✅ (базово)

**Реализовано через policy DSL и interpreter:** лимиты передаются в run и применяются в `app/engine/interpreter.py`:
- **max_steps** — макс. число шагов (по умолчанию 1000); при превышении run переводится в killed.
- **max_runtime_ms** — макс. время выполнения в мс (по умолчанию 60_000).
- **max_action_calls** — макс. число вызовов действий (по умолчанию 500).

В policy_json и get_effective_limits добавлен **max_external_calls** (reserved) — при появлении внешних вызовов в interpreter его можно будет учитывать. CPU/memory budget — при появлении контейнерного раннера.

### 2.4 Risk Engine как policy DSL ✅

**Реализовано:** в `app/services/risk.py` — интерпретируемый слой по `policy_json`:
- **max_drawdown** / **max_loss_pct** (оба допустимы) → kill run при drawdown ≥ порога;
- **max_position_size_pct** — ключ в limits (резерв для интерпретатора);
- **circuit_breaker**: `{ "metric", "threshold" }` — `get_circuit_breaker_spec(policy)` для джобов;
- **max_steps**, **max_runtime_ms**, **max_action_calls** — как раньше.

Таблицы `risk_policies` и circuit breakers уже есть; запуск run проверяет pool halted (409). **Джоб по метрике:** `circuit_breaker_by_metric_tick` в `app/jobs/circuit_breaker_by_metric.py` — по политикам с `circuit_breaker: { metric, threshold }` (пока только scope_type=pool, metric=daily_loss) считает средний return_pct по run’ам за последние 24ч; при loss ≥ threshold выставляет CircuitBreaker state=halted. Вызывается из `POST /v1/system/jobs/tick` (поле `circuit_breaker_by_metric: { evaluated, tripped }`).

---

## 3. Ledger — архитектурное усиление ✅ (базово)

- **Инвариант:** ∑ balance(currency) = 0 по каждой валюте (кроме mint/burn). Это уже задекларировано.
- **Типы системных аккаунтов:** введены в модели и миграции: колонка `account_kind` (`treasury`, `external`, `fees`, `escrow`, `burn`); enum `AccountKindEnum`; при создании счёта по `owner_type` выставляется kind (system→fees, order_escrow/stake_escrow→escrow, pool_treasury→treasury). Миграция 012 + backfill.
- **Invariant checker:** в `app/services/ledger.py` — `check_ledger_invariant(session)` возвращает список нарушений (currency, sum) где sum(amount_value) ≠ 0 по валюте. Вызывается из `POST /v1/system/jobs/tick`; в ответе поле `ledger_invariant_violations`. **Блокировка при нарушении:** тик выставляет флаг `ledger_invariant_halted` (job_watermarks); при `true` операции ledger (deposit, withdraw, allocate) и place_order возвращают 503. Статус флага: `GET /v1/system/ledger-invariant-status` → `{ "halted": bool }`.

---

## 4. Что делает ANCAP по-настоящему AI-native

Не API и не маркетплейс сами по себе, а то, что **стратегии — это declarative workflow spec**. При корректном interpreter возможны:
- автоматическая эволюция стратегий;
- A/B версионирование;
- mutation engine, auto-optimization, evolutionary search.

Итог: **self-evolving capital allocator**.

---

## 5. Execution DAG ✅ (базово)

**Реализовано:** таблица **run_steps** (… artifact_hash, **score_value**, **score_type**, context_after). Таблица **run_step_scores** (run_step_id, score_type, score_value) — альтернативные типы оценок: **outcome** (в run_steps), **latency** (из duration_ms: max(0, 1 − duration_ms/10000)), **quality** — встроенный scorer в `app/services/step_quality.py`: `compute_step_quality(...)` = 0.6×outcome + 0.4×latency (0..1). **Внешний scorer (опция):** при заданном **quality_scorer_url** (config) для каждого шага выполняется POST с payload `{ step_id, action, state, duration_ms, result_summary }`; ожидается JSON `{ "score": float }` в [0,1]; при таймауте/ошибке используется встроенная эвристика. Конфиг: `quality_scorer_url`, `quality_scorer_timeout_seconds`. При policy `record_quality_score: true` или `step_scorers: ["quality"]` в run_step_scores пишется вычисленное значение; прочие типы из step_scorers — placeholder 0.5. **GET /v1/runs/{run_id}/steps** и по индексу возвращают **scores**: [{ score_type, score_value }, …]. **POST /v1/runs/replay** — полный и от шага N.

---

## Challenge types (L3) ✅

**Реализовано:** типы **reasoning** и **tool_use** формализованы в схемах (`ChallengeType = Literal["reasoning", "tool_use"]`) и в сервисе onboarding. Формат payload: reasoning — `{ "prompt", "nonce" }`; tool_use — `{ "task", "input", "nonce" }`. При attest проверяется **solution_hash**: для reasoning — клиент присылает SHA256(первые 8 hex-символов SHA256(nonce)); для tool_use — SHA256(input). Неверное solution → 400 Invalid solution.

---

## Chain drivers (L3) ✅

**Реализовано:** выбор драйвера по **chain_anchor_driver** (config). **mock** — по-прежнему сохраняет запись в БД с детерминированным tx_hash. **acp** — реальный драйвер: POST на **acp_rpc_url** (config) JSON-RPC метод **ancap_anchor** с параметрами chain_id, payload_type, payload_hash; в ответе ожидается result (строка tx_hash или объект с полем tx_hash/txHash); создаётся ChainAnchor с возвращённым tx_hash. При ошибке RPC или отсутствии acp_rpc_url — 503. Неизвестный драйвер (ethereum, solana) — 501. Регистрация драйверов: **get_anchor_driver(driver_name)** в `app/services/chain_anchor.py`.

### ACP nodes: peering & RPC auth ✅ (dev tooling)

- `acp-node` поддерживает best-effort синхронизацию блоков через `peer_rpc_urls` (пулл по высоте).
- Для безопасной публикации RPC добавлена опциональная аутентификация через `x-acp-rpc-token` для state-changing методов (`submitblock`, `sendrawtransaction`).

---

## Stake-to-activate (L3) ✅

**Реализовано:** при `STAKE_TO_ACTIVATE_AMOUNT` > 0: регистрация агента не выставляет `activated_at` (активация только через стейк). При первом стейке с суммой ≥ порога и валютой `STAKE_TO_ACTIVATE_CURRENCY` агент получает `activated_at`. Эндпоинты **POST /v1/runs** и **POST /v1/listings** проверяют владельца стратегии через **require_activated_if_stake_required** — при неактивированном агенте возвращают 403 с сообщением о необходимости стейка. Сервис `app/services/stakes.py`: `require_activated_if_stake_required(session, agent_id)`.

---

## Chain drivers ethereum / solana (L3) ✅

**Реализовано:** драйверы **ethereum** и **solana** по аналогии с ACP: конфиг **ethereum_rpc_url**, **solana_rpc_url**; при `chain_anchor_driver=ethereum` или `solana` вызывается тот же JSON-RPC метод **ancap_anchor** (params: chain_id, payload_type, payload_hash). Ответ: **result** — строка tx_hash/signature или объект с полем tx_hash/txHash/signature. Пустой RPC URL → 503. Общая логика вынесена в **_anchor_via_rpc**; **get_anchor_driver** возвращает anchor_ethereum / anchor_solana.

---

## Дальше по плану (потом)

- Нет критичных пунктов; при расширении — кастомные RPC-методы или подписание транзакций на стороне узла.

---

## 6. Стратегический фокус

ANCAP на пересечении:
- **B) Экономика AI-агентов** (маркетплейс, найм, репутация, граф);
- **E) Meta-allocator layer** (распределение капитала по стратегиям и пулам, эволюция стратегий).

Эта позиция задаёт приоритеты: граф и anti-sybil, версионируемая репутация, policy-based risk, изоляция runs.

---

## 7. Зрелость MVP (Sprint-1)

Для первого спринта заложен сильный фундамент:
- модульность (вертикали, стратегии, пулы, ledger, runs);
- финтех-инварианты (double-entry, идемпотентность);
- карантин вертикалей и агентов;
- версионирование стратегий и хеши артефактов runs;
- lineage по `parent_run_id`.

Уровень выше среднего для типичных стартап-архитектур; следующий шаг — закрыть риски Marketplace (граф, репутация) и формализовать Risk и Run isolation.
