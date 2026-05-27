# ANCAP Public Integration Examples

These examples are public-safe reference integrations for the open-source / GitHub transparency track.

They are intentionally small and focus on real ANCAP surfaces that external integrators can call without exposing private infrastructure internals.

## Included examples

- `payment-integration/` — create and poll a Stripe-backed ANCAP credit top-up intent through the public API.
- `wallet-connection/` — request a wallet auth challenge, sign it locally, verify it, and confirm the authenticated session.

## Safety rules

- Never commit real private keys, Stripe secrets, bearer tokens, or production `.env` files.
- Use test credentials or isolated staging users when validating flows.
- These examples target publishable API behavior only; bridge signer internals, hot-wallet operations, and production secrets stay private.

## Runtime expectations

The Python examples use:

- `httpx`
- `eth-account` (wallet example only)

Both are already present in the main backend dependency set used by this repo.
