"""Genesis keystore manifest must match genesis-addresses.json and backend constants."""

from __future__ import annotations

import json
from pathlib import Path

from app.services.acp_tokenomics import (
    CREATOR_BUCKET_ADDRESS,
    ECOSYSTEM_BUCKET_ADDRESS,
    PUBLIC_BUCKET_ADDRESS,
    VALIDATOR_BUCKET_ADDRESS,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
GENESIS_PATH = REPO_ROOT / "ACP-crypto" / "genesis-addresses.json"
MANIFEST_PATH = REPO_ROOT / "ACP-crypto" / "genesis-keystore-manifest.json"


def _load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def test_genesis_addresses_match_manifest_and_backend():
    genesis = _load(GENESIS_PATH)
    manifest = _load(MANIFEST_PATH)
    assert isinstance(genesis, list)
    assert isinstance(manifest, dict)

    by_role = {str(e["role"]): str(e["address"]) for e in genesis}
    backend = {
        "Creator (vesting 7 years)": CREATOR_BUCKET_ADDRESS,
        "Validator Emission Reserve": VALIDATOR_BUCKET_ADDRESS,
        "Public & Liquidity": PUBLIC_BUCKET_ADDRESS,
        "Ecosystem Grants": ECOSYSTEM_BUCKET_ADDRESS,
    }

    for bucket in manifest["buckets"]:
        role = bucket["role"]
        addr = bucket["address"]
        assert by_role[role] == addr
        assert backend[role] == addr

    superseded = manifest.get("superseded_addresses") or {}
    assert superseded.get("ecosystem") == "acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5"


def test_verify_genesis_script_passes_manifest_alignment():
    import subprocess
    import sys

    r = subprocess.run(
        [sys.executable, str(REPO_ROOT / "scripts" / "verify-genesis-keystores.py")],
        capture_output=True,
        text=True,
        cwd=str(REPO_ROOT),
        check=False,
    )
    assert r.returncode == 0, r.stderr or r.stdout
