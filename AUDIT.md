# Аудит проекта ANCAP

**Дата:** 24 февраля 2025  
**Проект:** ANCAP — AI-Native Capital Allocation Platform

---

## 1. Резюме

Проект — зрелая платформа для распределения капитала с AI-агентами: FastAPI, PostgreSQL, Alembic, декларативные workflow-стратегии, маркетплейс, ledger, репутация, L3 (стейки, онбординг, chain anchors). Документация и план развития (ROADMAP, PLAN_L0_TO_L3, LOG) на высоком уровне. Тесты проходят (130 passed). Ниже — структурированные выводы и рекомендации.

---

## 2. Сильные стороны

### 2.1 Архитектура и документация
- **Чёткая визия:** README, VISION, ARCHITECTURE_LAYERS, PLAN_L0_TO_L3 — уровни L1/L2/L3 и соответствие коду описаны явно.
- **Единый монолит:** `app/` (api, db, engine, jobs, services, schemas) — понятная структура, без лишней фрагментации.
- **Миграции только через Alembic** — схема БД не создаётся приложением при старте; финтех-подход соблюдён.
- **Журнал изменений (LOG.md)** — изменения с датами, целями и результатами тестов; удобно для онбординга и отладки.

### 2.2 Финтех и безопасность модели
- **Double-entry ledger:** append-only события, баланс = сумма событий; типы счетов (treasury, fees, escrow, burn, external); проверка инварианта и остановка операций при нарушении.
- **Анти-злоупотребления:** anti-self-dealing (1-hop), quarantine новых агентов, граф (reciprocity_score, cluster_cohesion, suspicious_density, in_cycle), policy gates (max_reciprocity_score, block_if_in_cycle и др.).
- **Reputation 2.0:** event sourcing, trust_scores, reputation_snapshots, окно и algo_version.
- **Run audit:** inputs_hash, workflow_hash, outputs_hash, env_hash; lineage по parent_run_id; run_steps с context_after и replay от шага N.

### 2.3 Стек и зависимости
- **Актуальные версии:** FastAPI 0.115, SQLAlchemy 2.0 (async), Pydantic v2, asyncpg, Alembic.
- **requirements.txt** — фиксированные версии, отдельная секция для тестов (pytest, pytest-asyncio).

### 2.4 Тестирование
- **130 тестов**, все проходят (pytest с sync TestClient, один event loop — без skip из-за loop).
- Покрытие: auth, agents, keys, ledger, runs, reputation, moderation, risk, L3 (onboarding, stakes, chain anchors), step_quality, engine unit.
- conftest: единая БД (alembic upgrade head или create_all + seed BaseVertical), сброс ledger_invariant_halted перед каждым тестом.

### 2.5 Конфигурация
- **pydantic-settings** из env + `.env`; класс `Settings` с разумными дефолтами; `get_settings()` с `lru_cache`.
- `.env.example` есть — перечислены DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, DEBUG.

---

## 3. Замечания и риски

### 3.1 Безопасность и секреты (критично для продакшена)
- **SECRET_KEY** по умолчанию `"change-me-in-production-use-long-random-string"` — в продакшене обязан переопределяться через env; в docker-compose для api указан `SECRET_KEY: dev-secret-change-in-production` — этого недостаточно для production.
- **cursor_secret** по умолчанию `"change-me-cursor-secret"` — используется для HMAC в cursor pagination; в production должен быть отдельный случайный секрет.
- **CORS:** `allow_origins=["*"]` — для production нужно ограничить домены.
- **POST /v1/system/jobs/tick** — в коде указано: «In production, protect (e.g. internal only / cron secret)» — защита не реализована; без этого любой может дергать тик и влиять на watermark/reputation/ledger invariant.

**Рекомендации:**  
- В README или деплой-доке явно требовать задание SECRET_KEY, CURSOR_SECRET и ограничение CORS в production.  
- Добавить опциональную проверку заголовка/ключа для `/v1/system/jobs/tick` (например, X-Cron-Secret из env).

### 3.2 Идемпотентность (расхождение с README)
- В README заявлено: мутабельные финансовые и ордерные операции принимают **Idempotency-Key** и гарантируют exactly-once для:
  - `POST /v1/orders`
  - `POST /v1/ledger/deposit`, `withdraw`, `allocate`
  - `POST /v1/runs`
- В коде **нет** обработки заголовка Idempotency-Key (grep по idempotency / Idempotency-Key в `app/` — пусто).

**Рекомендация:**  
Либо реализовать приём Idempotency-Key и сохранение результата по ключу (с возвратом сохранённого ответа при повторе), либо убрать/ослабить формулировку в README до «рекомендуется к реализации».

### 3.3 Версии и предупреждения
- **alembic.ini:** `sqlalchemy.url` задан по умолчанию в ini. В `alembic/env.py` URL берётся из `get_settings().database_url` (env), так что в production используется переменная окружения. Имеет смысл не коммитить реальные пароли в ini и полагаться на env.
- **Pydantic:** 19 предупреждений (class-based `config` deprecated, `json_encoders` deprecated) — исходят из зависимостей (pydantic internal), но при появлении своих моделей с `Config` лучше перейти на ConfigDict и актуальный способ сериализации.

### 3.4 Инфраструктура и репозиторий
- **.gitignore:** в корне не найден (найден только `.pytest_cache/.gitignore`). Стоит добавить корневой `.gitignore` с: `.env`, `__pycache__/`, `.venv/`, `*.pyc`, `.pytest_cache/`, `*.egg-info/`, `ACP-crypto/target/`, и т.п., чтобы не коммитить секреты и артефакты.
- **Git:** репозиторий не инициализирован (No git repo) — для истории и CI имеет смысл инициализировать git и при необходимости добавить CI (например, запуск pytest при push).

### 3.5 Масштабирование и надёжность
- **Очереди:** в PLAN указано «Очередь: нет» — все операции синхронные. Для тяжёлых джобов (reputation_tick, agent_relationships, circuit_breaker_by_metric и т.д.) в будущем может понадобиться очередь (Redis/NATS) и воркеры.
- **S3/артефакты:** большие артефакты runs не сохраняются (только хэши); при появлении требований к хранению логов/дампов — заложить object storage.
- **Rate limiting:** на уровне API не видно глобального rate limit — при публичном API стоит рассмотреть лимиты по IP/ключу.

---

## 4. Структура кода (кратко)

- **Роутеры** — в `app/api/routers/`, зависимости через `deps.py` (get_db, get_current_user_id, get_agent_id_from_api_key).
- **Сервисы** — в `app/services/` (ledger, risk, auth, api_keys, reputation, onboarding, stakes, chain_anchor, step_quality и др.).
- **Джобы** — в `app/jobs/` (reputation_tick, circuit_breaker_by_metric, agent_relationships_upsert, edges_daily_upsert, watermark и т.д.); запуск централизован через `POST /v1/system/jobs/tick`.
- **Модели** — в `app/db/models.py`; enum’ы и связи аккуратно заданы.
- **Конфиг** — один класс в `app/config.py`, без дублирования секретов в коде.

Замечаний по грубым антипаттернам или дублированию не выявлено.

---

## 5. Чек-лист рекомендаций

| Приоритет | Действие |
|-----------|----------|
| Высокий   | Защитить `POST /v1/system/jobs/tick` (внутренний доступ или секрет). |
| Высокий   | Реализовать Idempotency-Key для orders/ledger/runs или скорректировать README. |
| Высокий   | Добавить корневой `.gitignore` и не коммитить `.env` и артефакты. |
| Средний   | В деплой-документации зафиксировать обязательную смену SECRET_KEY, CURSOR_SECRET и CORS в production. |
| Средний   | Проверить, что Alembic в production использует URL из env (env.py), а не из alembic.ini. |
| Низкий    | Устранить Pydantic deprecation в своих моделях (ConfigDict, сериализация). |
| Низкий    | Рассмотреть rate limiting и очередь для фоновых джобов при росте нагрузки. |

---

## 6. Итог

Проект в хорошем состоянии: сильная архитектурная база, продуманная модель рисков и репутации, актуальный стек, проходящие тесты и полезная документация. Основные точки роста — приведение безопасности (tick, секреты, CORS) и идемпотентности в соответствие с заявленным в README и подготовка к production (git, .gitignore, env для Alembic). После этого платформа готова к использованию в контролируемой среде и к дальнейшему развитию по ROADMAP.
