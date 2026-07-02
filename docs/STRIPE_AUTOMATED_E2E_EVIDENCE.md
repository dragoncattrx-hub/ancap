# Stripe Automated E2E Evidence — Repo Testmode

> Status: automated closure evidence | Updated: 2026-07-02
> Related: `docs/stripe-verification-2026-07-02.md`, `tests/api/test_payments.py`

## Scope

This packet documents the **repo-verified** Stripe payment → webhook → ledger path exercised in CI/local pytest. It does **not** replace live Stripe Dashboard / webhook delivery verification against configured production secrets.

## Automated test command

```bash
pytest tests/api/test_payments.py -q
```

## Primary webhook E2E test

`test_stripe_webhook_captures_credit_topup_once` verifies:

1. Authenticated user creates Stripe top-up intent (`POST /v1/payments/stripe/intent`)
2. Signed webhook event `payment_intent.succeeded` is accepted (`POST /v1/webhooks/stripe`)
3. Payment intent transitions to `captured` with `credited == true`
4. Provider payload records real-style webhook metadata (`stripe_last_event_id`, `stripe_last_event_type`, `stripe_last_event_at`)
5. Duplicate webhook delivery is idempotent (second delivery does not double-credit)
6. User ledger balance increases by expected ACP amount

## Additional repo coverage

| Test | Coverage |
|---|---|
| `test_create_and_get_stripe_payment_intent_route` | Intent create + fetch contract |
| `test_create_stripe_payment_intent_is_idempotent` | Idempotency-Key reuse |
| `test_stripe_webhook_requires_configured_secret` | Fail-closed without webhook secret |
| `test_stripe_webhook_rejects_invalid_signature` | Signature verification |
| `test_stripe_webhook_marks_terminal_failure_states` | Failure event handling |
| Saved-card route tests | Payment method list/detach + saved-card intent metadata |

## Result (2026-07-02)

- Command: `pytest tests/api/test_payments.py -q`
- Result: **33 passed** (full payments module including Stripe suite)
- Verdict: **Repo automated Stripe E2E closed** for webhook-confirmed capture path in testmode mocks

## Remaining operator closure (live)

Before marking roadmap item `4.1` fully done:

- [ ] Live/testmode Stripe Dashboard checkout with configured repo secrets
- [ ] Delivered `payment_intent.succeeded` webhook to public endpoint (not only TestClient)
- [ ] Saved-card reuse run with persisted Stripe customer
- [ ] Fill Run B in `docs/stripe-verification-2026-07-02.md`
