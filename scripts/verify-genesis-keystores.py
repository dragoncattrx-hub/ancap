#!/usr/bin/env python3
"""Verify genesis-addresses.json matches keystore manifest and optional on-disk keystores."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
GENESIS_PATH = REPO_ROOT / "ACP-crypto" / "genesis-addresses.json"
MANIFEST_PATH = REPO_ROOT / "ACP-crypto" / "genesis-keystore-manifest.json"
CHECKSUMS_PATH = REPO_ROOT / "ACP-crypto" / "genesis-keystore-checksums.sha256"


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def verify_manifest_alignment() -> list[str]:
    errors: list[str] = []
    genesis = _load_json(GENESIS_PATH)
    manifest = _load_json(MANIFEST_PATH)
    if not isinstance(genesis, list) or not isinstance(manifest, dict):
        return ["genesis-addresses.json or manifest has invalid shape"]

    buckets = manifest.get("buckets") or []
    by_role = {str(e.get("role")): e for e in genesis if isinstance(e, dict)}

    for bucket in buckets:
        if not isinstance(bucket, dict):
            errors.append("manifest bucket entry is not an object")
            continue
        role = str(bucket.get("role") or "")
        expected_addr = str(bucket.get("address") or "").strip()
        genesis_entry = by_role.get(role)
        if genesis_entry is None:
            errors.append(f"manifest role missing from genesis-addresses.json: {role}")
            continue
        genesis_addr = str(genesis_entry.get("address") or "").strip()
        if genesis_addr != expected_addr:
            errors.append(
                f"address mismatch for {role}: genesis={genesis_addr} manifest={expected_addr}"
            )
    return errors


def verify_keystore_files(keystore_dir: Path, walletd_cmd: str) -> list[str]:
    errors: list[str] = []
    manifest = _load_json(MANIFEST_PATH)
    for bucket in manifest.get("buckets") or []:
        if not isinstance(bucket, dict):
            continue
        ks_name = str(bucket.get("keystore_file") or "")
        expected = str(bucket.get("address") or "")
        ks_path = keystore_dir / ks_name
        if not ks_path.exists():
            errors.append(f"missing keystore file: {ks_path}")
            continue
        out = subprocess.run(
            [walletd_cmd, "address", "--keystore-file", str(ks_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if out.returncode != 0:
            errors.append(f"walletd failed for {ks_path}: {(out.stderr or out.stdout).strip()}")
            continue
        try:
            payload = json.loads(out.stdout)
        except json.JSONDecodeError:
            errors.append(f"walletd returned non-JSON for {ks_path}")
            continue
        result = payload.get("result") if isinstance(payload, dict) else payload
        derived = str((result or {}).get("address") or "").strip()
        if derived != expected:
            errors.append(f"keystore address mismatch for {ks_name}: derived={derived} expected={expected}")
    return errors


def write_checksums(keystore_dir: Path) -> None:
    manifest = _load_json(MANIFEST_PATH)
    lines: list[str] = []
    for bucket in manifest.get("buckets") or []:
        if not isinstance(bucket, dict):
            continue
        ks_name = str(bucket.get("keystore_file") or "")
        ks_path = keystore_dir / ks_name
        if not ks_path.exists():
            continue
        digest = _sha256_file(ks_path)
        lines.append(f"{digest}  {ks_name}")
    CHECKSUMS_PATH.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
    print(f"Wrote {CHECKSUMS_PATH}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify genesis keystore manifest alignment")
    parser.add_argument("--keystore-dir", help="Directory with *.keystore.json files for walletd verify")
    parser.add_argument("--walletd", default="walletd", help="walletd binary (default: walletd)")
    parser.add_argument("--write-checksums", action="store_true", help="Write genesis-keystore-checksums.sha256")
    args = parser.parse_args()

    errors = verify_manifest_alignment()
    if args.keystore_dir:
        errors.extend(verify_keystore_files(Path(args.keystore_dir), args.walletd))
    if args.write_checksums and args.keystore_dir:
        write_checksums(Path(args.keystore_dir))

    if errors:
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        return 1

    print("OK: genesis keystore manifest aligned")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
