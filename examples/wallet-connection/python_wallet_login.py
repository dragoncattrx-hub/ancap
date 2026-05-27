from __future__ import annotations

import os
import sys
from typing import Any

import httpx
from eth_account import Account
from eth_account.messages import encode_defunct


API_BASE = os.environ.get("ANCAP_API_BASE", "http://127.0.0.1:8001/v1").rstrip("/")
PRIVATE_KEY = os.environ.get("ANCAP_EVM_PRIVATE_KEY", "").strip()
CHAIN_ID = int(os.environ.get("ANCAP_CHAIN_ID", "56") or "56")
DOMAIN = os.environ.get("ANCAP_WALLET_DOMAIN", "ancap.cloud").strip() or "ancap.cloud"
URI = os.environ.get("ANCAP_WALLET_URI", "https://ancap.cloud/login").strip() or "https://ancap.cloud/login"
TURNSTILE_TOKEN = os.environ.get("ANCAP_TURNSTILE_TOKEN", "").strip()


def require_env() -> None:
    if not PRIVATE_KEY:
        raise SystemExit("ANCAP_EVM_PRIVATE_KEY is required")


def post_json(client: httpx.Client, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = client.post(f"{API_BASE}{path}", json=payload)
    response.raise_for_status()
    return response.json()


def get_json(client: httpx.Client, path: str, token: str) -> dict[str, Any]:
    response = client.get(f"{API_BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    return response.json()


def main() -> int:
    require_env()
    signer = Account.from_key(PRIVATE_KEY)
    address = signer.address

    with httpx.Client(timeout=20.0) as client:
        challenge = post_json(
            client,
            "/auth/wallet/nonce",
            {
                "address": address,
                "chain_id": CHAIN_ID,
                "domain": DOMAIN,
                "uri": URI,
                **({"turnstile_token": TURNSTILE_TOKEN} if TURNSTILE_TOKEN else {}),
            },
        )

        message = challenge["message"]
        signed = Account.sign_message(encode_defunct(text=message), private_key=PRIVATE_KEY)
        signature = signed.signature.hex()

        verified = post_json(
            client,
            "/auth/wallet/verify",
            {
                "challenge_id": challenge["challenge_id"],
                "address": address,
                "signature": signature,
            },
        )
        token = verified["access_token"]
        me = get_json(client, "/users/me", token)

        print("Wallet auth succeeded:")
        print(f"  address: {address}")
        print(f"  challenge_id: {challenge['challenge_id']}")
        print(f"  user_id: {me['id']}")
        print(f"  email: {me['email']}")
        print(f"  display_name: {me.get('display_name')}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except httpx.HTTPStatusError as exc:
        body = exc.response.text.strip()
        print(f"API error {exc.response.status_code}: {body}", file=sys.stderr)
        raise SystemExit(1) from exc
