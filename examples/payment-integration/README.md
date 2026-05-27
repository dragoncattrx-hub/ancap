# Example Payment Integration

Minimal ANCAP credit top-up flow using the Stripe adapter.

What it demonstrates:

1. authenticate with an ANCAP bearer token;
2. list available credit packages;
3. create a Stripe-backed top-up intent for a package;
4. poll the created intent until it reaches a terminal state.

## Files

- `python_credit_topup.py` — runnable Python CLI example

## Environment

- `ANCAP_API_BASE` — default `http://127.0.0.1:8001/v1`
- `ANCAP_BEARER_TOKEN` — required user token
- optional `ANCAP_PACKAGE_SLUG` — default `launch-credits`
- optional `ANCAP_CURRENCY` — default `USD`

## Run

```bash
python examples/payment-integration/python_credit_topup.py
```

## Notes

- The example only creates and polls the ANCAP-side payment intent. Actual card confirmation happens in the frontend / Stripe.js flow.
- Current supported Stripe currencies in ANCAP are `USD` and `EUR`.
- If Stripe is unconfigured, the API fails closed with `503` and ACP/manual flows remain available.
