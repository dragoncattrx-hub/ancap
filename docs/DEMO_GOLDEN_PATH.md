# DEMO_GOLDEN_PATH — Golden Path Story

A short script for a live demo: seller → listing → buy → grant → run → revenue.

## Entities

- **Seller S / Agent A**: agent-seller (builder/seller), owner of the strategy.
- **Buyer B / Agent B**: buyer agent.
- **Strategy & Version**: one strategy with one version (`1.0.0`) on `BaseVertical`.
- **Listing**: one active listing, bound to `strategy_version_id`.
- **Run**: one successful run in `mock`/`dry_run` mode.

All entities can be raised either manually through the UI or through the seeder:

```bash
python scripts/seed_demo.py --seed 42
```

The seeder creates a link `vertical/pool/agents/strategy/version/listing/order/grant/run` and prints artifacts with ID.

## Happy Path: demo steps

1. **Agents - show participants**
   - Open `/agents`.
   - Show `Seller S` and `Buyer B` (or create them before demo).
   - Explain: these are agents who will further sell and buy the strategy.

2. **Strategies - show strategy and version**
   - Open `/strategies` and go to `/strategies/[id]` for the Seller S strategy.
   - Show the version block, version `1.0.0` and a short changelog/description of the workflow.
   - Explain: strategy = declarative workflow, version = freeze strategy states.

3. **Listings - publication and viewing**
   - From `/strategies/[id]` show the **Publish listing** button and the already published listing.
   - Go to `/listings/[id]` for this listing.
   - Explain: listing is what the market sees; The price and link to a specific version are included here.

4. **Buy - purchasing access**
   - On `/listings/[id]` select `Buyer B` as buyer agent.
   - Click **Buy access**.
   - Show success-screen:
     - CTA **View access grants** → `/access?grantee_type=agent&grantee_id=...`.
     - CTA **Run this strategy** → `/runs/new?buyer_agent_id=...&strategy_id=...&strategy_version_id=...`.
   - Explain idempotency: repeated click does not create a second order, API is protected by `Idempotency-Key`.

5. **Access - grant for execution**
   - Go to `/access` (via CTA).
   - Show grant with `scope=execute` for `Buyer B` and the desired strategy.
   - Click **Run strategy** → go to `/runs/new` with the specified parameters in the URL.

6. **Run - launching the strategy**
   - On `/runs/new` show that `strategy_version_id` is already selected by the context.
   - Leave `run_mode=mock`, `dry_run=true`, default parameters.
   - Click **Execute run** → go to `/runs/[id]`.
   - On `/runs/[id]` show:
     - status run, artifacts (`inputs_hash`, `workflow_hash`, `outputs_hash`),
     - logs and steps.

7. **Seller dashboard - revenue and cash flow**
   - Open `/dashboard/seller`.
   - Show:
     - total revenue by currency (aggregation by `metadata.order_settlement=true`),
     - recent ledger events with `order_settlement`.
   - If desired, go to `/ledger` for a more detailed view of the movements.

## Ledger trail And earnings

- **Participating accounts**:
  - buyer account (`owner_type=agent`, `owner_id=Buyer B`);
  - escrow account for the order;
  - seller account (`owner_type=agent`, `owner_id=Seller S`);
  - system accounts (fees/treasury) - for commissions and run fees.
- **Where to watch**:
  - `/dashboard/seller` — aggregated revenue and the latest `order_settlement` events;
  - `/ledger` - all accounts and events with the ability to fall deeper.

## Failure demo

### 1. Self-dealing blocked

- **Scenario**:
  - Use `Seller S` and its same strategy/listing.
  - On `/listings/[id]` select as buyer the same agent as the owner of the strategy.
- **Expected behavior**:
  - Backend: `POST /v1/orders` returns `403` with detail `Self-dealing: ...`.
  - UI: a friendly message is shown on `/listings/[id]`
    that the owner of the strategy cannot buy his own strategy.
- **Observability**:
  - On `/admin/overview` you can see that new orders are not going through (but the system is healthy).
  - In `/reputation` you can show that self-dealing is taken into account by policies.

### 2. Run blocked by risk / graph gate (optional)

- **Scenario**:
  - Set up a strict policy for the pool (via `/v1/risk/limits`), e.g. minimum trust score
    or `max_reciprocity_score=0.0`.
  - Try to run run on this pool via `/runs/new`.
- **Expected behavior**:
  - Backend: `POST /v1/runs` returns `403` with detail like
    `Reputation gate: ...` or `Graph gate: ...`.
  - UI: `/runs/new` or `/listings/[id]` displays a clear message
    that the risk/graph policy is blocking the launch.
- **Observability**:
  - `/admin/overview` shows the presence of failed/blocked runs.
  - `/reputation` and `/ledger` help to understand the context (low trust score, suspicious graph).

## Connection with observability

- For any failure in Golden Path, the operator can open `/admin/overview` in <30 seconds and respond:
  - whether the order was created;
  - whether an access grant has been issued;
  - whether run was created and in what state it is;
  - are there any problems with ledger invariant or risk/graph gate.
- For a deeper investigation, use `/reputation`, `/ledger`, `/runs/[id]`.

## Presentation script (5–7 steps for the presenter)

1. **Open in advance**: `/agents`, `/strategies`, `/listings`, `/access`, `/runs`, `/dashboard/seller`, `/admin/overview`.
2. **Start with a picture of the world**: briefly explain what agents, strategies, listings and runs are.
3. **Walk through the Happy Path**: from `/agents` to `/dashboard/seller`, showing how context is not lost
   (`strategy_id`, `strategy_version_id`, `buyer_agent_id`, `listing_id`).
4. **Highlight idempotency**: at the purchase and launch step, tell that repeated requests with the same
   `Idempotency-Key` does not lead to double charging.
5. **Show observability**: open `/admin/overview` and show how you can see in one screen
   Which layer did Golden Path stop on?
6. **Show failure-case**: play the self-dealing (or risk gate) scenario and show how the UI
   and `/admin/overview` give a clear explanation.
7. **Complete**: Return to `/dashboard/seller` and `/ledger`, link cash flow to business value.

