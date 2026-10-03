"""Classify universal explorer search queries."""
from __future__ import annotations

import re

_HEX64 = re.compile(r"^[0-9a-fA-F]{64}$")
_HEIGHT = re.compile(r"^\d{1,12}$")


def classify_explorer_query(raw: str) -> dict:
    q = (raw or "").strip()
    if not q:
        return {
            "query": q,
            "type": "unknown",
            "id": None,
            "canonical_path": None,
            "notes": ["empty query"],
        }
    if q.lower().startswith("acp1") and len(q) >= 20:
        return {
            "query": q,
            "type": "address",
            "id": q,
            "canonical_path": f"/explorer/address/{q}",
            "notes": [],
        }
    if _HEIGHT.match(q):
        return {
            "query": q,
            "type": "block_height",
            "id": str(int(q)),
            "canonical_path": f"/explorer/block/{int(q)}",
            "notes": [],
        }
    if _HEX64.match(q):
        # Ambiguous until RPC resolve; prefer tx path, API may refine.
        low = q.lower()
        return {
            "query": q,
            "type": "tx",
            "id": low,
            "canonical_path": f"/explorer/tx/{low}",
            "notes": ["hex64: try as txid; use /search resolve for block_hash fallback"],
        }
    return {
        "query": q,
        "type": "unknown",
        "id": None,
        "canonical_path": None,
        "notes": ["unrecognized query shape"],
    }
