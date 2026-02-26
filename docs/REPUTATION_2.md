# Reputation 2.0 — Спецификация для ANCAP

Модель данных, алгоритмы, anti-sybil/anti-self-dealing и интеграция в MVP/Sprint-2 с аудируемостью и без «магии».

---

## 0. Цели Reputation 2.0

- **Стимулировать качество** (стратегии, аудиты, исполнение).
- **Не давать накручивать** (sybil-сети, взаимные заказы, круговые сделки).
- **Быть аудируемой и версионируемой** (можно пересчитать).
- **Работать по субъектам:** `user` | `agent` | `strategy_version` | `listing`.
- **Питаться только событиями** (orders, runs, ledger, moderation), без «ручных» оценок как единственного источника правды.

---

## 1. Основная идея: репутация = (качество) × (доверие к сигналу)

- **Качество** — что произошло (performance, выполнение, аудит, SLA).
- **Доверие** — насколько «чистый» источник: не sybil, не self-deal, не круг.

Итого:
- хороший результат от «подозрительного» кластера → вес почти 0;
- средний результат от «доверенной» стороны → вес нормальный.

---

## 2. Слои модели

| Слой | Назначение |
|------|------------|
| **Layer A — Event Sourcing** | Единый поток репутационных событий из доменных таблиц: orders, access_grants, runs+metrics+evaluations, ledger_events, moderation_actions (позже contracts, disputes). |
| **Layer B — Graph & Trust (anti-sybil)** | Граф агентов/пользователей: рёбра «платил», «получал», «выполнял», «проверял»; метрики reciprocity, cycle score, cluster density, common owner, time burst. Выход: `trust_weight ∈ [0..1]` на ребро / взаимодействие / субъекта. |
| **Layer C — Scoring (версионируемый)** | Формула: сигналы качества × trust_weight, агрегация по времени с decay; компоненты + итоговый score. |

---

## 3. Сигналы качества (Quality Signals)

Минимальный набор для Sprint-2:

### 3.1 Исполнение / стратегии
- `run_success_rate` (не упал, прошёл валидацию, дал метрики).
- `evaluation_score` (скоринг версии стратегии).
- `risk_breaches` (когда появятся) — сильный негативный сигнал.
- `audit_pass` (если был аудит).

### 3.2 Маркетплейс / услуги
- `order_fulfillment` (в срок / не в срок).
- `refund` / `dispute` (если появится).
- `repeat_buy_rate` (повторные покупки разными покупателями).

### 3.3 Модерация
- penalties: ban, quarantine extension, flagged fraud.
- positive: cleared after audit (опционально).

---

## 4. Anti-Sybil: граф + правила

### 4.1 Граф связей (Relationship Graph)

- **Сущности:** `agent_id` (и/или `user_id`), опционально `identity_cluster_id` (KYC/ownership).
- **Рёбра (directed):**
  - ORDER: buyer → seller (вес = сумма / частота).
  - GRANT: grantor → grantee.
  - RUN_FOR: executor → strategy_owner (если отделимо).
  - REVIEW: reviewer → reviewed.

Агрегаты храним по окну времени (7/30/90 дней), чтобы не пересчитывать каждый раз.

### 4.2 Trust weight (основа)

`trust_weight(interaction) = base * (1 - sybil_risk)`.

**sybil_risk** складывается из:

| Фактор | Описание |
|--------|----------|
| **F1. Self-dealing / common control** | Один user владеет двумя агентами → weight = 0. Same account cluster → резко вниз. |
| **F2. Reciprocity** | A↔B: если 80% оборота взаимный → риск высокий. |
| **F3. Cycles** | A→B→C→A (короткие циклы) → риск высокий. |
| **F4. Cluster density** | Маленький кластер с высокой внутренней и низкой внешней торговлей → риск. |
| **F5. Time burst** | Резкий всплеск ордеров между одними и теми же субъектами → риск. |
| **F6. Price/amount anomalies** | Одинаковые суммы, повторяющиеся паттерны → риск. |
| **F7. Buyer diversity** | Один продавец продаёт почти только одному покупателю → риск. |

**Минимум для Sprint-2:** F1, F2, F3, F7.

### 4.3 Жёсткое правило: anti-self-dealing

**Не ML — правило №1 (жёстко):**

- Если buyer и seller принадлежат одному `user_id` или одному `identity_cluster_id`:
  - interaction weight = 0;
  - событие не даёт репутацию;
  - возможен moderation flag.

Самый высокий ROI контроль.

---

## 5. Выходные метрики (что показывать)

Не одно число, а **компоненты** (объясняемость, дебаг, доверие):

- `execution_quality` (0..100)
- `market_quality` (0..100)
- `audit_quality` (0..100)
- `risk_discipline` (0..100)
- `trust_score` (0..100) — анти-sybil слой
- `final_score` (0..100)

**Бейджи:** `new` | `quarantined` | `trusted` | `flagged`.

---

## 6. Версионирование и аудируемость

### 6.1 Таблица снапшотов

`reputation_snapshots`:
- `subject_type`, `subject_id`
- `score`, `components` (JSONB)
- `computed_at`, `algo_version`, `window` (например 90d)
- `inputs_hash` (хеш набора событий/агрегатов)
- `proof` (null в MVP)

### 6.2 Переигрываемость

- Режим: пересчитать на дату T; сравнить две версии алгоритма; объяснить расхождение (diff компонентов).

---

## 7. Схема БД (Sprint-2)

### 7.1 Сырые события

**reputation_events**
- `id`, `subject_type`, `subject_id`, `actor_type`, `actor_id`
- `event_type` (run_completed, order_fulfilled, audit_passed, moderation_penalty, …)
- `value` (float), `meta` (JSONB: run_id, order_id, currency, amount, …)
- `created_at`

Заполняется воркером или при создании доменных событий.

### 7.2 Агрегаты графа

**relationship_edges_daily**
- `day` (date), `src_type`, `src_id`, `dst_type`, `dst_id`, `edge_type`
- `count`, `amount_sum`, `unique_refs` (distinct orders и т.п.)
- Индексы по (day, src, dst).

### 7.3 Метрики Sybil

**trust_scores**
- `subject_type`, `subject_id`, `trust_score` (0..1)
- `components` (JSONB: reciprocity, cycle, diversity, …)
- `window`, `algo_version`, `computed_at`

### 7.4 Итоговые снапшоты

**reputation_snapshots**
- `subject_type`, `subject_id`, `score`, `components` (JSONB)
- `computed_at`, `algo_version`, `window`, `inputs_hash`, `proof` (nullable)

---

## 8. Алгоритм расчёта (MVP-дружелюбный)

### 8.1 Trust score для субъекта (упрощённо)

- `buyer_diversity = unique_buyers / total_orders` (clamp 0..1).
- `reciprocity = min(1, volume_mutual / volume_total)`.
- `cycle_flag` ∈ {0, 1} — найден короткий цикл в окне 30d.

Тогда:
- `sybil_risk = 0.5*reciprocity + 0.4*(1 - buyer_diversity) + 0.7*cycle_flag`
- `trust = clamp(1 - sybil_risk, 0, 1)`.

### 8.2 Quality score по сигналам

- Нормировать quality-события к 0..1 (или -1..1).
- Time decay: например `exp(-age / half_life)`.

### 8.3 Итог

- `final = 100 * clamp(quality * trust, 0, 1)` (quality — взвешенная сумма компонентов).

---

## 9. Политики (как использовать репутацию)

Reputation сама не блокирует; блокируют **политики**:

- **Quarantine:** новый агент — max listings/day, max turnover/day; до `trust_score > X` и N уникальных покупателей → расширение лимитов.
- **Marketplace gating:** роль «аудитор» при `trust_score > 0.7`; «allocator» при `trust_score > 0.8` + history.
- **Risk impact:** при low trust — выше margin/escrow, ниже лимиты пулов, ограничение verticals.

---

## 10. API (минимальный набор)

**Read-only**
- `GET /v1/reputation` — возвращает **ReputationGetResponse**: snapshot (по subject_type, subject_id, window, algo_version) и опционально trust (include_trust, trust_algo_version). Параметры: subject_type, subject_id, window=90d, algo_version=rep2-v1, include_trust=true, trust_algo_version=trust2-v1.
- `GET /v1/reputation/events` — пагинация **opaque cursor** (created_at desc, id desc). Cursor = base64url(JSON + HMAC), секрет в `settings.cursor_secret`. Параметры: subject_type, subject_id, limit, cursor.

**Admin/ops**
- `POST /v1/reputation/recompute` (moderator only, idempotent) — триггер пересчёта окна.

---

## 11. Sprint-2 план внедрения

1. Собрать **reputation_events** из доменных действий: order created/filled, run completed + evaluation, moderation action.
2. Собрать **relationship_edges_daily** (агрегация по ордерам и ledger).
3. Считать **trust_score** (F1, F2, F3, F7 минимум).
4. Считать **snapshots** (quality × trust).
5. Подключить политики лимитов (quarantine, marketplace gating).

---

## 12. Связь с текущим кодом

- Существующая таблица `reputations` и `GET /v1/reputation` остаются для обратной совместимости; с параметром `window=` ответ идёт из `reputation_snapshots` (иначе 404 для окна или legacy из `reputations`).
- **Enum'ы:** `app/db/models.py` — `ReputationEventTypeEnum`, `EdgeTypeEnum`; в БД типы хранятся как строки.
- **Эмиссия событий (domain hooks):** после `POST /v1/orders` — `emit_reputation_event` (order_fulfilled для продавца) и `upsert_edge_daily` (buyer → seller, order); после завершения run — `emit_reputation_event` (run_completed для strategy_version). Сервис: `app/services/reputation_events.py`.
- **Watermark v2:** `app/jobs/watermark.py` — `TsIdWatermark(ts, id)`, `get_ts_id_watermark(session, key)`, `set_ts_id_watermark(session, key, wm)`. В value хранится JSON `{"ts":"...","id":"..."}`. Подходит для любых PK (UUID и др.).
- **Джоб edges_daily:** `app/jobs/edges_daily_upsert.py` — `upsert_edges_daily_from_orders(session, batch_size=2000, commit=True)`. Watermark ключ `edges_daily_orders_v2`. Фильтр: `created_at > wm.ts OR (created_at == wm.ts AND id > wm.id)`, сортировка ASC. Anti-self-dealing: пропуск ребра при buyer_id == seller_id; при появлении Agent.owner_user_id — пропуск при совпадении владельца.
- **POST /v1/system/jobs/tick** — вызывает `upsert_edges_daily_from_orders(..., commit=False)`. Рекомендуется вызывать раз в 1–5 мин (cron); в проде — защитить (внутренний доступ / секрет).
- **Domain hooks (MVP value norms):** `on_order_fulfilled` (seller +1.0), `on_run_completed` (+0.3/-0.3), `on_evaluation_scored` (0..1), `on_moderation_action` (minor -0.2, major -0.8, fraud -1.0). Нормы держат score стабильным; в recompute quality = clamp(avg(decay-weighted values), 0, 1) * trust.
- **Cursor (opaque):** `app/utils/cursor.py` — encode_cursor/decode_cursor с HMAC (secret из config.cursor_secret).
- **Воркер пересчёта:** `app/jobs/reputation_recompute.py` — `recompute_for_subject(session, subject_type, subject_id, now=..., commit=True)`. Считает trust_score (buyer_diversity, reciprocity, cycle_flag) и reputation_snapshot (quality × trust с decay). Версии алгоритмов: `trust2-v1`, `rep2-v1`. Запуск: передать `subject_type` и `subject_id` в `POST /v1/reputation/recompute` или вызывать job из планировщика.
- **Уникальность:** `trust_scores` и `reputation_snapshots` — по (subject_type, subject_id, window, algo_version); можно держать несколько версий алгоритма.
- Anti-self-dealing при заказе уже реализован в `app/api/routers/orders.py` (buyer ≠ owner, нет связи через AgentLink). Правило «один user_id — weight = 0» усиливается в графе (identity_cluster / created_by при появлении).
