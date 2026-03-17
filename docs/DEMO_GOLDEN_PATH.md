# DEMO_GOLDEN_PATH — Golden Path Story

Короткий сценарий для живой демо: seller → listing → buy → grant → run → revenue.

## Сущности

- **Seller S / Agent A**: агент-продавец (builder/seller), владелец стратегии.
- **Buyer B / Agent B**: агент-покупатель.
- **Strategy & Version**: одна стратегия с одной версией (`1.0.0`) на `BaseVertical`.
- **Listing**: один активный listing, привязанный к `strategy_version_id`.
- **Run**: один успешный run в режиме `mock`/`dry_run`.

Все сущности можно поднять либо руками через UI, либо через сидер:

```bash
python scripts/seed_demo.py --seed 42
```

Сидер создаёт связку `vertical/pool/agents/strategy/version/listing/order/grant/run` и печатает артефакты с ID.

## Happy Path: шаги демо

1. **Agents — показать участников**
   - Открыть `/agents`.
   - Показать `Seller S` и `Buyer B` (или создать их перед демо).
   - Объяснить: это агенты, которые дальше будут продавать и покупать стратегию.

2. **Strategies — показать стратегию и версию**
   - Открыть `/strategies` и перейти в `/strategies/[id]` для стратегии Seller S.
   - Показать блок версий, версию `1.0.0` и короткий changelog/описание workflow.
   - Объяснить: стратегия = декларативный workflow, версия = freeze состояния стратегии.

3. **Listings — публикация и просмотр**
   - Из `/strategies/[id]` показать кнопку **Publish listing** и уже опубликованный listing.
   - Перейти в `/listings/[id]` для этого listing.
   - Объяснить: listing — то, что видит рынок; тут зашита цена и привязка к конкретной версии.

4. **Buy — покупка доступа**
   - На `/listings/[id]` выбрать `Buyer B` как buyer agent.
   - Нажать **Buy access**.
   - Показать success-screen:
     - CTA **View access grants** → `/access?grantee_type=agent&grantee_id=...`.
     - CTA **Run this strategy** → `/runs/new?buyer_agent_id=...&strategy_id=...&strategy_version_id=...`.
   - Объяснить idempotency: повторный клик не создаёт второй order, API защищено `Idempotency-Key`.

5. **Access — grant на исполнение**
   - Перейти на `/access` (через CTA).
   - Показать grant с `scope=execute` для `Buyer B` и нужной стратегии.
   - Нажать **Run strategy** → перейти на `/runs/new` с проставленными параметрами в URL.

6. **Run — запуск стратегии**
   - На `/runs/new` показать, что `strategy_version_id` уже выбран контекстом.
   - Оставить `run_mode=mock`, `dry_run=true`, параметры по умолчанию.
   - Нажать **Execute run** → перейти на `/runs/[id]`.
   - На `/runs/[id]` показать:
     - статус run, артефакты (`inputs_hash`, `workflow_hash`, `outputs_hash`),
     - логи и шаги.

7. **Seller dashboard — выручка и движение денег**
   - Открыть `/dashboard/seller`.
   - Показать:
     - суммарную выручку по валютам (агрегация по `metadata.order_settlement=true`),
     - недавние ledger-события с `order_settlement`.
   - При желании перейти в `/ledger` для более детального просмотра движений.

## Ledger trail и earnings

- **Участвующие аккаунты**:
  - счёт покупателя (`owner_type=agent`, `owner_id=Buyer B`);
  - escrow-счёт для ордера;
  - счёт продавца (`owner_type=agent`, `owner_id=Seller S`);
  - системные аккаунты (fees/treasury) — для комиссий и run fee.
- **Где смотреть**:
  - `/dashboard/seller` — агрегированная выручка и последние `order_settlement` события;
  - `/ledger` — все счета и события с возможностью провалиться глубже.

## Failure demo

### 1. Self-dealing blocked

- **Сценарий**:
  - Использовать `Seller S` и его же стратегию/listing.
  - На `/listings/[id]` выбрать в качестве buyer тот же агент, что и владелец стратегии.
- **Ожидаемое поведение**:
  - Backend: `POST /v1/orders` возвращает `403` с detail `Self-dealing: ...`.
  - UI: на `/listings/[id]` показывается дружелюбное сообщение
    о том, что владелец стратегии не может покупать свою же стратегию.
- **Наблюдаемость**:
  - На `/admin/overview` видно, что новые orders не проходят (но система здорова).
  - В `/reputation` можно показать, что self-dealing учитывается политиками.

### 2. Run blocked by risk / graph gate (опционально)

- **Сценарий**:
  - Настроить жёсткую политику для пула (через `/v1/risk/limits`), напр. минимальный trust score
    или `max_reciprocity_score=0.0`.
  - Попытаться запустить run на этом пуле через `/runs/new`.
- **Ожидаемое поведение**:
  - Backend: `POST /v1/runs` возвращает `403` с detail вида
    `Reputation gate: ...` или `Graph gate: ...`.
  - UI: на `/runs/new` или `/listings/[id]` отображается понятное сообщение
    о том, что политика риска/графа блокирует запуск.
- **Наблюдаемость**:
  - `/admin/overview` показывает наличие failed/blocked runs.
  - `/reputation` и `/ledger` помогают понять контекст (низкий trust score, подозрительный граф).

## Связка с observability

- При любом сбое в Golden Path оператор может за <30 секунд открыть `/admin/overview` и ответить:
  - был ли создан order;
  - выдан ли access grant;
  - создался ли run и в каком он состоянии;
  - есть ли проблемы с ledger invariant или risk/graph gate.
- Для более глубокого расследования используются `/reputation`, `/ledger`, `/runs/[id]`.

## Скрипт презентации (5–7 шагов для презентующего)

1. **Открыть заранее**: `/agents`, `/strategies`, `/listings`, `/access`, `/runs`, `/dashboard/seller`, `/admin/overview`.
2. **Начать с картины мира**: коротко объяснить, что такое агенты, стратегии, листинги и runs.
3. **Пройти Happy Path**: от `/agents` до `/dashboard/seller`, показывая, как не теряется контекст
   (`strategy_id`, `strategy_version_id`, `buyer_agent_id`, `listing_id`).
4. **Подсветить idempotency**: на шаге покупки и запуска рассказать, что повторные запросы с тем же
   `Idempotency-Key` не приводят к двойному списанию.
5. **Показать observability**: открыть `/admin/overview` и показать, как за один экран видно,
   на каком слое остановился Golden Path.
6. **Показать failure-case**: проиграть сценарий self-dealing (или risk gate) и показать, как UI
   и `/admin/overview` дают понятное объяснение.
7. **Завершить**: вернуться к `/dashboard/seller` и `/ledger`, связать движение денег с бизнес-ценностью.

