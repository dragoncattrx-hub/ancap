#!/usr/bin/env python3
"""Upload local keystore files to production Sicret via ssh base64."""
from __future__ import annotations

import subprocess
from pathlib import Path

FILES = [
    (Path(r"C:\Users\drago\Desktop\ACP\wallets\creator.keystore.json"), "creator.keystore.json"),
    (Path(r"C:\Users\drago\Desktop\ACP\wallets\validator-reserve.keystore.json"), "validator-reserve.keystore.json"),
    (Path(r"C:\Users\drago\Desktop\Sicret\wallets-canonical\custodial-hot.keystore.json"), "custodial-hot.keystore.json"),
]
REMOTE_DIR = "/opt/ancap-migration/current/Sicret"


def upload(local: Path, remote_name: str) -> None:
    if not local.exists():
        print(f"skip missing {local}")
        return
    remote = f"{REMOTE_DIR}/{remote_name}"
    payload = local.read_bytes()
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", f"cat > {remote} && chmod 600 {remote} && ls -la {remote}"],
        input=payload,
        capture_output=True,
        timeout=120,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).decode("utf-8", errors="replace").strip())
    print(r.stdout.decode("utf-8", errors="replace").strip())


def main() -> None:
    for local, name in FILES:
        print(f"upload {name}")
        upload(local, name)


if __name__ == "__main__":
    main()
