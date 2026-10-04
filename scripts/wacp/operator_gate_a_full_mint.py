#!/usr/bin/env python3
"""Operator-only: raise caps → mintWrapped(full Gate A) → restore caps.

Requires:
  GATE_A_MINT_CONFIRM=YES
  BRIDGE_BSC_RPC_URL
  BRIDGE_BSC_PRIVATE_KEY  (gateway owner)

Agent/CI must not set GATE_A_MINT_CONFIRM. Run on operator host only.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

from eth_account import Account
from eth_utils import keccak
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from app.services.bridge_decimal import acp_smallest_to_wacp_wei  # noqa: E402
from app.services.wacp_mint_envelope import compute_mint_envelope  # noqa: E402

RECIPIENT = Web3.to_checksum_address("0x396351dF6420e6089dC67F4CBdDc717f34fFB2e4")
GATEWAY = Web3.to_checksum_address("0x57c24FF77B23a82328cb88914D4FD4EEBd93321b")
DEPOSIT_REF = keccak(text="gate-a-cutover-2026-10-04-full")

GW_ABI = [
    {"inputs": [], "name": "maxSingleMint", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "mintCapPerDay", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "paused", "outputs": [{"type": "bool"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "owner", "outputs": [{"type": "address"}], "stateMutability": "view", "type": "function"},
    {
        "inputs": [{"name": "maxSingle", "type": "uint256"}, {"name": "perDay", "type": "uint256"}],
        "name": "setCaps",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "depositRef", "type": "bytes32"},
        ],
        "name": "mintWrapped",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


def _send(w3: Web3, acct: Account, fn) -> str:
    tx = fn.build_transaction(
        {
            "from": acct.address,
            "nonce": w3.eth.get_transaction_count(acct.address),
            "gas": 350_000,
            "maxFeePerGas": w3.to_wei(3, "gwei"),
            "maxPriorityFeePerGas": w3.to_wei(1, "gwei"),
            "chainId": 56,
        }
    )
    signed = acct.sign_transaction(tx)
    raw = getattr(signed, "raw_transaction", None) or signed.rawTransaction
    h = w3.eth.send_raw_transaction(raw)
    receipt = w3.eth.wait_for_transaction_receipt(h, timeout=180)
    if receipt.status != 1:
        raise SystemExit(f"tx failed: {h.hex()}")
    return h.hex()


def main() -> int:
    if os.environ.get("GATE_A_MINT_CONFIRM") != "YES":
        print("Refusing: set GATE_A_MINT_CONFIRM=YES (operator-only).", file=sys.stderr)
        return 2

    prep_path = Path(os.environ.get("GATE_A_PREP_JSON", "/tmp/gate-a-prep.json"))
    if prep_path.exists():
        prep = json.loads(prep_path.read_text(encoding="utf-8"))
        m_wei = int(prep["M_wacp_wei"])
        prev_single = int(prep["maxSingleMint_before"])
        prev_day = int(prep["mintCapPerDay_before"])
    else:
        import urllib.request

        with urllib.request.urlopen(
            os.environ.get("GATE_A_PROOF_URL", "https://api.ancap.cloud/v1/wacp/reserve-proof"),
            timeout=30,
        ) as resp:
            proof = json.loads(resp.read().decode())
        env = compute_mint_envelope(
            acp_reserve_balance_smallest=proof.get("acp_reserve_balance_smallest"),
            wacp_total_supply_acp_smallest=proof.get("wacp_total_supply_acp_smallest"),
            operational_buffer_smallest=proof.get("operational_buffer_smallest"),
        )
        if not env.gate_a_pass or env.max_additional_mint_acp_smallest <= 0:
            raise SystemExit("Gate A failed")
        m_wei = acp_smallest_to_wacp_wei(env.max_additional_mint_acp_smallest)
        prev_single = prev_day = None  # filled below

    rpc = os.environ["BRIDGE_BSC_RPC_URL"]
    pk = os.environ["BRIDGE_BSC_PRIVATE_KEY"]
    if not pk.startswith("0x"):
        pk = "0x" + pk
    w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 60}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    acct = Account.from_key(pk)
    gw = w3.eth.contract(address=GATEWAY, abi=GW_ABI)

    owner = gw.functions.owner().call()
    if owner.lower() != acct.address.lower() or acct.address.lower() != RECIPIENT.lower():
        raise SystemExit(f"signer/owner mismatch: signer={acct.address} owner={owner}")
    if gw.functions.paused().call():
        raise SystemExit("gateway is paused on-chain")

    if prev_single is None:
        prev_single = gw.functions.maxSingleMint().call()
        prev_day = gw.functions.mintCapPerDay().call()

    print(f"mint_wei={m_wei} (~{m_wei/1e18} wACP)")
    print(f"prev_caps single={prev_single} day={prev_day}")

    h1 = _send(w3, acct, gw.functions.setCaps(m_wei, m_wei))
    print("setCaps_raise", h1)
    time.sleep(2)
    h2 = _send(w3, acct, gw.functions.mintWrapped(RECIPIENT, m_wei, DEPOSIT_REF))
    print("mintWrapped", h2)
    time.sleep(2)
    h3 = _send(w3, acct, gw.functions.setCaps(prev_single, prev_day))
    print("setCaps_restore", h3)
    print(json.dumps({"setCaps_raise": h1, "mintWrapped": h2, "setCaps_restore": h3}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
