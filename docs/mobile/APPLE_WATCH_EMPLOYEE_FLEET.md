# ANCAP — Apple Watch Employee Heartbeat Fleet

> Status: planned track | Added: 2026-09-06  
> Goal: sync Apple Watch with the ANCAP mobile/org stack so employers can **continuously observe employee heart rate** during shifts, issue **3 watches per worker** (distinct bands), and enforce a **charge/rotation schedule**.  
> Links: `docs/mobile/ROADMAP.md` Phase 5.6 · Master priority **R10** · Related: org identity / Biohax NFC (`docs/mobile/BIOHAX_NFC.md`)

## Product thesis

For high-trust workplaces (ops, security, field, treasury desks), ANCAP orgs need a **wearable presence + vitals** signal that:

1. Proves the assigned worker is on shift (paired device + biometric continuity).
2. Streams / batches **heart rate (HR)** and optional HRV into an org safety dashboard.
3. Survives **battery limits** via a **3-watch rotation** (A/B/C bands) with mandatory swap windows for charging.

This is an **opt-in, consent-gated, org-policy** feature — not a covert surveillance channel.

## Fleet model: 3 watches per employee

| Slot | Band (example) | Role |
|------|----------------|------|
| Watch A | e.g. black / graphite | Active on-shift |
| Watch B | e.g. blue | Charging / standby |
| Watch C | e.g. orange | Charging / spare / cold reserve |

- Each physical Watch is an inventory asset: serial / UDID, band color code, employee assignment, status (`active` | `charging` | `spare` | `lost` | `maintenance`).
- Exactly **one** watch may be `active` per employee at a time (policy-enforced).
- Swap prompts fire before battery SLA breach (default target: swap every **4–6 hours** on-shift, configurable per org).

### Recommended rotation (default policy)

```text
Shift 08:00–20:00 (example 12h)
  08:00  put on A (full charge)     B+C on chargers
  12:00  swap A→B                   A to charger
  16:00  swap B→C                   B to charger
  20:00  end shift; all to charge   overnight full recharge
```

Orgs can set `rotation_interval_minutes` (e.g. 240), `min_soc_percent` (e.g. 25%), and `grace_minutes` before escalation.

## Platform constraints (Apple)

- Continuous HR needs an **Apple Watch app** (watchOS) + **iPhone companion** (HealthKit).
- Expo/React Native alone cannot fully replace a native Watch extension — plan a **watchOS companion target** (Swift) + RN bridge / Expo module for phone sync.
- Background delivery: HealthKit background delivery + Watch workout / mindful session policies as allowed by Apple; document App Store / employment-use review risk.
- Pairing is Apple ID / Watch–iPhone bound; ANCAP maps **device attestation + employee org membership**, not raw Apple ID sharing across three watches without care — each Watch should be set up under managed Apple IDs / DEP-style fleet where possible.

## Privacy & compliance (must-ship with MVP)

- Explicit **employee consent** screen + org policy acknowledgment.
- Purpose limitation: safety / shift fitness / emergency — not marketing.
- Data minimization: HR bpm + timestamps + device id; no raw ECG dump in v1 unless medically justified and licensed.
- Retention TTL, export/delete on offboarding.
- Region flags (EU GDPR / labor rules): works council / local law checklist in compliance matrix.
- Alerting thresholds configurable; medical diagnosis claims **forbidden** in product copy.

## Phased delivery

### W0 — Spec & policy `[x]`

- Domain: `WatchAsset`, `WatchAssignment`, `WatchRotationPolicy`, `HeartRateSample`, `VitalsAlert`, `ConsentRecord`.
- Org settings: enable flag, rotation interval, SOC floor, who can view HR (owner/admin/safety role only).
- Legal copy + consent templates (EN/RU/UK/DE).

### W1 — Backend inventory + rotation API `[~]`

- Tables + Alembic migration `058` (`watch_assets`, `watch_rotation_policies`, `watch_heart_rate_samples`).
- APIs (org-gated) under `/organizations/{id}/watch-fleet/*`:
  - `POST/GET .../watches` — register devices per member (3 slots a/b/c)
  - `POST .../watches/rotate` — mark active / charging via slot swap
  - `PUT/GET .../rotation-policy`
  - `GET .../vitals/heartbeat` — latest + windowed series
  - `POST .../vitals/heartbeat/ingest` — phone/gateway batch upload
  - `GET .../summary`
- Alerts: missed swap, low SOC, HR gap > N minutes while `on_shift=true` (deferred).

### W2 — iPhone app sync (ACP Wallet / org module) `[ ]`

- HealthKit read (HR) after permission.
- Background sync when Watch samples arrive on phone.
- In-app **rotation coach**: which band is active, countdown to swap, charger checklist.
- Link active Watch asset id to org session / NFC step-up (optional compose with Biohax).

### W3 — watchOS companion `[ ]`

- Native Watch app: periodic HR sampling, complication showing “swap in Xm”, haptics on swap due.
- Offline buffer → flush to iPhone.
- Distinct face/complication color hint matching band slot A/B/C.

### W4 — Org safety dashboard `[ ]`

- Web: live/near-live HR tiles per on-shift member, gaps, rotation compliance %.
- Escalation webhooks / Telegram ops channel (reuse OpenClaw/ops patterns only if org opts in).
- Export CSV for audit (role-gated).

### W5 — Fleet ops hardening `[ ]`

- MDM / Apple Business Manager notes; lost mode workflow.
- Battery analytics → tune default rotation interval per site.
- Optional geofenced shift detection (coarse) — separate consent.

## Acceptance criteria (MVP = W1+W2)

- [ ] Each employee can be assigned exactly 3 watch assets with distinct band codes
- [ ] Only one watch `active`; rotation API + UI enforce schedule
- [ ] HR samples ingest with employee + watch + timestamp; org admin can view with consent flag true
- [ ] Missed-rotation and HR-gap alerts fire
- [ ] Consent revoke stops ingest and hides historical series per policy
- [ ] Docs + compliance matrix row updated
- [ ] Targeted tests for rotation state machine

## Non-goals (v1)

- Medical certification / clinical ECG product
- Android Wear parity (track later)
- Covert monitoring without consent UI
- Sharing one Apple ID casually across three watches without fleet process

## Sequencing

| Depends on | Notes |
|------------|--------|
| Org membership + roles | Already in backend |
| Mobile unlock / device trust | PIN / biometrics / optional NFC |
| After or parallel P5.5 Biohax | Both are workplace trust factors |

Does **not** block ACP wallet send/sign FFI closure; ship behind org feature flag `apple_watch_vitals`.

## Open decisions

1. Managed Apple IDs vs BYOD three-watch kits.
2. Default rotation: clock-interval vs battery-SOC-first.
3. Minimum iOS / watchOS versions.
4. Whether HR is visible to employee self only vs safety officers.
