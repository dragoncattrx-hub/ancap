#!/usr/bin/env python3
"""Upload canonical keystore files to production Sicret via ssh stdin."""
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "ACP-crypto" / "genesis-keystore-manifest.json"
REMOTE_DIR = "/opt/ancap-migration/current/Sicret"
LOCAL_SOURCES = {
    "creator.keystore.json": Path(r"C:\Users\drago\Desktop\ACP\wallets\creator.keystore.json"),
    "validator-reserve.keystore.json": Path(r"C:\Users\drago\Desktop\ACP\wallets\validator-reserve.keystore.json"),
    "public-liquidity.keystore.json": Path(r"C:\Users\drago\Desktop\ACP\wallets\public-liquidity.keystore.json"),
    "custodial-hot.keystore.json": Path(r"C:\Users\drago\Desktop\Sicret\wallets-canonical\custodial-hot.keystore.json"),
    "ecosystem-grants.keystore.json": Path(r"C:\Users\drago\Desktop\Sicret\wallets-canonical\ecosystem-grants.keystore.json"),
}
CHECKSUMS_README = REPO_ROOT / "ACP-crypto" / "GENESIS_KEYSTORE_README.md"


def upload(local: Path, remote_name: str) -> str:
    if not local.exists():
        print(f"skip missing {local}")
        return ""
    remote = f"{REMOTE_DIR}/{remote_name}"
    payload = local.read_bytes()
    digest = hashlib.sha256(payload).hexdigest()
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", f"cat > {remote} && chmod 600 {remote} && ls -la {remote}"],
        input=payload,
        capture_output=True,
        timeout=120,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).decode("utf-8", errors="replace").strip())
    print(r.stdout.decode("utf-8", errors="replace").strip())
    return digest


def write_checksum_readme(digests: dict[str, str]) -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    lines = [
        "# Genesis keystore checksums (operator)",
        "",
        "SHA-256 of keystore JSON files uploaded to Sicret. Regenerate after keystore rotation.",
        "",
        "| Bucket | Address | Keystore | SHA-256 |",
        "|---|---|---|---|",
    ]
    for bucket in manifest.get("buckets") or []:
        ks = str(bucket.get("keystore_file") or "")
        digest = digests.get(ks, "—")
        lines.append(
            f"| {bucket.get('key')} | `{bucket.get('address')}` | `{ks}` | `{digest}` |"
        )
    CHECKSUMS_README.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {CHECKSUMS_README}")


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    digests: dict[str, str] = {}
    for bucket in manifest.get("buckets") or []:
        ks_name = str(bucket.get("keystore_file") or "")
        local = LOCAL_SOURCES.get(ks_name)
        if local is None:
            continue
        print(f"upload {ks_name}")
        digest = upload(local, ks_name)
        if digest:
            digests[ks_name] = digest
    write_checksum_readme(digests)


if __name__ == "__main__":
    main()
