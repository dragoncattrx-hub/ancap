# Reputation 2.0 - Specification for ANCAP

Data model, algorithms, anti-sybil/anti-self-dealing and integration into MVP/Sprint-2 with auditability and without “magic”.

---

## 0. Whole Reputation 2.0

- **Promote quality** (strategies, audits, execution).
- **Do not let people cheat** (sybil networks, mutual orders, circular transactions).
- **Be auditable and versionable** (can be recalculated).
- **Work by subject:** `user` | `agent` | `strategy_version` | `listing`.
- **Feed only on events** (orders, runs, ledger, moderation), without “manual” assessments as the only source of truth.

---

## 1. Basic idea: reputation = (quality) × (signal trust)

- **Quality** - what happened (performance, execution, audit, SLA).
- **Trust** - how “pure” the source is: not sybil, not self-deal, not a circle.

Total:
- good result from a “suspicious” cluster → weight almost 0;
- average result from the “trusted” party → normal weight.

---

## 2. Model layers

| Layer | Destination |
|------|------------|
| **Layer A - Event Sourcing** | A single stream of reputation events from domain tables: orders, access_grants, runs+metrics+evaluations, ledger_events, moderation_actions (later contracts, disputes). |
| **Layer B - Graph & Trust (anti-sybil)** | Agents/users graph: edges “paid”, “received”, “executed”, “checked”; metrics reciprocity, cycle score, cluster density, common owner, time burst. Output: `trust_weight ∈ [0..1]` per edge/interaction/subject. |
| **Layer C - Scoring (versionable)** | Formula: quality signals × trust_weight, time aggregation with decay; components + final score. |

---

## 3. Quality Signals

Minimum set for Sprint-2:

### 3.1 Execution/Strategies
- `run_success_rate` (did not crash, passed validation, provided metrics).
- `evaluation_score` (strategy version scoring).
- `risk_breaches` (when they appear) - a strong negative signal.
- `audit_pass` (if there was an audit).

### 3.2 Marketplace / services
- `order_fulfillment` (on time / not on time).
- `refund` / `dispute` (if it appears).
- `repeat_buy_rate` (repeated purchases by different buyers).

### 3.3 Moderation
- penalties: ban, quarantine extension, flagged fraud.
- positive: cleared after audit (optional).

---

## 4. Anti-Sybil: graph + rules

### 4.1 Relationship Graph

- **Essences:** `agent_id` (and/or `user_id`), optional `identity_cluster_id` (KYC/ownership).
- **Ribs (directed):**
  - ORDER: buyer → seller (weight = amount / frequency).
  - GRANT: grantor → grantee.
  - RUN_FOR: executor → strategy_owner (if separable).
  - REVIEW: reviewer → reviewed.

We store units within a time window (7/30/90 days) so as not to recalculate each time.

### 4.2 Trust weight (base)

`trust_weight(interaction) = base * (1 - sybil_risk)`.

**sybil_risk** consists of:

| Factor | Description |
|--------|----------|
| **F1. Self-dealing / common control** | One user owns two agents → weight = 0. Same account cluster → sharply down. |
| **F2. Reciprocity** | A↔B: if 80% of the turnover is mutual → high risk. |
| **F3. Cycles** | A→B→C→A (short cycles) → high risk. |
| **F4. Cluster density** | Small cluster with high domestic and low foreign trade → risk. |
| **F5. Time burst** | A sharp surge in orders between the same subjects → risk. |
| **F6. Price/amount anomalies** | Same amounts, repeating patterns → risk. |
| **F7. Buyer diversity** | One seller sells almost only to one buyer → risk. |

**Minimum for Sprint-2:** F1, F2, F3, F7.

### 4.3 Strict rule: anti-self-dealing

**Not ML - rule No. 1 (hard):**

- If buyer and seller belong to the same `user_id` or the same `identity_cluster_id`:
  - interaction weight = 0;
  - the event does not give reputation;
  - possible moderation flag.

Highest ROI control.

---

## 5. Output metrics (what to show)

Not one number, but **components** (explainability, debug, trust):

- `execution_quality` (0..100)
- `market_quality` (0..100)
- `audit_quality` (0..100)
- `risk_discipline` (0..100)
- `trust_score` (0..100) — anti-sybil layer
- `final_score` (0..100)

**Badges:** `new` | `quarantined` | `trusted` | `flagged`.

---

## 6. Versioning and auditing

### 6.1 Snapshot table

`reputation_snapshots`:
- `subject_type`, `subject_id`
- `score`, `components` (JSONB)
- `computed_at`, `algo_version`, `window` (eg 90d)
- `inputs_hash` (hash of a set of events/aggregates)
- `proof` (null V MVP)

### 6.2 Replayability

- Mode: recalculate to date T; compare two versions of the algorithm; explain the discrepancy (diff components).

---

## 7. Schema BD (Sprint-2)

### 7.1 Raw events

**reputation_events**
- `id`, `subject_type`, `subject_id`, `actor_type`, `actor_id`
- `event_type` (run_completed, order_fulfilled, audit_passed, moderation_penalty, …)
- `value` (float), `meta` (JSONB: run_id, order_id, currency, amount, …)
- `created_at`

Filled in by the worker or when creating domain events.

### 7.2 Graph Aggregates

**relationship_edges_daily**
- `day` (date), `src_type`, `src_id`, `dst_type`, `dst_id`, `edge_type`
- `count`, `amount_sum`, `unique_refs` (distinct orders etc.p.)
- Indexes by (day, src, dst).

### 7.3 Sybil Metrics

**trust_scores**
- `subject_type`, `subject_id`, `trust_score` (0..1)
- `components` (JSONB: reciprocity, cycle, diversity, …)
- `window`, `algo_version`, `computed_at`

### 7.4 Final snapshots

**reputation_snapshots**
- `subject_type`, `subject_id`, `score`, `components` (JSONB)
- `computed_at`, `algo_version`, `window`, `inputs_hash`, `proof` (nullable)

---

## 8. Calculation algorithm (MVP-friendly)

### 8.1 Trust score for the subject (simplified)

- `buyer_diversity = unique_buyers / total_orders` (clamp 0..1).
- `reciprocity = min(1, volume_mutual / volume_total)`.
- `cycle_flag` ∈ {0, 1} — a short cycle was found in window 30d.

Then:
- `sybil_risk = 0.5*reciprocity + 0.4*(1 - buyer_diversity) + 0.7*cycle_flag`
- `trust = clamp(1 - sybil_risk, 0, 1)`.

### 8.2 Quality score by signals

- Normalize quality events to 0..1 (or -1..1).
- Time decay: for example `exp(-age / half_life)`.

### 8.3 Summary

- `final = 100 * clamp(quality * trust, 0, 1)` (quality is the weighted sum of the components).

---

## 9. Policies (how to use reputation)

Reputation itself does not block; blocked by **policies**:

- **Quarantine:** new agent - max listings/day, max turnover/day; up to `trust_score > X` and N unique buyers → expanding limits.
- **Marketplace gating:** role «auditor» at `trust_score > 0.7`; «allocator» at `trust_score > 0.8` + history.
- **Risk impact:** with low trust - higher margin/escrow, lower pool limits, verticals limitation.

---

## 10. API (minimum set)

**Read-only**
- `GET /v1/reputation` — returns **ReputationGetResponse**: snapshot (by subject_type, subject_id, window, algo_version) and optional trust (include_trust, trust_algo_version). Options: subject_type, subject_id, window=90d, algo_version=rep2-v1, include_trust=true, trust_algo_version=trust2-v1.
- `GET /v1/reputation/events` - pagination **opaque cursor** (created_at desc, id desc). Cursor = base64url(JSON + HMAC), secret in `settings.cursor_secret`. Parameters: subject_type, subject_id, limit, cursor.

**Admin/ops**
- `POST /v1/reputation/recompute` (moderator only, idempotent) — window recalculation trigger.

---

## 11. Sprint-2 implementation plan

1. Collect **reputation_events** from domain actions: order created/filled, run completed + evaluation, moderation action.
2. Collect **relationship_edges_daily** (aggregation by orders and ledger).
3. Calculate **trust_score** (F1, F2, F3, F7 minimum).
4. Read **snapshots** (quality × trust).
5. Connect limit policies (quarantine, marketplace gating).

---

## 12. Link to current code

- The existing table `reputations` AND `GET /v1/reputation` remains for backwards compatibility; with the `window=` parameter the response comes from `reputation_snapshots` (otherwise 404 for the window or legacy from `reputations`).
- **Enums:** `app/db/models.py` - `ReputationEventTypeEnum`, `EdgeTypeEnum`; In the database, types are stored as strings.
- **Emission of events (domain hooks):** after `POST /v1/orders` - `emit_reputation_event` (order_fulfilled for the seller) and `upsert_edge_daily` (buyer → seller, order); after run is completed - `emit_reputation_event` (run_completed for strategy_version). Service: `app/services/reputation_events.py`.
- **Watermark v2:** `app/jobs/watermark.py` - `TsIdWatermark(ts, id)`, `get_ts_id_watermark(session, key)`, `set_ts_id_watermark(session, key, wm)`. value stores JSON `{"ts":"...","id":"..."}`. Suitable for any PK (UUID, etc.).
- **Job edges_daily:** `app/jobs/edges_daily_upsert.py` - `upsert_edges_daily_from_orders(session, batch_size=2000, commit=True)`. Watermark key `edges_daily_orders_v2`. Filter: `created_at > wm.ts OR (created_at == wm.ts AND id > wm.id)`, ASC sort. Anti-self-dealing: skipping an edge when buyer_id == seller_id; when Agent.owner_user_id appears - skip if the owner matches.
- **POST /v1/system/jobs/tick** - calls `upsert_edges_daily_from_orders(..., commit=False)`. It is recommended to call once every 1–5 minutes (cron); in production - protect (internal access / secret).
- **Domain hooks (MVP value norms):** `on_order_fulfilled` (seller +1.0), `on_run_completed` (+0.3/-0.3), `on_evaluation_scored` (0..1), `on_moderation_action` (minor -0.2, major -0.8, fraud -1.0). The norms are kept score stable; V recompute quality = clamp(avg(decay-weighted values), 0, 1) * trust.
- **Cursor (opaque):** `app/utils/cursor.py` — encode_cursor/decode_cursor with HMAC (secret from config.cursor_secret).
- **Recalculation worker:** `app/jobs/reputation_recompute.py` - `recompute_for_subject(session, subject_type, subject_id, now=..., commit=True)`. Calculates trust_score (buyer_diversity, reciprocity, cycle_flag) and reputation_snapshot (quality × trust with decay). Algorithm versions: `trust2-v1`, `rep2-v1`. Start: pass `subject_type` And `subject_id` V `POST /v1/reputation/recompute` or call job from the scheduler.
- **Uniqueness:** `trust_scores` And `reputation_snapshots` - by (subject_type, subject_id, window, algo_version); You can keep several versions of the algorithm.
- Anti-self-dealing when ordering is already implemented in `app/api/routers/orders.py` (buyer ≠ owner, no connection via AgentLink). The “one user_id - weight = 0” rule is reinforced in the (identity_cluster / created_by) graph when it appears.
