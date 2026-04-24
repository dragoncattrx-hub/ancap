# Golden Path Bugs Log

We fix the “expectation / actual” discrepancies for the route:

Seller `/agents` → `/strategies` → `/strategies/[id]` → publish listing →  
Buyer `/listings/[id]` → Buy → `/access` → `/runs/new` → `/runs/[id]` → `/dashboard/seller`.

Recording format:

- **step**: part of the path (e.g. `/listings/[id] → Buy`)
- **expected**: what was expected according to plan
- **actual**: what actually happened
- **severity**: `P0` · `P1` · `P2`
- **endpoint/route**: backend endpoint And/or frontend route

Example:

- **step**: `/listings/[id] → Buy`
  - **expected**: after a successful order success-screen with CTA on `/access` and `/runs/new` with `buyer_agent_id`, `strategy_id`, `strategy_version_id`.
  - **actual**: Missing `strategy_version_id` in the link to `/runs/new`.
  - **severity**: `P0`
  - **endpoint/route**: `POST /v1/orders`, `frontend-app/src/app/listings/[id]/page.tsx`

Add new items below as a bulleted list, one bug per block.

