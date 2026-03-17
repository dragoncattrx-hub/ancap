# LOG.md — журнал изменений ANCAP

Все изменения для памяти и воспроизводимости.

---

## 2025-02-23 — Chain drivers ethereum / solana (L3, ROADMAP «Дальше по плану»)

### Цель
Добавить драйверы **ethereum** и **solana** для on-chain anchoring по аналогии с ACP: конфиг RPC URL и вызов JSON-RPC метода ancap_anchor.

### Изменения
- **app/config.py:** ethereum_rpc_url, solana_rpc_url.
- **app/services/chain_anchor.py:** **_anchor_via_rpc**; **anchor_ethereum**, **anchor_solana**; **get_anchor_driver** возвращает их для "ethereum" и "solana".
- **app/api/routers/chain.py:** сообщение 501 — «mock, acp, ethereum, or solana».

### Тесты
- **tests/test_l3.py:** test_chain_anchor_driver_unknown_501 на driver "unknown_chain"; test_chain_anchor_ethereum_no_rpc_url_503, test_chain_anchor_ethereum_success_mocked, test_chain_anchor_solana_success_mocked.

### Результат
- 7 passed (chain_anchor tests).

---

## 2025-02-23 — Chain drivers (L3): ACP + registry

### Цель
Реализовать реальные chain-драйверы: кроме mock — драйвер **acp** и регистрация по конфигу; неизвестные драйверы — 501.

### Изменения
- **app/services/chain_anchor.py:** **anchor_acp** — POST на acp_rpc_url, JSON-RPC method ancap_anchor; **get_anchor_driver(driver_name)** — mock / acp / None. Ошибки ACP → ValueError → 503.
- **app/api/routers/chain.py:** выбор драйвера через get_anchor_driver; 501 при неизвестном, 503 при ValueError.

### Тесты
- **tests/test_l3.py:** test_chain_anchor_driver_unknown_501, test_chain_anchor_acp_no_rpc_url_503, test_chain_anchor_acp_success_mocked.

### Документация
- **ROADMAP.md:** блок «Chain drivers (L3) ✅»; «Дальше» — ethereum/solana по аналогии. **docs/PLAN_L0_TO_L3.md:** §14 обновлён (mock + acp).

### Результат
- 4 passed (chain_anchor tests).

---

## 2025-02-23 — External quality scorer (ROADMAP §5)

### Цель
Добавить опцию внешнего HTTP scorer для step-level quality: при заданном URL платформа отправляет payload шага на внешний сервис и использует возвращённый score; при ошибке/таймауте — fallback на встроенную эвристику.

### Изменения
- **app/config.py:** добавлены **quality_scorer_url** (пустая по умолчанию) и **quality_scorer_timeout_seconds** (5).
- **app/services/step_quality.py:** добавлена **get_step_quality(..., scorer_url, timeout_seconds)** (async): при непустом scorer_url — POST JSON `{ step_id, action, state, duration_ms, result_summary }` на URL, ожидается ответ 200 и JSON `{ "score": float }` в [0,1]; при любом сбое возвращается **compute_step_quality(...)**. Зависимость **httpx** вынесена в импорт на уровне модуля.
- **app/api/routers/runs.py:** при записи run_step_scores для типа "quality" вызывается **await get_step_quality(..., settings.quality_scorer_url, settings.quality_scorer_timeout_seconds)** вместо compute_step_quality.
- **requirements.txt:** httpx перенесён в основные зависимости (нужен для исходящих HTTP в рантайме).

### Тесты
- **tests/test_step_quality.py:** test_get_step_quality_empty_url_uses_builtin; test_get_step_quality_http_returns_score (mock httpx → 200 + {"score": 0.88}); test_get_step_quality_http_fallback_on_error (mock исключение → встроенный результат).

### Документация
- **ROADMAP.md:** в §5 Execution DAG дополнено описание внешнего scorer и конфига; из «Дальше» убран пункт про кастомный quality scorer.

### Результат
- 8 passed (test_step_quality + test_run_steps_quality_score_when_policy_has_record_quality_score).

---

## 2025-02-23 — Challenge types (L3, PLAN §12): reasoning / tool_use

### Цель
Формализовать типы challenge и проверку solution при attest: reasoning и tool_use с верификацией solution_hash.

### Изменения
- **app/schemas/onboarding.py:** тип **ChallengeType = Literal["reasoning", "tool_use"]**; в ChallengeCreateRequest используется как challenge_type по умолчанию "reasoning". В комментарии описаны форматы payload и правила solution_hash.
- **app/services/onboarding.py:** добавлена **_expected_solution_hash(challenge_type, nonce)**; в **submit_attestation** для типов reasoning и tool_use проверяется solution_hash, при несовпадении — ValueError("Invalid solution") → 400.

### Тесты
- **tests/test_l3.py:** test_onboarding_challenge_and_attest с корректным solution_hash для reasoning; добавлены test_onboarding_challenge_tool_use и test_onboarding_attest_invalid_solution_rejected.

### Документация
- **ROADMAP.md:** блок «Challenge types (L3) ✅»; из «Дальше» убран пункт про challenge types.
- **docs/PLAN_L0_TO_L3.md:** §12 обновлён — challenge types реализованы и верифицируются.

### Результат
- 6 passed (test_l3).

---

## 2025-02-23 — Stake-to-activate (L3, PLAN §12)

### Цель
Реализовать обязательный стейк для активации агента при регистрации: при включённом `STAKE_TO_ACTIVATE_AMOUNT` агент считается активированным только после стейка не ниже порога; runs и listings проверяют активацию владельца стратегии.

### Изменения
- **app/config.py:** уже были `stake_to_activate_amount`, `stake_to_activate_currency` (по умолчанию "0", "VUSD").
- **app/api/routers/agents.py:** при `stake_to_activate_amount` > 0 при регистрации всегда выставляется `activated_at = None` (активация только через стейк; attestation не активирует).
- **app/services/stakes.py:** при стейке: если порог задан, `activated_at` выставляется только когда сумма стейка ≥ порога и валюта совпадает с `stake_to_activate_currency`; при пороге 0 — любой стейк активирует. Добавлена функция **require_activated_if_stake_required(session, agent_id)** — при включённом пороге и отсутствии `activated_at` у агента выбрасывает HTTP 403 с сообщением о необходимости стейка. Импорт `get_settings`.
- **app/api/routers/runs.py:** перед выполнением run (и в replay) вызывается `require_activated_if_stake_required(session, strat.owner_agent_id)` при наличии владельца стратегии.
- **app/api/routers/listings.py:** при создании листинга вызывается `require_activated_if_stake_required(session, strat.owner_agent_id)`.

### Тесты
- **tests/test_stake_to_activate.py:** test_register_agent_when_stake_required_has_activated_at_none; test_run_forbidden_when_stake_required_and_agent_not_activated; test_listing_forbidden_when_stake_required_and_agent_not_activated; test_stake_activates_agent_then_run_allowed (полный сценарий: регистрация → депозит → стейк 100 VUSD → run разрешён). Используется monkeypatch STAKE_TO_ACTIVATE_AMOUNT=100 и сброс кэша get_settings.

### Документация
- **ROADMAP.md:** добавлен блок «Stake-to-activate (L3) ✅»; из «Дальше» убран пункт stake-to-activate.
- **docs/PLAN_L0_TO_L3.md:** в §12 обновлено «ANCAP сейчас»: stake-to-activate при регистрации реализован; в «Разрыв» оставлены только challenge types.

### Результат
- 4 passed (test_stake_to_activate).

---

## 2025-02-23 — Quality scorer (ROADMAP §5): встроенная эвристика

### Цель
Подставить реальный расчёт quality вместо placeholder 0.5 при policy `record_quality_score` / `step_scorers: ["quality"]`.

### Изменения
- **app/services/step_quality.py:** функция **compute_step_quality(step_id, action, state, duration_ms, result_summary)** → float 0..1. Формула: 0.6×outcome (1.0/0.5/0.0 для succeeded/skipped/failed) + 0.4×latency (max(0, 1 − duration_ms/10000)). Успешный быстрый шаг → 1.0, провал → ближе к 0.
- **app/api/routers/runs.py:** при сохранении run_step_scores для типа **quality** вызывается compute_step_quality; для остальных типов из step_scorers по-прежнему 0.5. В step_objs передаётся (rs, duration_ms, state, step_id, action, result_summary) для вызова scorer’а.
- **ROADMAP §5:** в блоке «Реализовано» описан встроенный quality scorer; в «Дальше» — опция внешнего/кастомного scorer’а.

### Тесты
- **tests/test_step_quality.py:** test_compute_step_quality_succeeded_fast/slow, test_compute_step_quality_failed, test_compute_step_quality_skipped.
- **tests/test_runs.py:** test_run_steps_quality_score_when_policy_has_record_quality_score — policy с record_quality_score: true, run, GET steps → в scores есть quality, значение в [0, 1].

### Результат
- 20 passed (test_step_quality + test_runs).

---

## 2025-02-23 — run_mode (backtest), quality placeholder, синхронизация плана

### 1) Явный режим backtest (PLAN §5)
- **RunRequest.run_mode:** опционально `"mock" | "backtest"` (по умолчанию `"mock"`). **runs.run_mode** (миграция 018). При `run_mode == "backtest"` исполнение идёт с `effective_dry_run = True`. В ответах run возвращается **run_mode**.

### 2) Задел под quality scorer (ROADMAP §5)
- В **policy_json** добавлены опции **record_quality_score: true** и **step_scorers: ["quality", …]**. **get_step_scorers(policy)** в `app/services/risk.py` возвращает список типов оценок. При сохранении шагов для каждого элемента из `step_scorers` создаётся запись в **run_step_scores** с `score_value=0.5` (placeholder). Реальный scorer можно подставить позже.

### 3) Синхронизация плана
- **ROADMAP «Дальше по плану»:** добавлены пункты про подстановку реального quality scorer и L3 из PLAN (реальные chain-драйверы, доработка challenge types, stake-to-activate).
- **README:** в блок Sprint-2 добавлены run_mode, step_scorers (quality), ссылки на ROADMAP и PLAN_L0_TO_L3.

### Тесты
- **test_get_step_scorers** в test_risk_service.py (record_quality_score, step_scorers).

### Результат
- 15/15 test_runs, тесты risk_service с get_step_scorers. Миграция 018 применена.

---

## 2025-02-23 — PLAN L1 + env_hash (runs.env_hash), миграция 017

### Цель
Актуализировать PLAN_L0_TO_L3 (GET artifacts готов); добавить env_hash в Run по плану L1 (content-addressed environment).

### Изменения
- **docs/PLAN_L0_TO_L3.md:** раздел 4) Runs + Audit Ledger — в «ANCAP сейчас» указаны GET /v1/runs/{id}/artifacts и env_hash в модели runs; в «Разрыв» убрано GET artifacts, оставлено только S3 при необходимости.
- **runs.env_hash** (миграция 017): колонка env_hash (Text, nullable) в таблице runs. Вычисляется при сохранении run как SHA256 от JSON `{ "pool_id", "limits" }`. Модель Run, схема RunPublic и ответ GET /v1/runs/{id}/artifacts возвращают env_hash.
- **Тесты:** test_get_run_artifacts проверяет наличие и непустоту env_hash; test_get_run_by_id проверяет наличие env_hash в ответе.

### Результат
- 15/15 test_runs passed. Миграция 017 применена.

---

## 2025-02-23 — README + GET /v1/runs/{id}/artifacts (L1 audit)

### Цель
Актуализировать README под текущее состояние; добавить эндпоинт артефактов по плану L1 (PLAN_L0_TO_L3).

### Изменения
- **README:** таблица эндпоинтов — Runs дополнены `GET /v1/runs/{id}/artifacts`, `GET .../steps`, `GET .../steps/{step_index}`, `POST .../replay`. Блок Execution (Runs) — упоминание Execution DAG (run_steps, replay, scores). Sprint-2 — перечислены cluster_cohesion, suspicious_density, cluster_size, in_cycle и граф-гейты; Execution DAG отмечен как сделанный (run_steps, replay от шага N, scores outcome+latency).
- **GET /v1/runs/{run_id}/artifacts:** возвращает `run_id`, `inputs_hash`, `workflow_hash`, `outputs_hash`, `proof` (MVP null). 404 если run не найден.
- **Тест:** test_get_run_artifacts (200, структура и 404).

### Результат
- 15/15 test_runs passed.

---

## 2025-02-23 — Альтернативные score_type: latency, run_step_scores (ROADMAP §5)

### Цель
Поддержать альтернативные типы оценок шагов (latency, в перспективе quality) при появлении scorer’ов.

### Изменения
- **run_step_scores** (миграция 016): таблица (id, run_step_id, score_type, score_value, created_at), уникальность (run_step_id, score_type). Модель **RunStepScore** в app/db/models.py.
- При сохранении шагов после flush создаётся запись **RunStepScore** с score_type="latency", score_value = max(0, 1 − duration_ms/10000) (0–1, быстрые шаги ближе к 1).
- **GET /v1/runs/{run_id}/steps** и **GET /v1/runs/{run_id}/steps/{step_index}**: в ответ добавлено поле **scores** — массив { score_type, score_value } (outcome из RunStep + записи из run_step_scores для данного шага).

### Тесты
- test_get_run_steps: проверка наличия "scores", что в score_types есть "outcome" и "latency".

### Результат
- 14/14 test_runs passed. Миграция 016 применена.

---

## 2025-02-23 — Replay от шага N (ROADMAP §5): context_after, start_step_index, initial_context

### Цель
Реализовать replay от шага N (from_step_index>0): сохранение контекста после каждого шага и повторный запуск workflow с этого шага.

### Изменения
- **run_steps.context_after** (JSONB, nullable): миграция 015; сохраняется контекст после каждого успешного шага для последующего replay.
- **Interpreter** (app/engine/interpreter.py): добавлены параметры **start_step_index** (int), **initial_context** (dict | None), **context_after_step_callback** (callable). При initial_context контекст инициализируется из него; цикл пропускает шаги с индексом < start_step_index; после каждого успешного шага вызывается callback(step_index, copy(context)).
- **Runs router**: вынесен хелпер **_run_workflow_and_persist** (run_workflow + сохранение steps/logs/metrics, evaluation, fee, reputation); принимает start_step_index и initial_context. При сохранении RunStep заполняется context_after из собранного по callback словаря (по индексу шага workflow).
- **POST /v1/runs/replay**: при **from_step_index=0** или отсутствии — полный replay через request_run; при **from_step_index>0** — загрузка родительского run, поиск RunStep с step_index=from_step_index-1 и context_after; при отсутствии — 400 "No stored context for replay from this step"; иначе создаётся новый run и вызывается _run_workflow_and_persist с start_step_index и initial_context=context_after. Новый run содержит только шаги с индекса from_step_index до конца (step_index в новом run: 0, 1, …).

### Тесты
- test_replay_from_step_index_success: создаётся run с 2 шагами, replay с from_step_index=1 → 201, у нового run 1 step.
- test_replay_from_step_index_no_stored_context: replay с from_step_index=10 для run с 2 шагами → 400, "No stored context".

### Результат
- 14/14 test_runs passed. Миграция 015 применена.

---

## 2025-02-23 — Step-level score outcome + partial replay (ROADMAP §5)

### Цель
Заполнять score_value/score_type при сохранении шагов; добавить replay from step 0 (новый run с теми же входами, что и указанный run).

### Step-level score
- При создании RunStep в runs router выставляются **score_value** (1.0 для succeeded, 0.0 для failed, 0.5 для skipped) и **score_type** = "outcome". Поля уже были в модели и миграции 014.
- Тест test_get_run_steps проверяет score_type == "outcome" и score_value in (0.0, 0.5, 1.0).

### Partial replay (replay from step 0)
- **RunReplayRequest** (app/schemas/runs.py): run_id.
- **POST /v1/runs/replay**: загружает Run по run_id (404 если не найден), строит RunRequest с strategy_version_id, pool_id, params, limits, dry_run из родителя и parent_run_id=run_id, вызывает request_run. Новый run — полное переисполнение с теми же входами.
- Тесты: test_replay_run (201, parent_run_id совпадает, id другой), test_replay_run_not_found (404).

### Результат
- 106 passed (в полном прогоне).

---

## 2025-02-23 — Moderation graph-context + Execution DAG step-level score fields

### Цель
Дальше по плану: интеграция графа с Moderation API (эндпоинт graph-context); задел для step-level scoring (поля в run_steps).

### Moderation API (ROADMAP 2.1)
- **GET /v1/moderation/agents/{agent_id}/graph-context**: возвращает **metrics** (get_agent_graph_metrics: reciprocity_score, cluster_cohesion, suspicious_density, cluster_size, in_cycle) и **flags** для модерации: in_cycle, suspicious_density_high (suspicious_density >= 0.5), large_cluster (cluster_size > 10). 404 если агент не найден.
- Тесты: test_moderation_agent_graph_context (200, структура metrics и flags), test_moderation_agent_graph_context_not_found (404).

### Execution DAG (ROADMAP §5)
- В модель **RunStep** добавлены **score_value** (Numeric(10,4), nullable) и **score_type** (String(32), nullable). Миграция 014.
- **GET /v1/runs/{run_id}/steps** и **GET /v1/runs/{run_id}/steps/{step_index}** в ответ включают score_value, score_type (null пока scorer не реализован).
- Тест test_get_run_steps проверяет наличие score_value и score_type в элементах steps.

### Результат
- 104 passed. alembic upgrade head (014) применён.

---

## 2025-02-23 — Policy gates max_cluster_size, block_if_in_cycle (ROADMAP 2.1)

### Цель
Добавить в policy DSL ограничения по графу: max_cluster_size (block если cluster_size владельца > cap), block_if_in_cycle (block если владелец в ориентированном цикле).

### Изменения
- **app/services/risk.py**: в схему policy и get_graph_gate добавлены **max_cluster_size** (int ≥ 1) и **block_if_in_cycle** (bool). При block_if_in_cycle: True блокирует run, False не добавляется в gate.
- **app/api/routers/runs.py**: после проверок reciprocity и suspicious_density добавлены: при max_cluster_size — 403 если metrics["cluster_size"] > cap; при block_if_in_cycle — 403 если metrics["in_cycle"] истина.

### Тесты
- **test_risk_service.py**: test_get_graph_gate проверяет max_cluster_size (5, 1; 0 отбрасывается), block_if_in_cycle (True сохраняется, False не в gate), комбинацию ключей.
- **test_runs.py**: test_run_allowed_with_graph_gate_max_cluster_size_and_block_if_in_cycle — пул с policy { max_cluster_size: 10, block_if_in_cycle: true }, владелец без рёбер (cluster_size=1, in_cycle=false) → run 201.

### Результат
- Все тесты проходят.

---

## 2025-02-23 — ROADMAP 2.1 кластеризация/циклы + §5 artifact_hash, GET step by index

### Цель
Дальше по плану: кластеризация графа (cluster_size), поиск циклов (in_cycle); заполнение artifact_hash на шаге и API шага по индексу.

### 2.1 Agent Graph
- **get_cluster_size(session, agent_id)**: BFS по неориентированным order-рёбрам — размер связной компоненты, содержащей агента. _load_order_edges загружает все рёбра, строится неориентированный граф, BFS от agent_id.
- **has_cycle(session, agent_id)**: DFS в ориентированном графе (source→target); true, если есть путь из agent_id обратно в agent_id (длина ≥ 1).
- **get_agent_graph_metrics**: в ответ добавлены **cluster_size** (int), **in_cycle** (bool). API GET /v1/agents/{id}/graph-metrics возвращает их без изменений.

### §5 Execution DAG
- При сохранении RunStep вычисляется **artifact_hash** = SHA256(JSON step_id, action, result_summary) для content-addressing шага.
- **GET /v1/runs/{run_id}/steps/{step_index}** — один шаг по индексу (explainability, пошаговая инспекция). 404 при отсутствии run или шага; 400 при step_index < 0.

### Тесты
- test_agents: проверка cluster_size (int ≥ 1), in_cycle (bool).
- test_runs: test_get_run_steps — наличие artifact_hash в элементах steps; test_get_run_step_by_index — GET steps/0, структура и artifact_hash, GET steps/999 → 404.

### Результат
- 101 passed.

---

## 2025-02-23 — ROADMAP 2.1 + §5: cluster_cohesion, suspicious_density, Execution DAG

### Цель
Закрыть «Дальше по плану»: метрики графа cluster_cohesion и suspicious_density (2.1), модель Execution DAG — run_steps и API (§5).

### 2.1 Agent Graph
- **cluster_cohesion**: плотность 1-hop ego-графа (рёбра внутри ego / n*(n-1)); `get_cluster_cohesion(session, agent_id)` возвращает (cohesion, ego_size).
- **suspicious_density**: anti-sybil сигнал = cohesion × (1 / (1 + log2(n))); высокий при малом плотном кластере.
- **get_agent_graph_metrics**: в ответ добавлены cluster_cohesion и suspicious_density (0..1).
- **Policy gate**: в risk policy и get_graph_gate добавлен **max_suspicious_density** (0..1); при запросе run проверка владельца стратегии, при превышении — 403.

### §5 Execution DAG
- **Модель RunStep** (app/db/models.py): run_id, step_index, step_id, parent_step_index, action, state, duration_ms, result_summary, artifact_hash.
- **Миграция 013**: таблица run_steps, индексы по run_id и (run_id, step_index).
- **runs router**: после run_workflow сохранение RunStep для каждого step_log (parent_step_index = линейная цепочка).
- **GET /v1/runs/{run_id}/steps**: возвращает run_id и список шагов (step_index, step_id, parent_step_index, action, state, duration_ms, result_summary, artifact_hash).

### Тесты
- test_agents: проверка наличия cluster_cohesion и suspicious_density в graph-metrics, диапазон 0..1.
- test_runs: test_get_run_steps — создание run, GET steps, проверка структуры DAG.

### Результат
- 100 passed (с новыми тестами). alembic upgrade head применён (013).

---

## 2025-02-23 — Sprint-2 доработки (Ledger §3, Circuit breaker, Reputation, Gates, Agent graph, Run isolation)

### Цель
Закрыть пункты ROADMAP: Ledger (account_kind, invariant checker, блок при нарушении), circuit breaker по метрике, Reputation 2.0 + policy gates, метрики графа агентов, изоляция run (max_external_calls в policy). Обновить README и ROADMAP формулировками «сделано» / «дальше».

### Ledger (ROADMAP §3)
- **account_kind**: enum и колонка на Account; миграция 012 с backfill (system→fees, order_escrow/stake_escrow→escrow, pool_treasury→treasury). В `ledger.py` при создании счёта выставляется kind по owner_type.
- **Invariant checker**: `check_ledger_invariant(session)` → нарушения (currency, sum); вызывается из tick → флаг `ledger_invariant_halted` в job_watermarks. При halted: deposit, withdraw, allocate, place_order → 503. Эндпоинт `GET /v1/system/ledger-invariant-status` → `{ "halted": bool }`.
- **Тесты**: `test_ledger_deposit_blocked_when_invariant_halted`; в conftest autouse фикстура сброса флага перед каждым тестом.

### Circuit breaker по метрике (ROADMAP 2.4)
- **app/jobs/circuit_breaker_by_metric.py**: для политик с `circuit_breaker: { metric, threshold }` (scope_type=pool, metric=daily_loss) — средний return_pct по runs за 24h; при loss ≥ threshold → CircuitBreaker state=halted. Результат в tick: evaluated, tripped.

### Reputation 2.0 (ROADMAP 2.2)
- **app/jobs/reputation_tick.py**: выбор до N субъектов с reputation_events за 7 дней, пересчёт trust + snapshot для каждого. Вызов из tick → reputation_recomputed.

### Policy gates (Reputation + Graph)
- В политике: **min_trust_score**, **min_reputation_score** — в request_run загрузка TrustScore/ReputationSnapshot владельца стратегии; при нарушении порога → 403.
- **max_reciprocity_score** — в request_run загрузка `get_agent_graph_metrics`; при reciprocity_score ≥ cap → 403.

### Agent graph metrics (ROADMAP 2.1)
- **app/services/agent_graph_metrics.py**: reciprocity_score и get_agent_graph_metrics по таблице agent_relationships (order). `GET /v1/agents/{id}/graph-metrics` → `{ "reciprocity_score": float }`. Тесты в test_agents.py.

### Run isolation (ROADMAP 2.3)
- В risk policy и get_effective_limits добавлен **max_external_calls** (reserved). Изоляция: max_steps, max_runtime_ms, max_action_calls в интерпретаторе; max_external_calls — под будущее. Тест test_get_effective_limits_dsl проверяет default и из policy.

### Документация
- **README**: Ledger — «Реализовано» (account_kind, invariant, halt, ledger-invariant-status); Risk — policy DSL и gates; таблица эндпоинтов — graph-metrics, ledger-invariant-status; раздел «Главный риск» — что уже есть (agent_relationships, reciprocity, gates) и чего нет (cluster_cohesion, suspicious_density); Sprint-2 итог в быстром старте.
- **ROADMAP**: секция «Дальше по плану (потом)» — сейчас доработки; после: 2.1 (cluster_cohesion, suspicious_density, кластеризация, циклы), §5 Execution DAG.

### Результат
- Тесты: 99 passed (с учётом test_ledger_deposit_blocked_when_invariant_halted и др.). PostgreSQL + alembic upgrade head для полного прогона.

---

## 2025-02-23 — Все тесты должны проходить (42/42)

### Цель
- Убрать пропуски тестов (18 skipped) из-за смены event loop между тестами.
- Все 42 теста должны выполняться и проходить при доступной PostgreSQL.

### План
1. Использовать синхронный `TestClient` (Starlette) — приложение крутится в одном фоновом потоке с одним event loop.
2. Создавать таблицы один раз через синхронный движок (psycopg2) в session-scoped фикстуре.
3. Переписать все тесты с async/await на синхронные вызовы `client.post(...)` и т.д.
4. Вести этот LOG.md.

### Изменения

- **conftest.py**: переход на sync `TestClient` (Starlette), session-scoped фикстура `client`. Таблицы создаются один раз через синхронный движок (`create_engine` по `postgresql://` без asyncpg). `override_get_db` оставлен async — выполняется в одном потоке/loop TestClient.
- **tests/test_*.py**: удалены `@pytest.mark.asyncio`, все тесты переписаны с `async def` на `def`, вызовы `await client.*` заменены на `client.*`. Импорты `AsyncClient` убраны. `test_unit.py` не менялся (уже синхронные тесты без БД).
- **test_auth.py**: в `test_login_wrong_password` пароль для неверного ввода заменён с `"wrong"` на `"wrongpass"` (требование схемы: min_length=8), чтобы ответ был 400 от эндпоинта, а не 422 от валидации.
- **app/api/routers/runs.py**: после установки `run.state = RunStateEnum.succeeded` и `run.ended_at` добавлен `await session.flush()`, чтобы перед `refresh(run)` в БД была записана финальная фаза run и тест получал `state == "succeeded"`.

### Результат
- **42 passed, 0 skipped, 0 failed** при запуске:  
  `PYTHONPATH=<корень> DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ancap python -m pytest tests -v`  
  (PostgreSQL должен быть запущен, БД `ancap` создана.)

---

## 2025-02-23 — Финтех-практики: только Alembic, README-спека

### Цель
- Убрать автосоздание таблиц приложением; только Alembic управляет схемой.
- Закрепить в README: idempotency, double-entry ledger, cursor pagination, access scope/expiry, runs audit hashes, vertical quarantine, workflow validation, юридический disclaimer.

### Изменения в коде

- **app/main.py**: удалены импорт и вызов `init_db()` из lifespan. При старте приложение больше не создаёт таблицы.
- **app/db/session.py**: функция `init_db()` удалена.
- **app/db/__init__.py**: экспорт `init_db` убран.

### Изменения в README

- Удалён абзац «При первом запуске таблицы создаются через init_db()…». Добавлено: для всех окружений схема — только через `alembic upgrade head`.
- Добавлен **Disclaimer**: «Platform provides software infrastructure for strategy execution and performance tracking. No guaranteed returns.»
- **Миграции**: отдельный раздел — управление схемой только Alembic, приложение не создаёт таблицы.
- **Idempotency**: раздел про заголовок Idempotency-Key и exactly-once для `/v1/orders`, `/v1/ledger/*`, `/v1/runs`.
- **Пагинация (cursor)**: сортировка created_at desc, id desc; next_cursor — opaque token.
- **Ledger**: double-entry; src_account_id/dst_account_id для transfer; deposit/withdraw — системный аккаунт (external/treasury); баланс только из событий.
- **Access grants**: scope (view|execute|allocate), expires_at; покупка ≠ доступ навсегда по умолчанию.
- **Runs**: артефакты с хешами для аудита (inputs_hash, workflow_hash, outputs_hash; proof на MVP может быть null).
- **Verticals / карантин**: proposed — только dry_run или experimental пулы до active.
- **Workflow validation**: базовая схема WorkflowSpec + vertical_specs.workflow_schema (если задана).
- В быстром старте Docker добавлена рекомендация выполнить `alembic upgrade head` перед запуском API. В разделе «Тесты» для полного прогона указано предварительно применить миграции.

---

## 2025-02-23 — Найм агентов (Agent-as-a-Service) в документации

### Цель
Отразить в README, как «найм» агента агентом выглядит в платформе: три варианта (покупка сервиса / контракт / команда), разрешённые и запрещённые типы работ, роли, риски и митигации.

### Изменения в README

- Добавлен раздел **«Найм агентов (Agent-as-a-Service)»**:
  - **Вариант 1 (MVP):** найм как покупка сервиса — Listing → Order → AccessGrant → Run → Ledger.
  - **Вариант 2:** контракт на работу (Contract, employer/worker, SLA, оплата) — дорожная карта.
  - **Вариант 3:** команда/DAO — организации, роли, доли — дальше.
  - **Разрешённые типы работ:** генерация workflow, бэктест, скоринг, аудит, vertical spec, risk-policy, данные в рамках spec.
  - **Запрещённые:** произвольный код, прямой доступ к платёжкам, действия «выведи деньги» без шлюзов.
  - **Роли:** Builder, Auditor, Optimizer, Vertical architect, Allocator, Data agents.
  - **Риски и митигации:** anti-sybil (граф связей), запрет self-dealing, quarantine новых агентов, лимиты по обороту/частоте до доверия; опора на Reputation и Moderation API.

---

## 2025-02-23 — Sprint-2: Core Engine “real core”

### Цель
Сделать Core «реальным»: стратегия исполняется интерпретатором workflow в рамках BaseVertical, риск-контроль, оценка, анти-накрутка.

### Миграции (Alembic 002)
- **runs**: добавлены поля `inputs_hash`, `workflow_hash`, `outputs_hash`, `proof_json`.
- **evaluations**: уникальный индекс по `strategy_version_id`.
- **agent_links**: новая таблица (agent_id, linked_agent_id, link_type, confidence).
- **Seed**: вертикаль BaseVertical (status=active) и её spec с 10 allowed_actions и метриками.

### Модели и БД
- **app/db/base.py**: вынесен `Base` (DeclarativeBase), чтобы Alembic не загружал async engine при `DATABASE_URL=postgresql://`.
- **app/db/models.py**: Run — новые поля; добавлена модель AgentLink; импорт Base из app.db.base.
- **app/db/session.py**: импорт Base из app.db.base; удалён дубликат Base.
- **app/db/__init__.py**: убраны импорты из session (для Alembic).

### Workflow Interpreter v0 (app/engine/)
- **interpreter.py**: `validate_workflow()` (WorkflowSpec + whitelist), `run_workflow()` — последовательное выполнение steps, context, save_as/ref, лимиты max_steps/max_runtime_ms/max_action_calls, логи шагов, RunResult (state, metrics, inputs_hash, workflow_hash, outputs_hash).
- **actions/base_vertical.py**: 10 действий — const, math_add/sub/mul/div, cmp, if, rand_uniform (с seed), portfolio_buy, portfolio_sell; портфель и equity curve в контексте run.
- **schemas/strategies.py**: WorkflowStep.save_as (optional).

### Risk v0 (app/services/risk.py)
- `merge_policy()`, `make_risk_callback()` — убийство run при превышении max_loss_pct по equity curve.
- `get_effective_limits()` — слияние policy и run limits.
- Роутер runs: разрешение политик (global, pool, vertical, strategy), проверка CircuitBreaker (pool halted → 409).

### Evaluation v0 (app/services/evaluation.py)
- `compute_score()` — формула по avg_return_pct, avg_drawdown_pct, killed_rate, sample_size.
- `update_evaluation_for_version()` — агрегация succeeded runs, запись/обновление Evaluation, percentile_in_vertical в рамках вертикали.

### Runs API (app/api/routers/runs.py)
- POST /v1/runs: загрузка StrategyVersion + Vertical + spec, allowed_actions из vertical_spec, вызов `run_workflow()` с risk_callback и limits, сохранение run (state, hashes), RunLog по шагам, MetricRecord по метрикам; при succeeded — обновление evaluation.

### Anti-self-dealing (app/api/routers/orders.py)
- При place_order: если buyer_type=agent и buyer_id == strategy.owner_agent_id → 403.
- Проверка agent_links: если buyer связан с owner (confidence ≥ 0.8) → 403.

### Moderation (app/api/routers/moderation.py, schemas/moderation.py)
- POST /v1/moderation/agent-links: создание связи между агентами (manual и др.), схема AgentLinkCreateRequest.

### Config (app/config.py)
- circuit_breaker_n_runs, circuit_breaker_min_return_pct, circuit_breaker_k_killed (для будущей логики breaker).

### Тесты
- **tests/test_engine_unit.py**: валидация workflow, действия (math, cmp, if, rand с seed), max_steps kill, успешный run с save_as/ref.
- **tests/fixtures/base_vertical_workflow.json**: пример workflow buy/sell с rand.
- **tests/test_listings_orders.py**: отдельный buyer agent для place_order и list_access_grants (запрет self-dealing).
- **tests/test_runs.py**: использование BaseVertical (по имени из list verticals), workflow с const + math_add; проверка state == "succeeded".

### Результат
- **49 passed** (включая 7 тестов движка). Миграция 002 применяется после stamp 001 при уже существующих таблицах.

---

## 2025-02-23 — BaseVertical JSON-схемы, 3 фикстуры стратегий, правки по notes

### Схемы (schemas/basevertical/)
- **workflow_v1.json** — BaseVertical WorkflowSpec v1 (draft/2020-12): vertical_id, version, inputs, limits, steps; refOrValue, step с allOf по действиям (const, math_*, cmp, if, rand_uniform, portfolio_buy/sell).
- **verticalspec_v1.json** — BaseVertical VerticalSpec v1: allowed_actions (10), required_resources, metrics, risk_spec (default_max_loss_pct, default_max_steps, default_max_runtime_ms), workflow_schema.

### Фикстуры стратегий (tests/fixtures/)
- **basevertical_conservative_flip.json** — маленькие суммы, низкий риск: 1 buy @ rand(95–105), 1 sell @ rand(98–108).
- **basevertical_aggressive_multi_trade.json** — несколько сделок: buy 2, sell 1, sell 1 по разным rand диапазонам.
- **basevertical_random_baseline.json** — случайная стратегия: buy 3, coin flip (cmp gt 0.5), if then/else для sell price или 0; portfolio_sell с price=0 даёт no-op (skipped).

В фикстурах vertical_id = placeholder `00000000-0000-0000-0000-000000000001`; в тестах подставлять реальный id BaseVertical из API.

### Правки по notes разработчика (app/engine/actions/base_vertical.py)
- **portfolio_sell при price=0**: no-op, возврат `{"skipped": True, "asset", "qty": 0, "cost": 0}` без изменения портфеля и equity curve.
- **rand_uniform без seed**: детерминированный seed = `int(sha256(run_id.encode()).hexdigest()[:8], 16)`.

### Тест
- **test_portfolio_sell_price_zero_no_op**: проверка, что при price=0 возвращается skipped и портфель не меняется.

---

## 2025-02-23 — Quarantine для агентов < 24h (лимит заказов/день)

### Цель
Ограничить число заказов в день для агентов, созданных менее 24 часов назад.

### Изменения
- **app/config.py**: добавлены `quarantine_hours` (24) и `quarantine_max_orders_per_day` (3).
- **app/api/routers/orders.py**: при `place_order` и `buyer_type=agent` загружается агент; если `created_at` в пределах последних `quarantine_hours`, считается число заказов этого агента за текущий UTC-день; при достижении лимита возвращается 403 с сообщением про карантин. Сравнение времени с учётом timezone-naive (created_at считаем UTC).
- **tests/test_listings_orders.py**: добавлен `test_quarantine_new_agent_order_limit` — один новый агент делает 3 заказа (201), 4-й возвращает 403 и в detail есть "Quarantine".

### Результат
- **51 passed** (все тесты, включая новый тест карантина).

---

## 2026-03-17 — Golden Path Hardening + Trust/Abuse & Simulation

### Цели

- Сделать Golden Path seller→listing→buy→grant→run→revenue **демо‑готовым** и покрытым тестами.
- Закрыть idempotency / self‑dealing / quarantine / risk‑гейты по Golden Path.
- Добавить observability (`/admin/overview`) и живой demo‑скрипт.
- Заложить основы trust/abuse‑hardening и симуляции поведения системы под нагрузкой.

### Golden Path: UX и API

- **frontend-app/src/app/listings/[id]/page.tsx**
  - Success‑экран после покупки прокидывает контекст:
    - CTA **View access grants** → `/access?grantee_type=agent&grantee_id=<buyer_agent_id>`.
    - CTA **Run this strategy** → `/runs/new?buyer_agent_id=...&strategy_id=...&strategy_version_id=...` (версия берётся из `listing.strategy_version_id` / загруженной версии).
- **frontend-app/src/app/access/page.tsx**
  - Читает `grantee_type`/`grantee_id` из query‑параметров и фильтрует listGrants по ним.
  - CTA **Run strategy** для scope=execute ведёт на `/runs/new?strategy_id=...&buyer_agent_id=...`.
- **frontend-app/src/app/runs/new/page.tsx**
  - Читает из URL `buyer_agent_id`, `strategy_id`, `strategy_version_id`.
  - При загрузке версий через `strategies.getVersions`:
    - сохраняет prefilled `strategy_version_id`, если он есть в списке;
    - не затирает выбранную версию после асинхронной подгрузки.
- **frontend-app/src/app/runs/[id]/page.tsx**
  - CTA **View ledger** для быстрого перехода к денежному следу run.
- **frontend-app/src/app/dashboard/seller/page.tsx**
  - Агрегация выручки строится по `ledger_events` с `metadata.order_settlement=true`:
    - суммирует только settlement‑события по агентским аккаунтам;
    - показывает total выручку и последние события по каждому seller‑агенту.

### Golden Path: backend tests

- **tests/api/test_golden_path_smoke.py**
  - `test_flow1_smoke_golden_path`:
    - `POST /v1/agents` → seller/buyer;
    - `POST /v1/strategies` + `POST /v1/strategies/{id}/versions` (BaseVertical workflow);
    - `POST /v1/listings` с `strategy_version_id`;
    - `POST /v1/ledger/deposit` на buyer;
    - `POST /v1/orders` c `Idempotency-Key` → `status=paid`;
    - `GET /v1/access/grants` → execute‑grant для buyer/strategy;
    - `POST /v1/runs` c `Idempotency-Key` → `state ∈ {running, succeeded, completed}`;
    - `GET /v1/ledger/balance` по seller → баланс вырос ≥ цены листинга.
  - `test_duplicate_order_same_key_is_idempotent_smoke` и `test_duplicate_run_same_key_is_idempotent_smoke`:
    - повторные `POST /v1/orders`/`POST /v1/runs` с тем же `Idempotency-Key` возвращают один и тот же `id` без дополнительных побочных эффектов.
- **tests/api/test_idempotency_and_guards.py**
  - `test_listing_without_version_rejected` — `POST /v1/listings` без `strategy_version_id` → 400/422.
  - `test_run_without_grant_forbidden` — попытка `POST /v1/runs` без предварительного access grant → 401/403 (контракт на будущее усиление guard’а).
  - `test_self_dealing_forbidden` — buyer == owner_agent_id → 403 с `detail` про Self‑dealing.
  - `test_quarantine_and_graph_gate_return_readable_error`:
    - повторные заказы молодого агента упираются в quarantine‑лимит (detail содержит "Quarantine");
    - политика с `max_reciprocity_score` на пуле даёт читабельный `detail` при блокировке run.

### Scenario matrix и simulation

- **tests/api/test_scenarios_matrix.py**
  - Happy:
    - `test_happy_buyer_repeat_run` — один buyer дважды запускает run по тому же grant’у (два успешных run с разными Idempotency‑keys).
    - `test_happy_buyer_buys_two_distinct_listings` — один buyer покупает два разных listing’а.
  - Fail:
    - `test_fail_ledger_halted_blocks_order_and_ledger_ops` — при `ledger_invariant_halted` (`/v1/system/jobs/tick` + `/v1/system/ledger-invariant-status`) `POST /v1/orders` возвращает 503.
- **scripts/simulate_agents.py**
  - Асинхронный симулятор поведения системы:
    - создаёт N агентов с разными ролями;
    - генерирует стратегии/версии/листинги для случайных seller’ов;
    - делает депозиты, размещает заказы, запускает runs через HTTP API;
    - периодически запрашивает `/v1/agents/{id}/graph-metrics` для построения реальных graph‑метрик (reciprocity_score, cluster_size, cluster_cohesion, suspicious_density, in_cycle).
  - Параметры:
    - `--agents` (50/200/1000), `--steps` (число операций), `--seed` (детерминизм).

### Observability: admin overview

- **frontend-app/src/app/admin/overview/page.tsx**
  - Новый экран `/admin/overview` (для авторизованных пользователей) собирает:
    - `system/health` и `system/ledger-invariant-status` (флаг halted).
    - **Recent orders** (`GET /v1/orders`): id, listing_id, buyer, amount, status.
    - **Recent access grants** (`GET /v1/access/grants`): strategy, grantee, scope, created_at.
    - **Recent runs** (`GET /v1/runs`): id, strategy_version_id, state, failure_reason.
    - **Failed runs**: фильтр `state=failed`.
    - **Recent order settlement events** (`GET /v1/ledger/events`): события с `metadata.order_settlement=true`.
  - Цель: за <30 секунд ответить:
    - создавался ли order;
    - выдан ли access grant;
    - создался ли run и его статус;
    - есть ли проблемы ledger invariant / risk gate.

### Demo‑режим и документация

- **docs/golden-path-bugs.md**
  - Единый журнал багов по Golden Path: `step`, `expected`, `actual`, `severity`, `endpoint/route`.
- **docs/DEMO_GOLDEN_PATH.md**
  - Happy path story:
    - Seller S / Buyer B (agents), одна стратегия/версия/listing, один успешный run.
    - Маршрут по UI: `/agents` → `/strategies/[id]` → `/listings/[id]` → `/access` → `/runs/new` → `/runs/[id]` → `/dashboard/seller`.
    - Ledger trail: какие аккаунты участвуют и на каких страницах смотреть движение денег.
  - Failure demo:
    - **Self-dealing blocked** и опционально **Run blocked by risk/graph gate** с описанием поведения API и UI.
  - Скрипт презентации (5–7 шагов), какие экраны открыть и где подсветить idempotency, risk/reputation, ledger invariant.

### Trust/abuse‑слой (усиление)

- **Agent provenance**
  - Модель `Agent` уже содержит `created_by_agent_id` (миграция 019), используется в `AgentPublic` и `POST /v1/agents` (принимается из тела запроса и может использоваться для построения “родительского” графа).
- **Graph‑метрики и risk‑гейты**
  - В `get_agent_graph_metrics` уже считаются:
    - `reciprocity_score`, `cluster_cohesion`, `suspicious_density`, `cluster_size`, `in_cycle`.
  - Политика риска (`policy_json`) поддерживает `max_reciprocity_score`, `max_suspicious_density`, `max_cluster_size`, `block_if_in_cycle`.
  - `POST /v1/runs` использует эти метрики и возвращает детализированные `detail` при срабатывании гейтов (graph/reputation/cluster).

### Результат

- Golden Path покрыт API‑smoke, regression и UI e2e, контекст не теряется между страницами, seller dashboard и admin overview дают понятный денежный и операционный след.
- Trust/abuse‑механики (self‑dealing, quarantine, graph‑гейты, idempotency) включены в основной путь и проверяются как отдельными тестами, так и массовой симуляцией через `scripts/simulate_agents.py`.

---

## 2026-03-17 — Contracts v1 hardening: execution container + per_run idempotency + activity

### Цели
- Превратить контракт в **execution container**: run запускается только внутри активного контракта и только worker’ом.
- Закрыть **гонки** `max_runs` через атомарный счётчик.
- Зафиксировать правило **one run → one payout** для per_run на уровне БД.
- Дать UX‑слой: runs list + activity timeline на `/contracts/[id]`.
- Добавить минимальные contract reputation events.

### Изменения (backend)
- **app/api/routers/runs.py**
  - `POST /v1/runs` с `contract_id`:
    - требует `Authorization: Bearer ...`;
    - enforcement: пользователь должен владеть `contract.worker_agent_id`;
    - `SELECT ... FOR UPDATE` по контракту;
    - `max_runs` реально режет новые запуски;
    - `contracts.runs_completed++` атомарно (резервирование слота).
  - Per-run payout перенесён на succeeded run:
    - `LedgerEventTypeEnum.contract_payout` с `metadata.contract_id` + `metadata.run_id`;
    - конфликт уникальности → идемпотентный no-op.
- **app/db/models.py**
  - `Contract.runs_completed` (INT, default 0).
- **alembic/versions/025_contracts_runs_completed.py**
  - миграция колонки `runs_completed`.
- **alembic/versions/026_contract_payout_unique_by_contract_and_run.py**
  - уникальный индекс на `ledger_events`:
    - `((metadata->>'contract_id'), (metadata->>'run_id')) WHERE type='contract_payout'`
    - правило uniqueness = `(contract_id, run_id, contract_payout)`.
- **app/api/routers/contracts.py**
  - `GET /v1/contracts/{id}/runs` (MVP list).
  - `GET /v1/contracts/{id}/activity` (timeline из contract+run+ledger).
- **app/services/reputation_events.py** + **app/api/routers/contracts.py**
  - события `contract_accepted|contract_completed|contract_cancelled` (минимум v1).
- **app/schemas/ledger.py**
  - schema enum `LedgerEventType` расширен: `contract_escrow`, `contract_payout` (для фильтра `/v1/ledger/events?type=...`).

### Изменения (frontend)
- **frontend-app/src/app/contracts/[id]/page.tsx**
  - блоки **Payments**, **Runs**, **Activity**.
- **frontend-app/src/lib/api.ts**
  - `contracts.getRuns`, `contracts.getActivity`.

### Тесты
- **tests/api/test_contracts_hardening.py** (новый): auth+worker enforcement, max_runs, one run → one payout.
- **tests/api/test_contracts_lifecycle.py** обновлён под новую семантику per_run payout (платёж на run, а не на complete).

### Результат
- Контракт стал главной рамкой исполнения: run нельзя запустить “мимо” worker’а и лимитов, per_run payout идемпотентен на уровне БД, UI показывает runs/timeline.

---

## 2026-03-17 — Contracts v1.1: Milestones / Staged Contracts

### Цели
- Добавить **staged work** (2–5 milestones на контракт) и частичные выплаты по этапам.
- Привязать run к milestone: `run → milestone → contract`.
- Для per_run добавить milestone budget/cap.
- Дать UI управления milestones и demo‑историю.

### Изменения (backend)
- **app/db/models.py**
  - `ContractMilestone` + `ContractMilestoneStatusEnum`.
  - `Run.contract_milestone_id` (FK).
- **alembic/versions/028_contract_milestones_and_run_milestone_id.py**
  - новая таблица `contract_milestones` + колонка `runs.contract_milestone_id`.
- **app/schemas/contract_milestones.py** (новый)
  - create/update/public + status enum.
- **app/schemas/runs.py**
  - `RunRequest.contract_milestone_id`.
- **app/api/routers/contract_milestones.py** (новый) + **app/main.py**
  - CRUD + lifecycle:
    - `POST /v1/milestones/contracts/{contract_id}`
    - `GET /v1/milestones/contracts/{contract_id}`
    - `PATCH /v1/milestones/{id}`
    - `POST /v1/milestones/{id}/submit|accept|reject|cancel`
  - Валидации:
    - milestone currency == contract currency;
    - fixed: сумма milestones.amount_value <= contract.fixed_amount_value;
    - роли: employer управляет milestones, worker submit.
  - `milestone.accept` для fixed делает **частичный payout из escrow** с `metadata.milestone_id`.
- **app/api/routers/runs.py**
  - enforcement `contract_milestone_id`:
    - `FOR UPDATE` по milestone, `required_runs`, `completed_runs++`;
    - связка contract_id ↔ milestone.contract_id;
  - per_run payout с milestone budget/cap:
    - payout = min(per_run_amount, remaining_budget_milestone);
    - metadata включает `milestone_id`.

### Изменения (frontend)
- **frontend-app/src/lib/api.ts**
  - добавлен клиент `milestones.*`.
  - `runs.create` принимает `contract_milestone_id`.
- **frontend-app/src/app/contracts/[id]/page.tsx**
  - блок **Milestones**: список + кнопки submit/accept/reject/cancel + “Run under milestone”.
- **frontend-app/src/app/runs/new/page.tsx**
  - пробрасывает `contract_milestone_id` из query в `POST /v1/runs`.

### Тесты и demo
- **tests/api/test_contracts_milestones.py** (новый):
  - fixed staged: partial payout + cancel refund;
  - per_run staged: milestone budget cap (7 + 3) и linkage run→milestone.
- **docs/DEMO_CONTRACTS_MILESTONES.md** (новый): 2 сценария (fixed escrow partial + per_run budget cap).

### Результат
- Contracts v1.1 добавил “реалистичность найма”: этапы, частичные выплаты, бюджетирование per_run по milestone и UX‑слой управления milestones на странице контракта.
