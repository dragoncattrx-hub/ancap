# Stripe Verification Evidence Packet

> Status: generated scaffold from template | Added: 2026-06-01
> Roadmap link: `MASTER_ROADMAP.md` → 4.1
> Companion docs: `docs/STRIPE_VERIFICATION_RUNBOOK.md`, `docs/STATUS_MATRIX.md`
> Purpose: turn the remaining Stripe webhook/saved-card closure work into a copy-ready evidence packet instead of loose operator notes.

Important truth:

- This file is a **template**, not completed verification evidence.
- Do **not** mark roadmap item `4.1 Stripe / fiat payment gateway` done until a filled copy proves both a webhook-confirmed new-card run and a saved-card reuse run.
- A `poll fallback` capture is useful resilience evidence, but **not** final roadmap closure by itself.
- Keep secrets out of the evidence packet. Do not store full client secrets, webhook secrets, or card numbers.

## How to use

1. Copy this template to a dated working file for the current Stripe verification round.
2. Fill one section for the webhook-confirmed new-card run and one section for the saved-card reuse run.
3. Link screenshots, API JSON, and dashboard evidence with redaction notes instead of pasting secrets.
4. If a run only proves `poll fallback`, record it plainly as partial progress and keep item 4.1 open.

Suggested copy names:

- `docs/stripe-verification-YYYY-MM-DD.md`
- `docs/stripe-verification-testmode-rc1.md`
- `docs/stripe-verification-prodlike-YYYY-MM-DD.md`

Operational note:
- `scripts/generate_stripe_verification_packet.py` refreshes the stable alias `docs/stripe-verification-latest.md` by default so the newest packet has a fixed handoff path, but keep the dated file as the evidence-of-record.

## Verification round metadata

- Date: 2026-06-04
- Operator: ARDO
- Commit SHA: dd2cec30842d0e7d6090b02683d099c6c2eed755
- Environment: local prod-like
- API base URL: http://127.0.0.1:8080/api/v1
- Wallet UI URL: http://127.0.0.1:8080/wallet/credits
- Stripe mode: test
- Webhook delivery path: pending live webhook verification
- Authenticated test user id/email: 
- Package slug: launch-credits
- Fiat amount / currency: 
- Expected ACP credit amount: 
- Notes: Scaffold packet generated during roadmap cron pass; real webhook-confirmed new-card and saved-card evidence still pending.

## Run A — New-card checkout with webhook confirmation

- ANCAP payment intent id:
- Stripe PaymentIntent id:
- Stripe customer id (if known):
- Payment method path: new card
- Save-for-reuse requested: yes / no
- Card evidence (brand + last4 only):
- Ledger balance before:
- Ledger balance after:
- Final ANCAP item status:
- Final Stripe status:

| Check | Result (`pass` / `fail` / `blocked`) | Evidence / screenshot / JSON path | Notes |
|---|---|---|---|
| `POST /v1/payments/stripe/intent` returned `201` |  |  |  |
| Stripe checkout completed successfully |  |  |  |
| Stripe shows delivered `payment_intent.succeeded` webhook |  |  |  |
| `POST /v1/webhooks/stripe` accepted the event |  |  |  |
| `GET /v1/payments/stripe/intents/{id}` shows `item.status == "captured"` |  |  |  |
| `GET /v1/payments/stripe/intents/{id}` shows `credited == true` |  |  |  |
| `provider_payload.stripe_last_event_id` is a real `evt_...` id |  |  |  |
| `Settlement signal` shows `webhook` |  |  |  |
| `Verification status` shows `webhook delivery confirmed` |  |  |  |
| `Payment method evidence` shows `new card` |  |  |  |
| User ledger balance increased by expected ACP amount |  |  |  |

Poll-fallback note for this run:
- Was poll fallback needed before webhook evidence arrived? yes / no
- If yes, keep item 4.1 open until the webhook-confirmed path is also captured.

## Run B — Saved-card reuse verification

- ANCAP payment intent id:
- Stripe PaymentIntent id:
- Stripe customer id:
- Payment method path: saved card
- Requested saved payment method id:
- Saved card evidence (brand + last4 only):
- Ledger balance before:
- Ledger balance after:
- Final ANCAP item status:
- Final Stripe status:

| Check | Result (`pass` / `fail` / `blocked`) | Evidence / screenshot / JSON path | Notes |
|---|---|---|---|
| `GET /v1/payments/methods` lists the reusable saved card |  |  |  |
| Second top-up was started with a saved payment method |  |  |  |
| Stripe checkout completed successfully |  |  |  |
| Stripe shows delivered `payment_intent.succeeded` webhook |  |  |  |
| `GET /v1/payments/stripe/intents/{id}` shows `item.status == "captured"` |  |  |  |
| `GET /v1/payments/stripe/intents/{id}` shows `credited == true` |  |  |  |
| `Settlement signal` shows `webhook` or other terminal evidence |  |  |  |
| `Verification status` is recorded honestly |  |  |  |
| `Payment method evidence` shows `saved card` |  |  |  |
| Saved-method id / save-for-reuse flag matches the intended path |  |  |  |
| User ledger balance increased by expected ACP amount |  |  |  |

## Negative-path spot checks

| Check | Result (`pass` / `fail` / `blocked` / `n/a`) | Evidence / screenshot / JSON path | Notes |
|---|---|---|---|
| Unsupported currency (`GBP`) returns `400` |  |  |  |
| Invalid Stripe webhook signature is rejected |  |  |  |
| Foreign saved payment method is rejected |  |  |  |

## Evidence inventory

List the redacted artifacts captured for this verification round:

- Stripe dashboard / Stripe CLI webhook delivery evidence:
- ANCAP API JSON snapshots:
- Wallet UI screenshots:
- Ledger before/after evidence:
- Saved-card listing evidence:
- Additional logs / notes:

## Closure summary

- New-card webhook-confirmed run completed: yes / no
- Saved-card reuse run completed: yes / no
- Any run depended only on poll fallback: yes / no
- Final roadmap status for item 4.1: keep `[~]` / mark `[x]`
- Remaining blocker if still open:
- Safe wording for roadmap/status update:

## Sign-off

- What was proven:
- What is still unproven:
- Next required action:
- Approved by:
## Packet bootstrap metadata
- Generated at (UTC): `2026-06-04T00:37:08Z`
- Source template: `docs/STRIPE_VERIFICATION_EVIDENCE_TEMPLATE.md`
- Output path: `docs/stripe-verification-2026-06-04.md`
- Latest alias path: `docs/stripe-verification-latest.md`
- Generator: `scripts/generate_stripe_verification_packet.py`
- Generator repo HEAD: `master` @ `dd2cec30842d0e7d6090b02683d099c6c2eed755` (dirty working tree)
- Reminder: this packet is prefilled scaffolding only. Keep roadmap item `4.1 Stripe / fiat payment gateway` open until a real webhook-confirmed new-card run and a real saved-card reuse run are both evidenced here.
