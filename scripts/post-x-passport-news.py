"""One-shot: post ANCAP passport news to X (OAuth 1.0a). Reads secrets from .env.x only."""
from __future__ import annotations

import json
from pathlib import Path

from requests_oauthlib import OAuth1Session

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env.x"
OUT_PATH = ROOT / "tmp" / "x_passport_tweet.json"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def main() -> None:
    env = load_env(ENV_PATH)
    ck = env.get("X_API_KEY") or env.get("X_CONSUMER_KEY")
    cs = env.get("X_API_SECRET") or env.get("X_CONSUMER_SECRET")
    at = env.get("X_ACCESS_TOKEN")
    ats = env.get("X_ACCESS_TOKEN_SECRET")
    missing = [
        name
        for name, value in (
            ("API_KEY", ck),
            ("API_SECRET", cs),
            ("ACCESS_TOKEN", at),
            ("ACCESS_TOKEN_SECRET", ats),
        )
        if not value
    ]
    if missing:
        raise SystemExit("MISSING " + ",".join(missing))

    text = (
        "Passport: encrypted education docs\n\n"
        "Diplomas & certificates on Digital Passport — ChaCha20-Poly1305 (v2) at rest.\n\n"
        "UI: https://ancap.cloud/passport\n"
        "API: /v1/passports/{id}/education-docs\n\n"
        "On-chain: claim-hash only. No education PII on BSC.\n\n"
        "#ANCAP #ACP #Web3 #Passport"
    )

    session = OAuth1Session(
        ck,
        client_secret=cs,
        resource_owner_key=at,
        resource_owner_secret=ats,
    )

    me = session.get(
        "https://api.twitter.com/2/users/me",
        params={"user.fields": "username"},
    )
    print("ME_STATUS", me.status_code)
    username = env.get("X_USERNAME") or "mr3n3rgy777"
    if me.status_code == 200:
        data = me.json().get("data") or {}
        username = data.get("username") or username
        print("ME_USER", username, data.get("id"))
    else:
        print("ME_BODY", me.text[:500])

    resp = session.post("https://api.twitter.com/2/tweets", json={"text": text})
    print("TWEET_STATUS", resp.status_code)
    body = resp.json() if resp.content else {}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps({"status": resp.status_code, "body": body}, indent=2),
        encoding="utf-8",
    )
    if resp.status_code in (200, 201):
        tid = (body.get("data") or {}).get("id")
        print("TWEET_OK", f"https://x.com/{username}/status/{tid}")
    else:
        print("TWEET_FAIL", json.dumps(body)[:800])


if __name__ == "__main__":
    main()
