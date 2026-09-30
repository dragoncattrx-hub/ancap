"""Unit tests for incremental ACP UTXO index (no live RPC)."""
from __future__ import annotations

from app.services import acp_utxo_index as idx
from app.services.acp_tokenomics import CUSTODIAL_HOT_ADDRESS, GENESIS_TREASURY_ADDRESS


def setup_function(_fn=None):
    with idx._lock:
        idx._state["wm"] = 0
        idx._state["unspent"] = {}
        idx._state["watch"] = {CUSTODIAL_HOT_ADDRESS, GENESIS_TREASURY_ADDRESS}
        idx._state["catchup_inflight"] = False


def test_apply_block_tracks_unspent_for_watched_addresses():
    unspent: dict[str, tuple[str, int]] = {}
    watch = {CUSTODIAL_HOT_ADDRESS, GENESIS_TREASURY_ADDRESS}
    block = {
        "tx": [
            {
                "txid": "aaaa",
                "vin": [],
                "vout": [
                    {"recipient_address": GENESIS_TREASURY_ADDRESS, "amount": "10"},
                    {"recipient_address": CUSTODIAL_HOT_ADDRESS, "amount": "1.5"},
                    {"recipient_address": "acp1qother00000000000000000000000000000000", "amount": "99"},
                ],
            }
        ]
    }
    idx._apply_block(unspent, watch, block)
    assert unspent["aaaa:0"] == (GENESIS_TREASURY_ADDRESS, 1_000_000_000)
    assert unspent["aaaa:1"] == (CUSTODIAL_HOT_ADDRESS, 150_000_000)
    assert "aaaa:2" not in unspent

    spend = {
        "tx": [
            {
                "txid": "bbbb",
                "vin": [{"prev_txid": "aaaa", "vout": 1}],
                "vout": [{"recipient_address": CUSTODIAL_HOT_ADDRESS, "amount": "1.4"}],
            }
        ]
    }
    idx._apply_block(unspent, watch, spend)
    assert "aaaa:1" not in unspent
    assert unspent["bbbb:0"] == (CUSTODIAL_HOT_ADDRESS, 140_000_000)


def test_get_indexed_balance_after_seed_from_out_index():
    out_index = {
        ("tx1", 0): (GENESIS_TREASURY_ADDRESS, 207_643_979_999_999_800),
        ("tx2", 0): (CUSTODIAL_HOT_ADDRESS, 100_000_000_000_000),
    }
    idx.set_watch_addresses([GENESIS_TREASURY_ADDRESS, CUSTODIAL_HOT_ADDRESS])
    idx.seed_from_out_index(out_index, height=100)
    hot = idx.get_indexed_balance(CUSTODIAL_HOT_ADDRESS)
    assert hot is not None
    assert hot["utxo_count"] == 1
    assert hot["acp"].startswith("1000000")
    assert hot["source"] == "utxo_index"
    assert hot["chain_height"] == 100
    genesis = idx.get_indexed_balance(GENESIS_TREASURY_ADDRESS)
    assert genesis is not None
    assert genesis["utxo_count"] == 1
