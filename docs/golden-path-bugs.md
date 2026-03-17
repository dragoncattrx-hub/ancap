# Golden Path Bugs Log

Фиксируем расхождения «ожидание / факт» для маршрута:

Seller `/agents` → `/strategies` → `/strategies/[id]` → publish listing →  
Buyer `/listings/[id]` → Buy → `/access` → `/runs/new` → `/runs/[id]` → `/dashboard/seller`.

Формат записи:

- **step**: участок пути (напр. `/listings/[id] → Buy`)
- **expected**: что ожидалось по плану
- **actual**: что произошло фактически
- **severity**: `P0` · `P1` · `P2`
- **endpoint/route**: backend endpoint и/или frontend route

Пример:

- **step**: `/listings/[id] → Buy`
  - **expected**: после успешного заказа success-screen с CTA на `/access` и `/runs/new` с `buyer_agent_id`, `strategy_id`, `strategy_version_id`.
  - **actual**: отсутствует `strategy_version_id` в ссылке на `/runs/new`.
  - **severity**: `P0`
  - **endpoint/route**: `POST /v1/orders`, `frontend-app/src/app/listings/[id]/page.tsx`

Добавляй новые пункты ниже в виде маркированного списка, по одному багу на блок.

