# Example Wallet Connection Flow

Minimal Sign-In with Wallet style flow for ANCAP.

What it demonstrates:

1. request a wallet auth challenge from `/v1/auth/wallet/nonce`;
2. sign the returned ANCAP login message locally with an EVM private key;
3. verify the signature with `/v1/auth/wallet/verify`;
4. call `/v1/users/me` with the returned bearer token.

## Files

- `python_wallet_login.py` — runnable Python CLI example

## Environment

- `ANCAP_API_BASE` — default `http://127.0.0.1:8001/v1`
- `ANCAP_EVM_PRIVATE_KEY` — required local test key used only for signing the example challenge
- optional `ANCAP_CHAIN_ID` — default `56`
- optional `ANCAP_WALLET_DOMAIN` — default `ancap.cloud`
- optional `ANCAP_WALLET_URI` — default `https://ancap.cloud/login`

## Run

```bash
python examples/wallet-connection/python_wallet_login.py
```

## Notes

- This example is for local testing only. Do not use a funded production key.
- The ANCAP wallet auth message is an off-chain signature request. No blockchain transaction is sent.
- The API also supports wallet linking through `/v1/auth/wallet/link` once a user is already authenticated.
